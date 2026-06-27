// fxj-coach worker
// Receives { summary, history, message } from the frontend,
// calls Claude with the journal summary as context, returns { reply }.
// The Anthropic API key never reaches the browser — it's stored as a Worker secret.

const ALLOWED_ORIGIN = "*"; // tighten to your deployed site's origin once live, e.g. "https://fx-journal-yourname.vercel.app"

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    try {
      const { summary, history = [], message } = await request.json();
      if (!message) {
        return json({ error: "Missing message" }, 400);
      }

      const systemPrompt = `You are an FX trading coach embedded inside a trading journal app. You have access to the trader's journal summary below. Be direct, specific, and reference their actual numbers when relevant. Keep replies under 150 words unless asked for a deep analysis. Avoid generic platitudes.

JOURNAL SUMMARY:
${summary || "No trade data yet."}`;

      const messages = [
        ...history.slice(-4),
        { role: "user", content: message },
      ];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          system: systemPrompt,
          messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return json({ error: data.error?.message || "Claude API error" }, 502);
      }

      const reply = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      return json({ reply });
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
