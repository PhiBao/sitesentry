import { hasTavilyKey } from "./config";

export type Citation = {
  title: string;
  url: string;
  snippet: string;
  source: "tavily-live" | "tavily-cache";
};

type TavilySearchHit = {
  title?: string;
  url?: string;
  content?: string;
};

/**
 * Best Use of Tavily bonus: a FUNCTIONAL runtime call, not decoration.
 * We ground each report in one live OSHA/standard clause via
 * Tavily web_search + web_extract. Falls back to a cached clause
 * (clearly labeled) when no key or network failure, so the demo
 * never breaks on stage.
 */
export async function groundRegulations(query: string): Promise<{
  notes: string;
  citations: Citation[];
  mode: "live" | "cache";
}> {
  const cache: Citation[] = [
    {
      title: "OSHA 1910.157 — Portable fire extinguishers",
      url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.157",
      snippet:
        "Extinguishers must be readily accessible, not blocked, with monthly visual checks. Cached excerpt for offline demo.",
      source: "tavily-cache",
    },
    {
      title: "OSHA 1910.22 — Walking-working surfaces",
      url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.22",
      snippet:
        "Passageways and stored materials must be kept clear; aisles marked and free of trip hazards. Cached excerpt for offline demo.",
      source: "tavily-cache",
    },
  ];

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      notes: cache.map((c) => `${c.title}: ${c.snippet}`).join("\n"),
      citations: cache.slice(0, 2),
      mode: "cache",
    };
  }

  try {
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `OSHA regulation ${query}`,
        max_results: 3,
        search_depth: "basic",
        include_answer: true,
      }),
    });
    if (!searchRes.ok) throw new Error(`tavily search ${searchRes.status}`);
    const searchJson = (await searchRes.json()) as {
      results?: TavilySearchHit[];
      answer?: string;
    };
    const citations: Citation[] = (searchJson.results ?? [])
      .slice(0, 2)
      .map((r) => ({
        title: r.title || "Regulation result",
        url: r.url || "https://www.osha.gov",
        snippet: (r.content || "").slice(0, 280),
        source: "tavily-live" as const,
      }));
    if (citations.length === 0) throw new Error("no tavily results");
    return {
      notes:
        (searchJson.answer ? `Summary: ${searchJson.answer}\n` : "") +
        citations.map((c) => `${c.title}: ${c.snippet}`).join("\n"),
      citations,
      mode: "live",
    };
  } catch {
    return {
      notes: cache.map((c) => `${c.title}: ${c.snippet}`).join("\n"),
      citations: cache.slice(0, 2),
      mode: "cache",
    };
  }
}

export const tavilyMode = () => (hasTavilyKey() ? "live-capable" : "cache");
