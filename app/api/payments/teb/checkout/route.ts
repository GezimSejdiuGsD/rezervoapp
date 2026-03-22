import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { userId, amount, planName } = await req.json();

  // 1. TEB Credentials (Move these to .env.local)
  const merchantId = process.env.TEB_MERCHANT_ID;
  const terminalId = process.env.TEB_TERMINAL_ID;
  const storeKey = process.env.TEB_STORE_KEY; 
  
  const successUrl = "https://rezervo.shop/dashboard/payment-success";
  const failUrl = "https://rezervo.shop/dashboard/payment-fail";
  const orderId = `ORD-${userId}-${Date.now()}`;
  
  // 2. Generate Hash (The bank requires this for security)
  // Logic: merchantId + orderId + amount + okUrl + failUrl + rnd + storeKey
  const rnd = crypto.randomBytes(20).toString('hex');
  const hashStr = merchantId + orderId + amount + successUrl + failUrl + rnd + storeKey;
  const hash = crypto.createHash('sha1').update(hashStr).digest('base64');

  // 3. Prepare the payload for the TEB Form
  const paymentData = {
    clientid: merchantId,
    storetype: "3d_pay", // Standard for TEB
    amount: amount,
    oid: orderId,
    okUrl: successUrl,
    failUrl: failUrl,
    rnd: rnd,
    hash: hash,
    currency: "978", // Euro code
    lang: "sq",      // Albanian language
  };

  return NextResponse.json(paymentData);
}