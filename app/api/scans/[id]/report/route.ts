import { NextResponse } from "next/server";
import { MODELS } from "@/lib/config";
import { nemotronReport } from "@/lib/nebius";
import { groundRegulations } from "@/lib/tavily";
import { loadScan, saveScan } from "@/lib/store";
import { demoReport, estimateCost } from "@/lib/demo";

/** POST /api/scans/:id/report — ground regulations via Tavily, write Nemotron report. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const scan = await loadScan(id);
  if (!scan) return NextResponse.json({ error: "scan not found" }, { status: 404 });

  const started = Date.now();
  const hazardsJson = JSON.stringify(
    scan.hazards.map((h) => ({ label: h.label, severity: h.severity, where: h.where })),
  );
  const topLabels = scan.hazards
    .slice(0, 3)
    .map((h) => h.label)
    .join("; ");

  const grounding = await groundRegulations(
    `${scan.profile} hazards: ${topLabels || "general safety"}`,
  );

  let report = "";
  let mode: "live" | "demo" = "demo";
  let tokens = scan.trace?.tokens ?? 0;
  const models = [...(scan.trace?.models ?? [])];

  try {
    if (!process.env.NEBIUS_API_KEY) throw new Error("no key — demo path");
    const res = await nemotronReport({
      profile: scan.profile,
      hazardsJson,
      regulationNotes: grounding.notes,
    });
    report = res.text;
    tokens += res.usage.totalTokens;
    if (!models.includes(MODELS.reasoner)) models.push(MODELS.reasoner);
    mode = scan.trace?.mode === "live" ? "live" : "live";
  } catch {
    report = demoReport(scan.profile);
    mode = "demo";
    if (!models.includes(MODELS.reasoner)) models.push(MODELS.reasoner);
  }

  scan.report = report;
  scan.citations = grounding.citations.map((c) => ({ ...c }));
  scan.trace = {
    mode,
    tavily: grounding.mode,
    models: models.length ? models : [MODELS.vlm, MODELS.fast, MODELS.reasoner],
    latencyMs: Date.now() - started,
    tokens,
    costUsd: estimateCost(tokens, mode),
  };
  await saveScan(scan);
  return NextResponse.json({ scan });
}
