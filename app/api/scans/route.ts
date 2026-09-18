import { NextResponse } from "next/server";
import { SITE_PROFILES, type SiteProfileId } from "@/lib/config";
import { newId, saveScan } from "@/lib/store";
import type { ScanRecord } from "@/lib/demo";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { profile?: string };
  const profile: SiteProfileId = SITE_PROFILES.some((p) => p.id === body.profile)
    ? (body.profile as SiteProfileId)
    : "warehouse";

  const scan: ScanRecord = {
    id: newId(),
    profile,
    createdAt: new Date().toISOString(),
    frames: [],
    hazards: [],
  };
  await saveScan(scan);
  return NextResponse.json({ scan });
}
