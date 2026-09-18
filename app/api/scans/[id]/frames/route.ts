import { NextResponse } from "next/server";
import { MODELS, SITE_PROFILES } from "@/lib/config";
import { cosmosScenePass, nemotronTriage } from "@/lib/nebius";
import { loadScan, saveScan } from "@/lib/store";
import { seededHazards, type Hazard } from "@/lib/demo";

function parseHazards(text: string): Omit<Hazard, "id" | "frameId">[] | null {
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return null;
    const arr = JSON.parse(text.slice(start, end + 1)) as {
      label?: string;
      severity?: string;
      where?: string;
    }[];
    if (!Array.isArray(arr)) return null;
    return arr
      .filter((h) => h.label)
      .slice(0, 6)
      .map((h) => ({
        label: String(h.label).slice(0, 120),
        severity: h.severity === "high" || h.severity === "low" ? h.severity : "medium",
        where: String(h.where || "in frame").slice(0, 120),
      }));
  } catch {
    return null;
  }
}

/** POST /api/scans/:id/frames — attach a frame note (or base64 stub) and run detection. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const scan = await loadScan(id);
  if (!scan) return NextResponse.json({ error: "scan not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { note?: string };
  const profileLabel =
    SITE_PROFILES.find((p) => p.id === scan.profile)?.label ?? scan.profile;
  const frameId = `f${scan.frames.length + 1}`;
  const note = String(body.note || `Frame ${frameId}: general walkaround view`).slice(0, 500);

  const started = Date.now();
  let hazards: Hazard[] = [];
  let mode: "live" | "demo" = "demo";
  let tokens = 0;
  const models: string[] = [];

  try {
    if (!process.env.NEBIUS_API_KEY) throw new Error("no key — demo path");
    const scene = await cosmosScenePass(note, profileLabel);
    models.push(MODELS.vlm);
    tokens += scene.usage.totalTokens;
    const triage = await nemotronTriage(scene.text);
    models.push(MODELS.fast);
    tokens += triage.usage.totalTokens;
    const parsed = parseHazards(triage.text) ?? parseHazards(scene.text);
    if (!parsed) throw new Error("unparseable model output");
    hazards = parsed.map((h, i) => ({
      ...h,
      id: `${id}-${frameId}-${i + 1}`,
      frameId,
    }));
    mode = "live";
  } catch {
    // Deterministic fallback: demo hazards, honestly labeled.
    hazards = seededHazards(scan.profile, frameId).slice(0, 3 + (scan.frames.length % 3));
    mode = "demo";
  }

  scan.frames.push({ id: frameId, note, at: new Date().toISOString() });
  // Merge, de-dupe by label.
  const seen = new Set(scan.hazards.map((h) => h.label));
  for (const h of hazards) if (!seen.has(h.label)) scan.hazards.push(h);

  scan.trace = {
    mode,
    tavily: scan.trace?.tavily ?? "cache",
    models: models.length ? models : [MODELS.vlm, MODELS.fast],
    latencyMs: Date.now() - started,
    tokens,
    costUsd: "~$0.04 (projected)",
  };
  await saveScan(scan);
  return NextResponse.json({ scan, frameId, mode });
}
