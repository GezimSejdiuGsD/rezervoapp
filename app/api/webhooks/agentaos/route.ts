import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AgentaOS, WebhookVerificationError } from "@agentaos/pay";

const agentaos = new AgentaOS(process.env.AGENTAOS_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Replace with your Vjetore payment link ID once created
const YEARLY_LINK_ID = "YOUR_VJETORE_LINK_ID";

export async function POST(req: Request) {
  let rawBody = "";
  let event: any = null;

  try {
    rawBody = await req.text();
    const signature = req.headers.get("x-agentaos-signature") || "";
    const secret = process.env.AGENTAOS_WEBHOOK_SECRET!;

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

    if (eventType === "webhook.test") {
      await supabaseAdmin.from("payments").insert({
        event_type: "webhook.test",
        status: "test_ok",
        raw_payload: event,
      });
      return NextResponse.json({ received: true, test: true }, { status: 200 });
    }

    // Extract email from AgentaOS's exact fields (camelCase from SDK + snake_case fallback)
    const customerEmail = (
      data.buyerEmail ||
      data.buyer_email ||
      data.metadata?.payer?.email ||
      data.customerEmail ||
      data.customer_email ||
      data.email ||
      ""
    )
      .trim()
      .toLowerCase();

    const profileId =
      data.clientReferenceId ||
      data.client_reference_id ||
      data.metadata?.profileId ||
      data.metadata?.profile_id ||
      null;

    const linkId = data.linkId || data.link_id || null;
    const amount = data.amount != null ? Number(data.amount) : null;
    const currency = (data.currency || "EUR").toUpperCase();

    // Determine if Yearly or Monthly using linkId or amount
    const isYearly =
      (linkId && linkId === YEARLY_LINK_ID) ||
      (amount !== null && amount >= 100);
    const planLabel = isYearly ? "Vjetore" : "Mujore";
    const daysToAdd = isYearly ? 365 : 30;

    // Only activate on checkout.session.completed or subscription.renewed
    // (Prevents double-counting when both subscription.created and checkout.session.completed fire together)
    if (
      eventType === "checkout.session.completed" ||
      eventType === "subscription.renewed"
    ) {
      let query = supabaseAdmin
        .from("profiles")
        .select("id, email, subscription_end");

      if (profileId) {
        query = query.eq("id", profileId);
      } else if (customerEmail) {
        query = query.ilike("email", customerEmail);
      } else {
        await supabaseAdmin.from("payments").insert({
          customer_email: customerEmail || null,
          event_type: eventType,
          plan_name: planLabel,
          amount,
          currency,
          status: "unmatched_user",
          error_message: "No buyerEmail or profileId in payload",
          raw_payload: event,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { data: profile, error: fetchError } = await query.maybeSingle();

      if (fetchError || !profile) {
        await supabaseAdmin.from("payments").insert({
          customer_email: customerEmail || null,
          event_type: eventType,
          plan_name: planLabel,
          amount,
          currency,
          status: "unmatched_user",
          error_message:
            fetchError?.message ||
            `No profile matched email: ${customerEmail}`,
          raw_payload: event,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Extend from current end date if active, otherwise from now
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
          plan_name: planLabel,
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
        plan_name: planLabel,
        amount,
        currency,
        status: "processed",
        raw_payload: event,
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Handle cancellation / expiration
    if (
      eventType === "subscription.canceled" ||
      eventType === "subscription.deleted" ||
      eventType === "subscription.expired"
    ) {
      let matchedProfileId = profileId;

      if (profileId || customerEmail) {
        const { data: updatedProfile } = profileId
          ? await supabaseAdmin
              .from("profiles")
              .update({ subscription_status: "inactive" })
              .eq("id", profileId)
              .select("id")
              .maybeSingle()
          : await supabaseAdmin
              .from("profiles")
              .update({ subscription_status: "inactive" })
              .ilike("email", customerEmail)
              .select("id")
              .maybeSingle();

        matchedProfileId = updatedProfile?.id || profileId;
      }

      await supabaseAdmin.from("payments").insert({
        profile_id: matchedProfileId,
        customer_email: customerEmail || null,
        event_type: eventType,
        plan_name: planLabel,
        status: "canceled",
        raw_payload: event,
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Log subscription.created and other informational events without double-adding days
    await supabaseAdmin.from("payments").insert({
      profile_id: profileId,
      customer_email: customerEmail || null,
      event_type: eventType,
      plan_name: planLabel,
      amount,
      currency,
      status: "logged",
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