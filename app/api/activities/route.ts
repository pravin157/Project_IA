import { NextResponse } from 'next/server';

const AECAUTOPILOT_ENDPOINT = process.env.AECAUTOPILOT_ENDPOINT || 'https://aecautopilot.intoaec.ai';
const DEFAULT_API_KEY = process.env.AECAUTOPILOT_APIKEY || 'tR4hTjS954LxUWtRM720BN9yiUbcRUcSB5o9ZjWNVvXGiPFrLtDKRJvSoPDUIw6M';

export async function POST(request: Request) {
  try {
    const customApiKey = request.headers.get('x-custom-apikey');
    const apiKey = customApiKey || DEFAULT_API_KEY;
    const body = await request.json().catch(() => ({}));
    const activitiesUrl = `${AECAUTOPILOT_ENDPOINT.replace(/\/+$/, '')}/activities`;

    const response = await fetch(activitiesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

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
    console.error('Error proxying to Activities API:', msg);
    return NextResponse.json({ error: 'Failed to contact Activities API', details: msg }, { status: 500 });
  }
}
