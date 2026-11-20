import { NextResponse } from "next/server";
import { AgentaOS } from "@agentaos/pay";

const agentaos = new AgentaOS(process.env.AGENTAOS_API_KEY!);

const PLANS = {
  mujore: {
    name: "Abonim Mujor - Rezervo",
    amount: 15,
    currency: "EUR",
  },
  vjetore: {
    name: "Abonim Vjetor - Rezervo",
    amount: 140,
    currency: "EUR",
  },
};

export async function POST(req: Request) {
  try {
    const { profileId, email, plan } = await req.json();

    if (!profileId || !plan || !(plan in PLANS)) {
      return NextResponse.json(
        { error: "Missing profileId or invalid plan" },
        { status: 400 }
      );
    }

    const selected = PLANS[plan as keyof typeof PLANS];
    
    // Explicitly use your production domain as the base URL to prevent missing/localhost header issues
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rezervo.shop";
    const successUrl = `${baseUrl}/dashboard?payment=success`;
    const cancelUrl = `${baseUrl}/dashboard?payment=canceled`;

    const session = await agentaos.checkouts.create({
      amount: selected.amount,
      currency: selected.currency,
      description: selected.name,
      buyerEmail: email || undefined,
      successUrl,
      cancelUrl,
      metadata: {
        profileId,
        plan,
      },
    } as any);

    const checkoutUrl =
      (session as any).url ||
      (session as any).checkoutUrl ||
      (session as any).checkout_url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "No checkout URL returned from AgentaOS", session },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutUrl }, { status: 200 });
  } catch (err: any) {
    console.error(
      "AgentaOS Checkout Error:",
      JSON.stringify(err?.errors || err?.response?.data || err, null, 2)
    );
    return NextResponse.json(
      {
        error: err?.message || "Failed to create checkout session",
        details: err?.errors || err?.response?.data || null,
      },
      { status: err?.status || 400 }
    );
  }
}