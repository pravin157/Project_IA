import { NextResponse } from 'next/server';

const PAYMASTER_ENDPOINT = process.env.PAYMASTER_ENDPOINT || 'https://paymaster.intoaec.ai';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymasterUrl = `${PAYMASTER_ENDPOINT.replace(/\/+$/, '')}/subscriptions`;

    const response = await fetch(paymasterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Object.keys(body).length > 0 ? body : { eventType: 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS' }),
    });

    const text = await response.text();
    
    // Parse JSON if possible to return clean JSON response, otherwise return as text
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: response.status });
    } catch {
      return new Response(text, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error proxying to Paymaster:', msg);
    return NextResponse.json({ error: 'Failed to contact Paymaster API', details: msg }, { status: 500 });
  }
}
