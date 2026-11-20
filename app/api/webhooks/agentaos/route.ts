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

    const customerEmail =
      data.buyerEmail || data.buyer_email || data.metadata?.payer?.email || null;

    // Extract profileId directly from checkout metadata
    const profileId =
      data.metadata?.profileId ||
      data.metadata?.profile_id ||
      data.clientReferenceId ||
      null;

    const planLabel = data.metadata?.plan === "vjetore" ? "Vjetore" : "Mujore";
    const daysToAdd = data.metadata?.plan === "vjetore" ? 365 : 30;
    const amount = data.amount != null ? Number(data.amount) : null;
    const currency = (data.currency || "EUR").toUpperCase();

    if (
      eventType === "checkout.session.completed" ||
      eventType === "subscription.renewed"
    ) {
      if (!profileId) {
        await supabaseAdmin.from("payments").insert({
          customer_email: customerEmail,
          event_type: eventType,
          plan_name: planLabel,
          amount,
          currency,
          status: "unmatched_user",
          error_message: "Missing profileId in metadata",
          raw_payload: event,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Fetch profile directly by ID
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("id, subscription_end")
        .eq("id", profileId)
        .maybeSingle();

      if (fetchError || !profile) {
        await supabaseAdmin.from("payments").insert({
          profile_id: profileId,
          customer_email: customerEmail,
          event_type: eventType,
          plan_name: planLabel,
          amount,
          currency,
          status: "unmatched_user",
          error_message: fetchError?.message || `No profile found with id: ${profileId}`,
          raw_payload: event,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Calculate new subscription end date
      const now = new Date();
      const currentEnd = profile.subscription_end
        ? new Date(profile.subscription_end)
        : now;
      const baseDate = currentEnd > now ? currentEnd : now;

      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);

      // Update profile status and expiration
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_end: newEndDate.toISOString(),
          subscription_end_date: newEndDate.toISOString(),
          subscription_plan: planLabel.toLowerCase(), // "mujore" or "vjetore"
          plan_type: planLabel.toLowerCase(),
          updated_at: new Date().toISOString(),
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
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Log successful payment
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

    // Log other events
    await supabaseAdmin.from("payments").insert({
      profile_id: profileId,
      customer_email: customerEmail,
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