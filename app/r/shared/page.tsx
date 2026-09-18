"use client";

import { useEffect, useState } from "react";
import type { ScanRecord } from "@/lib/demo";

function decodeSnapshot(): ScanRecord | null {
  try {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    const json = decodeURIComponent(escape(atob(hash.replace(/-/g, "+").replace(/_/g, "/"))));
    return JSON.parse(json) as ScanRecord;
  } catch {
    return null;
  }
}

export default function SharedReportPage() {
  const [scan, setScan] = useState<ScanRecord | null | "missing">(null);

  useEffect(() => {
    setScan(decodeSnapshot() ?? "missing");
  }, []);

  if (scan === null) return <p className="p-8 text-sm text-zinc-500">Loading evidence pack…</p>;
  if (scan === "missing")
    return (
      <div className="mx-auto max-w-xl p-8 text-sm text-zinc-600">
        <h1 className="text-xl font-bold text-zinc-950">Link incomplete</h1>
        <p className="mt-2">
          This share link carries no snapshot data. Open it from the full URL copied in
          SiteSentry (it ends with <code>#…</code>).
        </p>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-600">
        SiteSentry evidence pack · shared snapshot
      </p>
      <h1 className="mt-1 text-3xl font-bold text-zinc-950">{scan.profile} safety report</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {new Date(scan.createdAt).toLocaleString()} · {scan.frames.length} frames ·{" "}
        {scan.hazards.length} hazards · mode {scan.trace?.mode ?? "demo"} · Tavily{" "}
        {scan.trace?.tavily ?? "cache"} · {scan.trace?.costUsd ?? ""}
      </p>

      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-[15px] leading-7 text-zinc-900">{scan.report ?? "Report pending."}</p>
      </div>

      <h2 className="mt-6 text-lg font-bold text-zinc-950">Hazards</h2>
      <ul className="mt-2 space-y-2">
        {scan.hazards.map((h) => (
          <li key={h.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm">
            <strong className="uppercase">{h.severity}</strong> · {h.label}
            <span className="block text-xs text-zinc-500">{h.where}</span>
          </li>
        ))}
      </ul>

      {scan.citations && (
        <>
          <h2 className="mt-6 text-lg font-bold text-zinc-950">Regulation citations</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {scan.citations.map((c) => (
              <li key={c.url} className="rounded-xl border border-zinc-200 bg-white px-4 py-2">
                <a href={c.url} target="_blank" rel="noreferrer" className="font-semibold underline">
                  {c.title}
                </a>
                <p className="mt-1 text-xs text-zinc-600">
                  [{c.source}] {c.snippet}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 rounded-xl bg-zinc-950 p-4 text-xs text-zinc-300">
        <p className="font-semibold text-white">Verification trace (for judges)</p>
        <p className="mt-1 break-all">Models: {(scan.trace?.models ?? []).join(" · ")}</p>
        <p>
          Latency {scan.trace?.latencyMs ?? 0}ms · Tokens {scan.trace?.tokens ?? 0} · Cost{" "}
          {scan.trace?.costUsd ?? "n/a"}
        </p>
        <p className="mt-1">
          Stack: Nebius Token Factory + NVIDIA Nemotron + Tavily. Self-contained snapshot —
          no login, no expiry.
        </p>
      </div>
    </div>
  );
}
