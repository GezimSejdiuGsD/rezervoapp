import { NextResponse } from "next/server";
import { AgentaOS } from "@agentaos/pay";

const agentaos = new AgentaOS(process.env.AGENTAOS_API_KEY!);

const PLANS = {
  mujore: {
    name: "Abonim Mujor - Rezervo",
    amount: 15,
    currency: "EUR",
    interval: "month" as const,
  },
  vjetore: {
    name: "Abonim Vjetor - Rezervo",
    amount: 140,
    currency: "EUR",
    interval: "year" as const,
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
    const origin = req.headers.get("origin") || "https://rezervo.shop";

    // Create a checkout session with profileId locked into metadata
    const session = await agentaos.checkouts.create({
      amount: selected.amount,
      currency: selected.currency,
      name: selected.name,
      customerEmail: email || undefined,
      successUrl: `${origin}/dashboard?payment=success`,
      cancelUrl: `${origin}/dashboard?payment=canceled`,
      metadata: {
        profileId,
        plan,
      },
    } as any);

    const checkoutUrl = (session as any).url || (session as any).checkoutUrl;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "AgentaOS did not return a checkout URL", session },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutUrl }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}