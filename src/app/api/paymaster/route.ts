import { NextResponse } from 'next/server';

const PAYMASTER_PROD_ENDPOINT = process.env.PAYMASTER_ENDPOINT || 'https://paymaster.intoaec.ai';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventType = body?.eventType || 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS';

    const url = `${PAYMASTER_PROD_ENDPOINT.replace(/\/+$/, '')}/subscriptions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Object.keys(body).length > 0 ? body : { eventType }),
    });

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: res.status });
    } catch {
      return new Response(text, {
        status: res.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error proxying to Paymaster:', msg);
    return NextResponse.json({ error: 'Failed to contact Paymaster API', details: msg }, { status: 500 });
  }
}
