import { promises as fs } from "node:fs";
import path from "node:path";
import type { ScanRecord } from "./demo";

const DATA_DIR = path.join(process.cwd(), ".data", "scans");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveScan(scan: ScanRecord) {
  await ensureDir();
  await fs.writeFile(path.join(DATA_DIR, `${scan.id}.json`), JSON.stringify(scan, null, 2));
}

export async function loadScan(id: string): Promise<ScanRecord | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as ScanRecord;
  } catch {
    return null;
  }
}

export function newId(prefix = "scan") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
