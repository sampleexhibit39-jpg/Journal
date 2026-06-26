// fxj-extract worker
// Receives { imageUrl } (a Cloudinary URL) from the frontend,
// sends it to Grok's vision model, asks for structured trade-setup JSON,
// returns { pair, direction, entry, sl, tp, rr, timeframe }.
// The xAI API key never reaches the browser — it's stored as a Worker secret.

const ALLOWED_ORIGIN = "*"; // tighten to your deployed site's origin once live

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const EXTRACT_PROMPT = `This is a screenshot of a forex/trading chart, likely with a long or short position tool drawn on it (showing entry, stop loss, take profit, and risk:reward).

Extract the following fields from the chart and respond with ONLY a raw JSON object, no markdown fences, no extra text:
{
  "pair": "the currency pair or symbol shown, e.g. EURUSD (null if not visible)",
  "direction": "LONG or SHORT (null if not visible)",
  "entry": number or null,
  "sl": number or null,
  "tp": number or null,
  "rr": number or null,
  "timeframe": "string like '1H', '4H', 'D1' or null"
}

If a field is not visible or you are not confident, use null for that field rather than guessing.`;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    try {
      const { imageUrl } = await request.json();
      if (!imageUrl) return json({ error: "Missing imageUrl" }, 400);

      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          // Check https://docs.x.ai for the current vision-capable model name —
          // xAI updates model names periodically, this may need bumping.
          model: "grok-2-vision-1212",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: EXTRACT_PROMPT },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          temperature: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return json({ error: data.error?.message || "Grok API error" }, 502);
      }

      const raw = data.choices?.[0]?.message?.content || "{}";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return json({ error: "Could not parse model response", raw }, 502);
      }

      return json(parsed);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
