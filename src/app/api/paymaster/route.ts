import { NextResponse } from 'next/server';

const PAYMASTER_PROD_ENDPOINT = process.env.PAYMASTER_ENDPOINT || 'http://localhost:9097';
const PAYMASTER_SANDBOX_ENDPOINT = process.env.PAYMASTER_SANDBOX_ENDPOINT || 'https://paymaster.intoaec.ai';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventType = body?.eventType || 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS';

    // Helper function to call a specific endpoint
    const callPaymaster = async (baseEndpoint: string) => {
      const url = `${baseEndpoint.replace(/\/+$/, '')}/subscriptions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.keys(body).length > 0 ? body : { eventType }),
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch { }
      return { status: res.status, text, json };
    };

    // Route based on eventType
    if (eventType === 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS') {
      // Sandbox only
      const result = await callPaymaster(PAYMASTER_SANDBOX_ENDPOINT);
      if (result.json) return NextResponse.json(result.json, { status: result.status });
      return new Response(result.text, { status: result.status, headers: { 'Content-Type': 'text/plain' } });
    }

    if (eventType === 'GET_ORGANIZATIONS_WITH_USER_COUNT') {
      // Production only (Sales dashboard)
      const result = await callPaymaster(PAYMASTER_PROD_ENDPOINT);
      if (result.json) return NextResponse.json(result.json, { status: result.status });
      return new Response(result.text, { status: result.status, headers: { 'Content-Type': 'text/plain' } });
    }

    if (eventType === 'GET_ORGANIZATION_SUBSCRIPTION_DETAILS') {
      // Try production first
      const prodResult = await callPaymaster(PAYMASTER_PROD_ENDPOINT);
      if (prodResult.status === 200 && prodResult.json && prodResult.json.body !== null) {
        return NextResponse.json(prodResult.json, { status: 200 });
      }

      // If not found (or error) in production, fall back to sandbox
      const sandboxResult = await callPaymaster(PAYMASTER_SANDBOX_ENDPOINT);
      if (sandboxResult.json) return NextResponse.json(sandboxResult.json, { status: sandboxResult.status });
      return new Response(sandboxResult.text, { status: sandboxResult.status, headers: { 'Content-Type': 'text/plain' } });
    }

    // Default: try production first, fall back to sandbox
    const prodResult = await callPaymaster(PAYMASTER_PROD_ENDPOINT);
    if (prodResult.status === 200) {
      if (prodResult.json) return NextResponse.json(prodResult.json, { status: 200 });
      return new Response(prodResult.text, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    const sandboxResult = await callPaymaster(PAYMASTER_SANDBOX_ENDPOINT);
    if (sandboxResult.json) return NextResponse.json(sandboxResult.json, { status: sandboxResult.status });
    return new Response(sandboxResult.text, { status: sandboxResult.status, headers: { 'Content-Type': 'text/plain' } });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error proxying to Paymaster:', msg);
    return NextResponse.json({ error: 'Failed to contact Paymaster API', details: msg }, { status: 500 });
  }
}
