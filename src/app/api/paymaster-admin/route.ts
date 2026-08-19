import { NextResponse } from 'next/server';

const PAYMASTER_ENDPOINT = process.env.PAYMASTER_ENDPOINT || 'http://localhost:9097';
const PAYMASTER_APIKEY = process.env.AECAUTOPILOT_APIKEY || 'tR4hTjS954LxUWtRM720BN9yiUbcRUcSB5o9ZjWNVvXGiPFrLtDKRJvSoPDUIw6M';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const adminUrl = `${PAYMASTER_ENDPOINT.replace(/\/+$/, '')}/admin-apis`;

    const response = await fetch(adminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': PAYMASTER_APIKEY,
      },
      body: JSON.stringify(body),
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
    console.error('Error proxying to Paymaster admin-apis:', msg);
    return NextResponse.json({ error: 'Failed to contact Paymaster Admin API', details: msg }, { status: 500 });
  }
}
