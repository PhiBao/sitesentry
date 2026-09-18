import { promises as fs } from "node:fs";
import path from "node:path";
import type { ScanRecord } from "./demo";

// Vercel serverless: only /tmp is writable. Local dev: .data/ in repo.
// Layered store: in-memory Map (warm-instance fast path) + best-effort file.
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "sitesentry-scans")
  : path.join(process.cwd(), ".data", "scans");

const mem = new Map<string, ScanRecord>();

// Preserve the in-memory cache across HMR / dev reloads.
const g = globalThis as unknown as { __sitesentry?: Map<string, ScanRecord> };
if (!g.__sitesentry) g.__sitesentry = mem;
const cache = g.__sitesentry;

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveScan(scan: ScanRecord) {
  cache.set(scan.id, scan);
  try {
    await ensureDir();
    await fs.writeFile(path.join(DATA_DIR, `${scan.id}.json`), JSON.stringify(scan));
  } catch {
    // Read-only or ephemeral FS — memory cache still serves warm instances.
  }
}

export async function loadScan(id: string): Promise<ScanRecord | null> {
  const hit = cache.get(id);
  if (hit) return hit;
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    const scan = JSON.parse(raw) as ScanRecord;
    cache.set(id, scan);
    return scan;
  } catch {
    return null;
  }
}

export function newId(prefix = "scan") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
