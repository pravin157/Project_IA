import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

export async function generateCsInsights(prompt: string, contextData: unknown): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    return 'Gemini API Key is not configured. Please add GEMINI_API_KEY to your environment or secrets to enable AI Insights.';
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an expert Customer Success AI Assistant helping a non-technical CS team at an AEC (Architecture, Engineering, Construction) SaaS platform called IntoAEC.
Keep all responses extremely friendly, clear, empathetic, action-oriented, and free of dry developer jargon.

Context Data:
${JSON.stringify(contextData, null, 2)}

User Request:
${prompt}`,
            },
          ],
        },
      ],
    });

    return response.text || 'No response generated from AI.';
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error in Gemini generateCsInsights:', errorMessage);
    return `Unable to generate AI CS insight: ${errorMessage}`;
  }
}
