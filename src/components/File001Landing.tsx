import React, { useState, type FormEvent } from "react";
import { GoogleGenAI, Type } from "@google/genai";

const DIMENSIONS = [
  { key: "seo", label: "SEO" },
  { key: "aeo", label: "AEO" },
  { key: "geo", label: "GEO" },
  { key: "agentic", label: "Agentic" },
  { key: "roast", label: "Roast" },
  { key: "velocity", label: "Velocity" },
] as const;

type DimKey = (typeof DIMENSIONS)[number]["key"];

type RoastResult = {
  brand: string;
  url: string;
  verdict: string;
  predictedAsk: string;
  predictedAnswer: string;
  cuts: string[];
  scores: Record<DimKey, number>;
  total: number;
  hundred: number;
  band: string;
  fixes: string[];
  ask: string;
  evidenceNote: string;
};

function bandFor(total: number): string {
  if (total <= 31) return "Invisible. Brochure, not a business.";
  if (total <= 44) return "Findable. Not chosen.";
  if (total <= 53) return "Close. Models still hire the directory.";
  return "In the answer. Don’t fake a crisis.";
}

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(10, Math.round(v)));
}

function parseJson(raw: string): Record<string, unknown> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Charlie returned no JSON.");
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

export function File001Landing({ onLogin }: { onLogin: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roast, setRoast] = useState<RoastResult | null>(null);

  async function onRoast(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const url = String(fd.get("url") ?? "").trim();
    const suburb = String(fd.get("suburb") ?? "").trim() || "their suburb";
    const trade = String(fd.get("trade") ?? "").trim() || "local trade";
    if (!url) return;

    setBusy(true);
    setError(null);

    try {
      const apiKey =
        process.env.GEMINI_API_KEY || (import.meta as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Roast engine is not configured on this deploy.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Audit this business for AI-search visibility.
URL: ${url}
Suburb: ${suburb}
Trade: ${trade}

Score 0-10 each: seo, aeo, geo, agentic, roast, velocity.
You did not fetch the live page and you did not probe ChatGPT. Mark GEO as predicted. Never fabricate citations, rankings, or "ChatGPT said" quotes. Punch the website and the system, never the person. Short, dry, specific, Australian. No prices. JSON only.`,
        config: {
          systemInstruction:
            "You are Charlie, AISEO Phantom for Haus of Technik / Platform OS (Melbourne). Voice: short, dry, specific, Australian. Punch the website and the system, never the person. No corporate filler. No fake warmth. Never fabricate citations, rankings, or ChatGPT quotes. If you did not run a live model probe, mark GEO as predicted. JSON only. No prices.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              verdict: { type: Type.STRING },
              predictedAsk: { type: Type.STRING },
              predictedAnswer: { type: Type.STRING },
              cuts: { type: Type.ARRAY, items: { type: Type.STRING } },
              scores: {
                type: Type.OBJECT,
                properties: {
                  seo: { type: Type.NUMBER },
                  aeo: { type: Type.NUMBER },
                  geo: { type: Type.NUMBER },
                  agentic: { type: Type.NUMBER },
                  roast: { type: Type.NUMBER },
                  velocity: { type: Type.NUMBER },
                },
              },
              fixes: { type: Type.ARRAY, items: { type: Type.STRING } },
              ask: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = parseJson(response.text || "{}");
      const scoresRaw = (parsed.scores ?? {}) as Record<string, unknown>;
      const scores: Record<DimKey, number> = {
        seo: clampScore(scoresRaw.seo),
        aeo: clampScore(scoresRaw.aeo),
        geo: clampScore(scoresRaw.geo),
        agentic: clampScore(scoresRaw.agentic),
        roast: clampScore(scoresRaw.roast),
        velocity: clampScore(scoresRaw.velocity),
      };
      const total = Object.values(scores).reduce((a, b) => a + b, 0);
      const cuts = Array.isArray(parsed.cuts) ? parsed.cuts.map(String) : [];
      const fixes = Array.isArray(parsed.fixes) ? parsed.fixes.map(String) : [];

      setRoast({
        brand: String(parsed.brand || url.replace(/^https?:\/\//, "")),
        url,
        verdict: String(parsed.verdict || "The internet has a rumour."),
        predictedAsk: String(parsed.predictedAsk || `best ${trade} in ${suburb}`),
        predictedAnswer: String(parsed.predictedAnswer || "A directory, a chain, and a dead Facebook page."),
        cuts: [
          cuts[0] || "Homepage is a brochure.",
          cuts[1] || "Hours live in a photo.",
          cuts[2] || "No machine-readable offer.",
        ],
        scores,
        total,
        hundred: Math.round(total * 1.67),
        band: bandFor(total),
        fixes: [
          fixes[0] || "Named service pages.",
          fixes[1] || "FAQ schema with short answers.",
          fixes[2] || "A bookable path an agent can complete.",
        ],
        ask: String(parsed.ask || "Want the sprint, the landing, or the OS demo?"),
        evidenceNote: "GEO is predicted from the public URL, not a live ChatGPT ranking.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Roast failed.");
      setRoast(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="file001 min-h-screen bg-[#070706] text-[#E8E0D0] antialiased"
      style={{
        fontFamily: "'Figtree', ui-sans-serif, system-ui, sans-serif",
        backgroundImage:
          "radial-gradient(1200px 600px at 50% -10%, rgba(196,163,90,0.08), transparent 60%), linear-gradient(180deg, #0b0a08 0%, #070706 40%)",
      }}
    >
      <header className="flex items-center justify-between border-b border-[#2A261C] px-5 py-4 md:px-10">
        <p className="font-mono text-[11px] tracking-[0.22em] text-[#C4A35A] uppercase">Charlie · File 001</p>
        <div className="flex items-center gap-5">
          <p className="hidden font-mono text-[11px] tracking-[0.18em] text-[#8A8478] uppercase sm:block">Melbourne</p>
          <button
            type="button"
            onClick={onLogin}
            className="font-mono text-[11px] tracking-[0.18em] text-[#8A8478] uppercase hover:text-[#C4A35A]"
          >
            Log in
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-2 md:items-center md:px-10 md:py-16">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-[#C4A35A] uppercase">Be ready or be gone</p>
          <h1
            className="mt-4 text-4xl leading-[1.05] text-[#E8E0D0] italic md:text-6xl"
            style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif" }}
          >
            If ChatGPT can’t name you, you don’t exist.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#8A8478]">
            You won the inbox. You’re late to the graph. Paste a URL. Charlie scores the public story on six dimensions
            and roasts what’s actually broken.
          </p>
        </div>
        <div className="overflow-hidden rounded-[20px] border border-[#2A261C] bg-[#12110E]">
          <video
            className="aspect-square w-full object-cover"
            src="/ident.mp4"
            poster="/og.jpg"
            autoPlay
            muted
            loop
            playsInline
            controls
            aria-label="Charlie ident"
          />
        </div>
      </section>

      <section id="roast" className="mx-auto max-w-3xl px-5 pb-16 md:px-10">
        <form onSubmit={onRoast} className="rounded-[20px] border border-[#2A261C] bg-[#12110E] p-5 md:p-7">
          <p className="font-mono text-[11px] tracking-[0.22em] text-[#C4A35A] uppercase">Brand Roast · Free</p>
          <h2
            className="mt-2 text-3xl text-[#E8E0D0] italic"
            style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif" }}
          >
            One URL in. Six scores out.
          </h2>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-xs font-medium tracking-wide text-[#8A8478] uppercase">
              Website
              <input
                id="url"
                name="url"
                required
                inputMode="url"
                placeholder="yourworkshop.com.au"
                autoComplete="url"
                className="h-12 w-full rounded-lg border border-[#2A261C] bg-[#1A1814] px-4 text-sm text-[#E8E0D0] placeholder:text-[#8A8478] outline-none focus:border-[#C4A35A]/60 focus:ring-2 focus:ring-[#C4A35A]/30"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-medium tracking-wide text-[#8A8478] uppercase">
                Suburb
                <input
                  id="suburb"
                  name="suburb"
                  placeholder="Thomastown"
                  autoComplete="address-level2"
                  className="h-12 w-full rounded-lg border border-[#2A261C] bg-[#1A1814] px-4 text-sm text-[#E8E0D0] placeholder:text-[#8A8478] outline-none focus:border-[#C4A35A]/60 focus:ring-2 focus:ring-[#C4A35A]/30"
                />
              </label>
              <label className="grid gap-2 text-xs font-medium tracking-wide text-[#8A8478] uppercase">
                Trade
                <input
                  id="trade"
                  name="trade"
                  placeholder="tyres / plumbing / HVAC"
                  className="h-12 w-full rounded-lg border border-[#2A261C] bg-[#1A1814] px-4 text-sm text-[#E8E0D0] placeholder:text-[#8A8478] outline-none focus:border-[#C4A35A]/60 focus:ring-2 focus:ring-[#C4A35A]/30"
                />
              </label>
            </div>
            <button
              type="submit"
              id="roast-submit"
              disabled={busy}
              className="h-12 rounded-lg bg-[#C4A35A] px-5 text-sm font-medium text-[#070706] hover:bg-[#8A7340] disabled:opacity-40"
            >
              {busy ? "Reading the public story…" : "Roast the brand"}
            </button>
            {error ? <p className="text-sm text-[#B54A2A]">{error}</p> : null}
          </div>
        </form>

        {roast ? <Scorecard roast={roast} /> : null}
      </section>

      <section className="border-t border-[#2A261C] px-5 py-16 md:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[11px] tracking-[0.22em] text-[#C4A35A] uppercase">File 001 · Podium</p>
          <h2
            className="mt-3 text-4xl text-[#E8E0D0] italic"
            style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif" }}
          >
            You won the inbox. You’re late to the graph.
          </h2>
          <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-[#8A8478]">
            <p>You built an employee who answers in 36 seconds. OpenAI wrote you up. Jerry never sleeps.</p>
            <p>He lives inside the shop. He does not put the shop inside the answer.</p>
            <p>
              Sixty thousand businesses. Still filed under texting. Reviews trained Google. They barely trained the
              engines that now decide who gets the job.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2A261C] px-5 py-8 text-center md:px-10">
        <p
          className="text-2xl italic text-[#E8E0D0]"
          style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif" }}
        >
          Be ready or be gone.
        </p>
        <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-[#8A8478] uppercase">
          Haus of Technik · Platform OS
        </p>
        <a
          href="mailto:wai@platformos.studio"
          className="mt-4 inline-block font-mono text-[11px] tracking-[0.18em] text-[#C4A35A] uppercase"
        >
          Talk to Haus
        </a>
      </footer>
    </div>
  );
}

function Scorecard({ roast }: { roast: RoastResult }) {
  return (
    <article className="mt-8 rounded-[20px] border border-[#2A261C] bg-[#12110E] p-5 md:p-7">
      <p className="font-mono text-[11px] tracking-[0.22em] text-[#C4A35A] uppercase">
        {roast.brand} · {roast.total}/60 · {roast.hundred}/100
      </p>
      <h3
        className="mt-3 text-3xl leading-tight text-[#E8E0D0] italic"
        style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif" }}
      >
        {roast.verdict}
      </h3>
      <p className="mt-3 text-sm text-[#8A8478]">{roast.band}</p>
      <p className="mt-5 text-sm leading-relaxed text-[#E8E0D0]">
        Ask a model “{roast.predictedAsk}” and it names {roast.predictedAnswer}
      </p>
      <ol className="mt-6 grid gap-3">
        {roast.cuts.map((cut, i) => (
          <li key={i} className="border-l border-[#C4A35A] pl-4 text-sm leading-relaxed text-[#E8E0D0]">
            {cut}
          </li>
        ))}
      </ol>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="rounded-xl border border-[#2A261C] bg-[#1A1814] p-3">
            <p className="font-mono text-[10px] tracking-[0.18em] text-[#8A8478] uppercase">{d.label}</p>
            <p
              className="mt-1 text-3xl tabular-nums text-[#C4A35A] italic"
              style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif" }}
            >
              {roast.scores[d.key]}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <p className="font-mono text-[11px] tracking-[0.18em] text-[#C4A35A] uppercase">Fixes this month</p>
        <ul className="mt-3 grid gap-2 text-sm text-[#E8E0D0]">
          {roast.fixes.map((fix) => (
            <li key={fix}>{fix}</li>
          ))}
        </ul>
      </div>
      <p className="mt-6 text-sm text-[#E8E0D0]">{roast.ask}</p>
      <p className="mt-4 font-mono text-[10px] tracking-wide text-[#8A8478] uppercase">{roast.evidenceNote}</p>
    </article>
  );
}

export default File001Landing;
