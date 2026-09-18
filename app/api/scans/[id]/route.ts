import { NextResponse } from "next/server";
import { loadScan } from "@/lib/store";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const scan = await loadScan(id);
  if (!scan) return NextResponse.json({ error: "scan not found" }, { status: 404 });
  return NextResponse.json({ scan });
}
