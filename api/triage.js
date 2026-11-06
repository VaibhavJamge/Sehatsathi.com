// Vercel serverless function. Set ANTHROPIC_API_KEY in Vercel project settings.
const SYSTEM = `You are the triage guide inside Sehat Saathi, a health guidance app for people in India.
Reply in the user's language (lang "hi" = simple everyday Hindi in Devanagari, "en" = simple English).
You give guidance and possible reasons, never a diagnosis. You are not a doctor and never claim to be.
Never name prescription drugs or doses. Never say it is fine to wait if symptoms could be serious.
When uncertain, choose the more cautious severity. Severity: "green" = manage at home, "yellow" = see a doctor within 1 to 2 days, "red" = go to hospital now.
Set emergency true for chest pain, severe breathing trouble, stroke signs, heavy bleeding, seizure, unconsciousness, severe allergic reaction, pregnancy emergency, infant with high fever or breathing trouble, poisoning, or any self-harm statement.
Return ONLY JSON, no markdown: {"severity":"green|yellow|red","emergency":false,"why":"string","home":["string"],"warn":["string"],"provider":"string in user language","maps_query":"English Google Maps search e.g. general physician clinic near me"}`;
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const b = req.body || {};
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 800, system: SYSTEM,
        messages: [{ role: "user", content: JSON.stringify(b) }] }),
    });
    const d = await r.json();
    const txt = (d.content || []).map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
    const out = JSON.parse(txt);
    if (!["green", "yellow", "red"].includes(out.severity)) throw new Error("bad severity");
    res.status(200).json(out);
  } catch (e) { res.status(502).json({ error: "triage_failed" }); }
}
