import { NextResponse } from 'next/server';

const rawEndpoint = process.env.USERHUB_SESSION_ENDPOINT || 'https://userhub.intoaec.ai/session';
const USERHUB_SESSION_ENDPOINT = rawEndpoint.endsWith('/session')
  ? rawEndpoint
  : `${rawEndpoint.replace(/\/+$/, '')}/session`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const res = await fetch(USERHUB_SESSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(async () => {
      const text = await res.text();
      return { raw: text };
    });

    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error proxying session request:', msg);
    return NextResponse.json({ error: 'Failed to contact UserHub session endpoint', details: msg }, { status: 500 });
  }
}
