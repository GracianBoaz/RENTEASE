const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || ''; 

const callClaude = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.log('Claude API error:', JSON.stringify(errData));
      throw new Error(errData.error?.message || 'API call failed');
    }

    const data = await response.json();
    console.log('Claude response:', JSON.stringify(data));
    return data.content[0].text;
  } catch (err) {
    console.log('callClaude exception:', err);
    throw err;
  }
};

export const suggestPrice = async (
  title: string,
  category: string,
  condition: string
): Promise<{ min: number; max: number; suggested: number; reason: string }> => {
  const prompt = `You are a rental price expert in India. Suggest a daily rental price in Indian Rupees for:
Title: ${title}
Category: ${category}
Condition: ${condition}
Respond ONLY in this JSON format, no other text:
{"min": 100, "max": 500, "suggested": 300, "reason": "Brief reason"}`;
  const result = await callClaude(prompt);
  return JSON.parse(result.replace(/\`\`\`json|\`\`\`/g, '').trim());
};

export const analyzeCondition = async (
  imageBase64: string,
  title: string
): Promise<{ condition: string; confidence: number; notes: string }> => {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Analyze condition of "${title}". Respond ONLY in JSON:
{"condition": "Like New", "confidence": 85, "notes": "observation"}
Condition must be one of: New, Like New, Good, Fair, Poor`,
          },
        ],
      }],
    }),
  });
  const data = await response.json();
  return JSON.parse(data.content[0].text.replace(/\`\`\`json|\`\`\`/g, '').trim());
};

export const checkFraud = async (itemData: {
  title: string;
  description: string;
  price_per_day: number;
  category: string;
  ownerAccountAgeDays: number;
  ownerTotalListings: number;
}): Promise<{ isSuspicious: boolean; riskLevel: 'low' | 'medium' | 'high'; reasons: string[]; score: number }> => {
  const prompt = `You are a fraud detection expert for RentEase, an Indian rental marketplace.
Analyze this listing:
Title: ${itemData.title}
Description: ${itemData.description}
Price per day: ₹${itemData.price_per_day}
Category: ${itemData.category}
Account age: ${itemData.ownerAccountAgeDays} days
Total listings: ${itemData.ownerTotalListings}
Respond ONLY in JSON:
{"isSuspicious": false, "riskLevel": "low", "reasons": [], "score": 15}
riskLevel: low/medium/high, score: 0-100`;
  const result = await callClaude(prompt);
  return JSON.parse(result.replace(/\`\`\`json|\`\`\`/g, '').trim());
};
