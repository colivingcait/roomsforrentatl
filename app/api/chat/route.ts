import { buildSystemPrompt } from "@/lib/knowledge";

// Runs on the server only — the Anthropic API key never reaches the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TURNS = 12; // cap conversation length we forward
const MAX_CHARS = 1500; // cap per-message length

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitize(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const msgs: ChatMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role === "user" || role === "assistant") && typeof content === "string") {
      const text = content.trim().slice(0, MAX_CHARS);
      if (text) msgs.push({ role, content: text });
    }
  }
  // Keep the most recent turns; the API requires the first message to be "user".
  const trimmed = msgs.slice(-MAX_TURNS);
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
  return trimmed;
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json(
      { error: "The chat assistant isn't configured yet. Please text us instead." },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = sanitize((payload as { messages?: unknown }).messages);
  if (!messages.length) {
    return Response.json({ error: "Please type a question." }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: buildSystemPrompt(),
        messages,
      }),
    });

    if (!res.ok) {
      // Don't leak provider details to the client.
      console.error("Anthropic API error", res.status, await res.text().catch(() => ""));
      return Response.json(
        { error: "Sorry — I couldn't answer just now. Please text us and we'll help right away." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const reply = (data.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!reply) {
      return Response.json(
        { error: "Sorry — I didn't catch that. Could you rephrase, or text us?" },
        { status: 502 }
      );
    }

    return Response.json({ reply });
  } catch (err) {
    console.error("Chat route error", err);
    return Response.json(
      { error: "Sorry — something went wrong. Please text us and we'll help." },
      { status: 500 }
    );
  }
}
