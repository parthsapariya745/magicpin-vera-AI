const { generateObject } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
const { z } = require('zod');
const crypto = require('crypto');

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_if_not_provided',
});

async function composeAction(merchant_id, merchantContext, trigger_id, triggerContext, now) {
  // Use category context if available
  const categoryStr = merchantContext?.payload?.identity?.category || "general";
  const categoryContext = global.contexts.category.get(categoryStr) || {};

  const promptContext = `
Time: ${now}
Merchant ID: ${merchant_id}
Merchant Identity/Payload: ${JSON.stringify(merchantContext?.payload || {})}
Category Focus: ${JSON.stringify(categoryContext?.payload || {})}
Trigger ID: ${trigger_id}
Trigger Details: ${JSON.stringify(triggerContext?.payload || {})}
  `;

  const systemPrompt = `You are Vera, an AI growth assistant for merchants. Your goal is to compose a high-compulsion business message that scores perfectly on these 5 dimensions:
1. SPECIFICITY: Use verifiable facts from the provided context (numbers, percentages, prices, dates). Do NOT fabricate data.
2. CATEGORY FIT: Match the business type precisely:
   - Dentists: clinical, peer-to-peer, technical OK, use "Dr." prefix
   - Salons: warm, friendly, practical
   - Restaurants: operator-to-operator
   - Gyms: coaching, motivational
   - Pharmacies: trustworthy, precise
3. MERCHANT FIT: Personalize specifically to the merchant (use name/owner name, actual data, language preference).
4. TRIGGER RELEVANCE: Clearly connect to WHY this message is being sent NOW using data from the trigger payload. Not a generic nudge.
5. ENGAGEMENT COMPULSION: Use loss aversion, curiosity, or social proof. Provide one clear, low-friction yes/no CTA.
IMPORTANT: Never expose internal jargon. Never fabricate data not present in the context. Keep the message concise.`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      temperature: 0,
      system: systemPrompt,
      prompt: promptContext,
      schema: z.object({
        body: z.string().describe("Specific, grounded message using facts from context"),
        cta: z.string().describe("Short, single CTA (e.g. 'open_ended' or 'Yes, start campaign')"),
      })
    });

    return {
      merchant_id,
      trigger_id,
      body: object.body,
      cta: object.cta,
      suppression_key: `${trigger_id}:${merchant_id}:${crypto.createHash('md5').update(now || Date.now().toString()).digest('hex').substring(0, 8)}`
    };
  } catch (error) {
    console.error("AI Action Error:", error);
    return null;
  }
}

async function composeReplyDecision(conversation_id, from_role, message, turn_number) {
  const promptContext = `
Conversation ID: ${conversation_id}
Turn: ${turn_number}
From Role: ${from_role}
Message: "${message}"
  `;

  const systemPrompt = `You are Vera, an AI assistant handling a conversation with a merchant or customer.
Based on their latest message, decide the next action: "send", "wait", or "end".
STRICT RULES:
1. HOSTILE OR SPAM: If they say "stop", "spam", "useless", or show hostility, immediately choose "end".
2. AUTO-REPLIES: If their message looks like an automated reply (e.g., "Thank you for contacting us! Our team will respond shortly"), immediately choose "end" or "wait".
3. COMMITMENT/INTENT: If they say "Ok lets do it" or "Whats next", you MUST switch to ACTION mode. Choose "send" and include action words like "done", "sending", "draft", "here", "confirm", "proceed", or "next" in the body. Do NOT use qualifying questions like "would you", "do you", "what if".
4. If they need time or the conversation seems paused, "wait".
5. If the interaction is complete, "end".
Provide a rationale. If sending, provide the message body. If not sending, body can be empty.`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      temperature: 0,
      system: systemPrompt,
      prompt: promptContext,
      schema: z.object({
        action: z.enum(["send", "wait", "end"]).describe("The next action state"),
        body: z.string().describe("The message to send, or empty string if wait/end"),
        rationale: z.string().describe("Why this action was chosen")
      })
    });

    return object;
  } catch (error) {
    console.error("AI Reply Decision Error:", error);
    return {
      action: "end",
      body: "",
      rationale: "Fallback triggered due to error."
    };
  }
}

module.exports = {
  composeAction,
  composeReplyDecision
};
