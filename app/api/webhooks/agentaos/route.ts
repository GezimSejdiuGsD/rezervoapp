import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AgentaOS, WebhookVerificationError } from "@agentaos/pay";

const agentaos = new AgentaOS(process.env.AGENTAOS_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  let rawBody = "";
  let event: any = null;

  try {
    rawBody = await req.text();
    const signature = req.headers.get("x-agentaos-signature") || "";
    const secret = process.env.AGENTAOS_WEBHOOK_SECRET!;

    // 1. Verify signature using official AgentaOS SDK (handles timestamp + HMAC-SHA256)
    try {
      event = agentaos.webhooks.verify(rawBody, signature, secret);
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
      throw err;
    }

    const eventType: string = event.type || "unknown";
    const data = event.data || {};

    // Handle dashboard "Send Test" button cleanly
    if (eventType === "webhook.test") {
      await supabaseAdmin.from("payments").insert({
        event_type: "webhook.test",
        status: "test_ok",
        raw_payload: event,
      });
      return NextResponse.json({ received: true, test: true }, { status: 200 });
    }

    // Extract user & plan details (SDK returns camelCase, fallback to snake_case)
    const profileId =
      data.clientReferenceId ||
      data.client_reference_id ||
      data.metadata?.profile_id ||
      data.metadata?.profileId ||
      null;

    const customerEmail =
      data.customerEmail ||
      data.customer_email ||
      data.email ||
      data.customer?.email ||
      null;

    const planName =
      data.planName ||
      data.plan_name ||
      data.productName ||
      data.product_name ||
      data.interval ||
      null;

    const amount = data.amount != null ? Number(data.amount) : null;
    const currency = (data.currency || "EUR").toUpperCase();

    // 2. Handle successful checkout or subscription activation/renewal
    if (
      eventType === "checkout.session.completed" ||
      eventType === "subscription.created" ||
      eventType === "subscription.activated" ||
      eventType === "subscription.renewed" ||
      (eventType === "subscription.updated" && data.status === "active")
    ) {
      const normalizedPlan = (planName || "").toLowerCase();
      // Check plan name or amount (e.g., >= 100 EUR for yearly)
      const isYearly =
        normalizedPlan.includes("vjetore") ||
        normalizedPlan.includes("year") ||
        normalizedPlan.includes("annual") ||
        (amount !== null && amount >= 100);

      const daysToAdd = isYearly ? 365 : 30;

      // Match business profile by ID or email
      let query = supabaseAdmin
        .from("profiles")
        .select("id, subscription_end");

      if (profileId) {
        query = query.eq("id", profileId);
      } else if (customerEmail) {
        query = query.eq("email", customerEmail);
      } else {
        await supabaseAdmin.from("payments").insert({
          customer_email: customerEmail,
          event_type: eventType,
          plan_name: planName,
          amount,
          currency,
          status: "unmatched_user",
          error_message: "No clientReferenceId or email in payload",
          raw_payload: event,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { data: profile, error: fetchError } = await query.maybeSingle();

      if (fetchError || !profile) {
        await supabaseAdmin.from("payments").insert({
          customer_email: customerEmail,
          event_type: eventType,
          plan_name: planName,
          amount,
          currency,
          status: "unmatched_user",
          error_message:
            fetchError?.message ||
            `Profile not found (ID: ${profileId}, Email: ${customerEmail})`,
          raw_payload: event,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Extend subscription from current end date if active, otherwise from now
      const now = new Date();
      const currentEnd = profile.subscription_end
        ? new Date(profile.subscription_end)
        : now;
      const baseDate = currentEnd > now ? currentEnd : now;

      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_end: newEndDate.toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) {
        await supabaseAdmin.from("payments").insert({
          profile_id: profile.id,
          customer_email: customerEmail,
          event_type: eventType,
          plan_name: planName,
          amount,
          currency,
          status: "error",
          error_message: updateError.message,
          raw_payload: event,
        });
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      await supabaseAdmin.from("payments").insert({
        profile_id: profile.id,
        customer_email: customerEmail,
        event_type: eventType,
        plan_name: planName || (isYearly ? "Vjetore" : "Mujore"),
        amount,
        currency,
        status: "processed",
        raw_payload: event,
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 3. Handle cancellation / expiration
    if (
      eventType === "subscription.canceled" ||
      eventType === "subscription.deleted" ||
      eventType === "subscription.expired"
    ) {
      let matchedProfileId = profileId;

      if (profileId || customerEmail) {
        const filterCol = profileId ? "id" : "email";
        const filterVal = profileId || customerEmail;

        const { data: updatedProfile } = await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "inactive" })
          .eq(filterCol, filterVal)
          .select("id")
          .maybeSingle();

        matchedProfileId = updatedProfile?.id || profileId;
      }

      await supabaseAdmin.from("payments").insert({
        profile_id: matchedProfileId,
        customer_email: customerEmail,
        event_type: eventType,
        plan_name: planName,
        status: "canceled",
        raw_payload: event,
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 4. Log any other event types
    await supabaseAdmin.from("payments").insert({
      profile_id: profileId,
      customer_email: customerEmail,
      event_type: eventType,
      plan_name: planName,
      amount,
      currency,
      status: "ignored",
      raw_payload: event,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    await supabaseAdmin.from("payments").insert({
      event_type: event?.type || "error",
      status: "error",
      error_message: err.message || "Webhook handler failed",
      raw_payload: event || { rawBody },
    });

    return NextResponse.json(
      { error: err.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}