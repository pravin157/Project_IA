import { NextResponse } from 'next/server';

const AECAUTOPILOT_ENDPOINT = process.env.AECAUTOPILOT_ENDPOINT || 'https://aecautopilot.intoaec.ai';
const DEFAULT_API_KEY = process.env.AECAUTOPILOT_APIKEY || 'tR4hTjS954LxUWtRM720BN9yiUbcRUcSB5o9ZjWNVvXGiPFrLtDKRJvSoPDUIw6M';

export async function POST(request: Request) {
  try {
    const customApiKey = request.headers.get('x-custom-apikey');
    const apiKey = customApiKey || DEFAULT_API_KEY;
    const body = await request.json().catch(() => ({}));
    const autopilotUrl = `${AECAUTOPILOT_ENDPOINT.replace(/\/+$/, '')}/autopilot`;

    const response = await fetch(autopilotUrl, {
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
    console.error('Error proxying to Autopilot API:', msg);
    return NextResponse.json({ error: 'Failed to contact Autopilot API', details: msg }, { status: 500 });
  }
}
