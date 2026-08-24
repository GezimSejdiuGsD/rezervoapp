import { NextResponse } from 'next/server';

const SENT_API_URL_PROD = 'https://api.sent.dm/v3/messages';
const SENT_API_URL_DEV  = 'https://api-dev.sent.dm/v3/messages';

export async function POST(req: Request) {
  const {
    to,
    clientName,
    clientPhone,
    date,
    time,
    serviceName,
    businessName,
  } = await req.json();

  const apiKey = process.env.SENT_API_KEY;
  const templateId = process.env.SENT_TEMPLATE_ID;
  const sandbox = process.env.SENT_SANDBOX === 'true';

  console.log(`[Sent] Mode: ${sandbox ? 'DEV' : 'PROD'} | Recipient: ${to}`);

  if (!apiKey || !templateId) {
    return NextResponse.json(
      { error: 'Missing SENT_API_KEY or SENT_TEMPLATE_ID in environment variables.' },
      { status: 500 }
    );
  }

  if (!to) {
    return NextResponse.json({ error: 'Recipient phone number is required.' }, { status: 400 });
  }

  const apiUrl = sandbox ? SENT_API_URL_DEV : SENT_API_URL_PROD;

  const payload: Record<string, unknown> = {
    to: Array.isArray(to) ? to : [to],
    template: {
      id: templateId,
      parameters: {
        client: clientName,
        courseName: serviceName || businessName,
        courseUrl: `${clientPhone} - ${date} ${time}`,
      },
    },
    channel: ['sms'],
  };

  console.log(`[Sent] Sending SMS to ${to} via ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const pick = (v: unknown) => (typeof v === 'string' ? v : null);
    const errorMessage =
      pick(data?.error?.message) ?? pick(data?.message) ?? pick(data?.detail) ?? JSON.stringify(data) ?? 'Sent API request failed.';
    console.error(`[Sent] FAILED (${response.status}) → ${to}: ${errorMessage}`);
    return NextResponse.json(
      { error: errorMessage, raw: data, status: response.status },
      { status: response.status }
    );
  }

  const messageId = data?.data?.recipients?.[0]?.message_id ?? 'unknown';
  console.log(`[Sent] SUCCESS → ${to} | message_id: ${messageId} | status: ${data?.data?.status}`);

  return NextResponse.json({ success: true, data }, { status: 202 });
}
