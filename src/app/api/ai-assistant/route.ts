import { NextResponse } from 'next/server';
import { generateCsInsights } from '@/server/ai/gemini';

export async function POST(request: Request) {
  try {
    const { prompt, contextData } = await request.json().catch(() => ({}));
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    const answer = await generateCsInsights(prompt, contextData || {});
    return NextResponse.json({ answer });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('AI Assistant error:', msg);
    return NextResponse.json({ error: 'AI Assistant error', details: msg }, { status: 500 });
  }
}
