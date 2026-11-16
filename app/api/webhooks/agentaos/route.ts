import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use Service Role Key so the webhook can update profiles securely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-agentaos-signature") ||
      req.headers.get("x-webhook-signature");
    const secret = process.env.AGENTAOS_WEBHOOK_SECRET;

    // 1. Verify webhook signature if secret is configured
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (
        signature !== expectedSignature &&
        signature !== `sha256=${expectedSignature}`
      ) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type || event.event;

    // 2. Handle successful payment / subscription events
    if (
      eventType === "payment.succeeded" ||
      eventType === "checkout.session.completed" ||
      eventType === "subscription.activated" ||
      eventType === "subscription.renewed"
    ) {
      const data = event.data?.object || event.data || event;

      // Extract user identifier passed in checkout URL or customer email
      const profileId = data.client_reference_id || data.metadata?.profile_id;
      const customerEmail =
        data.customer_email || data.email || data.customer?.email;
      const planName = (
        data.plan_name ||
        data.product_name ||
        data.interval ||
        ""
      ).toLowerCase();

      // Determine duration: 1 year for "vjetore"/"year", otherwise 1 month
      const isYearly =
        planName.includes("vjetore") ||
        planName.includes("year") ||
        planName.includes("annual");
      const daysToAdd = isYearly ? 365 : 30;

      // Find the matching business profile using your existing `subscription_end` column
      let query = supabaseAdmin
        .from("profiles")
        .select("id, subscription_end");

      if (profileId) {
        query = query.eq("id", profileId);
      } else if (customerEmail) {
        query = query.eq("email", customerEmail);
      } else {
        return NextResponse.json(
          { error: "No user identifier found in payload" },
          { status: 400 }
        );
      }

      const { data: profile, error: fetchError } = await query.maybeSingle();

      if (fetchError || !profile) {
        return NextResponse.json(
          { error: "Business profile not found" },
          { status: 404 }
        );
      }

      // 3. Calculate new expiration date (extend from current end date if still active, else from now)
      const now = new Date();
      const currentEnd = profile.subscription_end
        ? new Date(profile.subscription_end)
        : now;
      const baseDate = currentEnd > now ? currentEnd : now;

      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);

      // 4. Activate the subscription in Supabase
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_end: newEndDate.toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    // 5. Handle subscription cancellation or expiration
    if (
      eventType === "subscription.canceled" ||
      eventType === "subscription.expired"
    ) {
      const data = event.data?.object || event.data || event;
      const profileId = data.client_reference_id || data.metadata?.profile_id;
      const customerEmail = data.customer_email || data.email;

      if (profileId || customerEmail) {
        const filterCol = profileId ? "id" : "email";
        const filterVal = profileId || customerEmail;

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "inactive" })
          .eq(filterCol, filterVal);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}