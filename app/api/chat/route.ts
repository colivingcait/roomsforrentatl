import { buildSystemPrompt } from "@/lib/knowledge";
import { getHouses } from "@/lib/houses";
import { priceLabel } from "@/lib/format";

// Runs on the server only — the Anthropic API key never reaches the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type BookCard = {
  id: string;
  name: string;
  location: string;
  fromPrice: string | null;
  roomsAvailable: number;
  rating: number | null;
  reviewCount: number | null;
  url: string;
};

// The bot ends a booking reply with a token like `<<<BOOK: 35011, 152>>>`.
// Pull it out, strip it from the visible text, and turn the IDs into cards
// (only for homes that actually have rooms available right now).
function extractBookCards(text: string): { text: string; cards: BookCard[] } {
  const match = text.match(/<<<\s*BOOK:\s*([0-9,\s]+?)>>>/i);
  if (!match) return { text, cards: [] };

  const cleaned = text.replace(match[0], "").trim();
  const ids = Array.from(new Set(match[1].split(",").map((s) => s.trim()).filter(Boolean)));
  const houses = getHouses();
  const cards: BookCard[] = ids
    .map((id) => houses.find((h) => h.id === id))
    .filter((h): h is NonNullable<typeof h> => !!h && h.available && h.roomsAvailable > 0)
    .map((h) => ({
      id: h.id,
      name: h.name,
      location: [h.neighborhood, h.city].filter(Boolean).join(", "),
      fromPrice: h.fromPrice != null ? priceLabel(h.fromPrice, h.priceUnit) : null,
      roomsAvailable: h.roomsAvailable,
      rating: h.rating ?? null,
      reviewCount: h.reviewCount ?? null,
      url: `/house/${h.id}#rooms`,
    }));

  return { text: cleaned, cards };
}

// The bot ends a reply with `<<<CHIPS: Option one | Option two>>>` — short,
// tappable quick replies so the visitor rarely has to type. Pull them out and
// strip the token from the visible text.
function extractChips(text: string): { text: string; chips: string[] } {
  const match = text.match(/<<<\s*CHIPS:\s*([\s\S]+?)>>>/i);
  if (!match) return { text, chips: [] };
  const cleaned = text.replace(match[0], "").trim();
  const chips = Array.from(
    new Set(
      match[1]
        .split("|")
        .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
        .filter(Boolean)
        .map((s) => s.slice(0, 48))
    )
  ).slice(0, 4);
  return { text: cleaned, chips };
}

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

// The chat bubble shows plain text, so strip Markdown the model may emit.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold**
    .replace(/__(.+?)__/g, "$1") // __bold__
    .replace(/(^|\s)\*(\S.*?\S|\S)\*(?=\s|$)/g, "$1$2") // *italics*
    .replace(/^#{1,6}\s+/gm, "") // # headings
    .replace(/^\s*[-*]\s+/gm, "- "); // normalize bullets to "- "
}

// Record each visitor question AND the assistant's answer so you can see what
// people ask and how the bot replied. Always logs to Vercel's function logs;
// if CHAT_LOG_WEBHOOK is set (e.g. a Google Sheet Apps Script URL), it also
// appends there. Fire-and-forget — never blocks the chat.
function logChat(question: string, answer: string, source: string) {
  const q = question.replace(/\s+/g, " ").slice(0, 500);
  const a = answer.replace(/\s+/g, " ").slice(0, 1500);
  console.log(`[chat] (${source}) Q: ${q} | A: ${a}`);
  const webhook = process.env.CHAT_LOG_WEBHOOK;
  if (!webhook) return;
  void fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, answer, source, at: new Date().toISOString() }),
  }).catch(() => {});
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

  // The newest user message is the question being asked this turn.
  const latest = messages[messages.length - 1];
  const question = latest?.role === "user" ? latest.content : "";
  const source = (payload as { source?: unknown }).source === "suggested" ? "suggested" : "typed";
  const rawTrack = (payload as { track?: unknown }).track;
  const track =
    rawTrack === "room" || rawTrack === "unit" || rawTrack === "both" ? rawTrack : null;

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
        system: buildSystemPrompt(track),
        messages,
      }),
    });

    if (!res.ok) {
      // Don't leak provider details to the client.
      console.error("Anthropic API error", res.status, await res.text().catch(() => ""));
      logChat(question, "(assistant unavailable)", source);
      return Response.json(
        { error: "Sorry — I couldn't answer just now. Please try again in a moment." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const reply = stripMarkdown(
      (data.content ?? [])
        .filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
        .trim()
    );

    if (!reply) {
      logChat(question, "(no answer)", source);
      return Response.json(
        { error: "Sorry — I didn't catch that. Could you rephrase?" },
        { status: 502 }
      );
    }

    const booked = extractBookCards(reply);
    const { text, chips } = extractChips(booked.text);
    logChat(question, text, source);
    return Response.json({ reply: text, houses: booked.cards, chips });
  } catch (err) {
    console.error("Chat route error", err);
    logChat(question, "(error)", source);
    return Response.json(
      { error: "Sorry — something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
