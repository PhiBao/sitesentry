import type { SiteProfileId } from "./config";

export type Hazard = {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  where: string;
  frameId?: string;
};

export type ScanRecord = {
  id: string;
  profile: SiteProfileId;
  createdAt: string;
  frames: { id: string; note: string; at: string }[];
  hazards: Hazard[];
  report?: string;
  citations?: { title: string; url: string; snippet: string; source: string }[];
  trace?: {
    mode: "live" | "demo";
    tavily: "live" | "cache";
    models: string[];
    latencyMs: number;
    tokens: number;
    costUsd: string;
  };
};

/**
 * Deterministic seeded detections so the demo is boringly reliable.
 * The judge sees the same impressive-but-honest output every run,
 * clearly labeled DEMO until live keys are wired.
 */
const SEEDED: Record<SiteProfileId, Omit<Hazard, "id" | "frameId">[]> = {
  warehouse: [
    { label: "Fire extinguisher blocked by pallets", severity: "high", where: "Aisle B, north wall" },
    { label: "Pedestrian walkway narrows under 28in", severity: "high", where: "Aisle B crossing" },
    { label: "Pallet leaning, unstable stack", severity: "medium", where: "Rack 4, level 2" },
    { label: "Forklift parked without wheel chock", severity: "medium", where: "Dock door 2" },
    { label: "Spill, no absorbent down", severity: "low", where: "Near shrink-wrap station" },
  ],
  retail: [
    { label: "Exit path partially blocked by boxes", severity: "high", where: "Rear exit corridor" },
    { label: "Ladder unrestrained, leaning on shelf", severity: "medium", where: "Aisle 3" },
    { label: "Overloaded top shelf, boxes overhanging", severity: "medium", where: "Aisle 2" },
    { label: "Extension cord across walkway", severity: "low", where: "Register back room" },
  ],
  workshop: [
    { label: "Oil spill near lift, slip risk", severity: "high", where: "Bay 1" },
    { label: "Gas cylinder unchained", severity: "high", where: "Welding corner" },
    { label: "No eye protection visible at grinder", severity: "medium", where: "Bench 2" },
    { label: "Cords daisy-chained across floor", severity: "medium", where: "Bay 2" },
  ],
};

export function seededHazards(profile: SiteProfileId, frameId?: string): Hazard[] {
  return SEEDED[profile].map((h, i) => ({
    ...h,
    id: `${profile}-${i + 1}`,
    frameId,
  }));
}

const DEMO_REPORT: Record<SiteProfileId, string> = {
  warehouse:
    "Aisle B is your biggest risk today. (1) Clear the pallets blocking the fire extinguisher — OSHA 1910.157 requires extinguishers be readily accessible at all times. (2) Re-mark the pedestrian walkway so it stays 28in+ clear; blocked egress turns a near-miss into a citation under 1910.22. (3) Re-stack rack 4 level 2 and chock the forklift at dock 2 before the next shift. Estimated fix time: 25 minutes with two people.",
  retail:
    "The rear exit corridor must be cleared first — a blocked exit path is an imminent citation under OSHA 1910.36/37. Next, secure the ladder in aisle 3 and pull the overhanging boxes on aisle 2 down to waist height. Tape down the register-room cord today. Estimated fix time: 20 minutes.",
  workshop:
    "Bay 1 oil spill is the immediate slip risk — absorbent down and degrease before any vehicle moves. Chain the gas cylinder in the welding corner upright to a fixed support. Put eye protection at bench 2 and break the daisy-chained cords across bay 2 onto separate circuits. Estimated fix time: 30 minutes.",
};

export function demoReport(profile: SiteProfileId) {
  return DEMO_REPORT[profile];
}

/** Rough cost math shown honestly in the report footer. */
export function estimateCost(tokens: number, mode: "live" | "demo") {
  if (mode === "demo") return "~$0.11 (projected live cost)";
  // Blended public Token Factory pricing placeholder; footer links to pricing.
  return `$${((tokens / 1_000_000) * 1.1).toFixed(3)} (metered)`;
}
