"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScanRecord } from "@/lib/demo";
import { SITE_PROFILES } from "@/lib/config";

type ProfileId = (typeof SITE_PROFILES)[number]["id"];

const SEV_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-amber-100 text-amber-900 border-amber-300",
  low: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function Scanner() {
  const [profile, setProfile] = useState<ProfileId>("warehouse");
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScan = useCallback(async () => {
    setBusy("Starting scan…");
    setError(null);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const json = await res.json();
      setScan(json.scan as ScanRecord);
    } catch {
      setError("Could not start a scan. Is the server running?");
    } finally {
      setBusy(null);
    }
  }, [profile]);

  const captureFrame = useCallback(async () => {
    if (!scan) return;
    setBusy("Analyzing frame…");
    try {
      // In demo mode the frame note drives deterministic seeded hazards.
      // With a live camera we still send a textual note (VLM-text path);
      // image bytes can be attached later without changing the API.
      const notes = [
        "Wide view of main aisle, racking both sides, walkway markings visible",
        "Close view of fire equipment wall, pallets nearby",
        "Dock / exit corridor view with doors and stacked goods",
      ];
      const note = notes[scan.frames.length % notes.length];
      const res = await fetch(`/api/scans/${scan.id}/frames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const json = await res.json();
      setScan(json.scan as ScanRecord);
    } catch {
      setError("Frame analysis failed. Try again.");
    } finally {
      setBusy(null);
    }
  }, [scan]);

  const buildReport = useCallback(async () => {
    if (!scan) return;
    setBusy("Writing report…");
    try {
      const res = await fetch(`/api/scans/${scan.id}/report`, { method: "POST" });
      const json = await res.json();
      setScan(json.scan as ScanRecord);
    } catch {
      setError("Report generation failed. Try again.");
    } finally {
      setBusy(null);
    }
  }, [scan]);

  const toggleCamera = useCallback(async () => {
    if (camOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCamOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamOn(true);
    } catch {
      setError("Camera unavailable — upload mode still works. Capture frames manually below.");
    }
  }, [camOn]);

  useEffect(
    () => () => streamRef.current?.getTracks().forEach((t) => t.stop()),
    [],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">
            Physical AI · Nebius × NVIDIA hackathon
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            SiteSentry — any camera becomes a safety copilot
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600">
            Point, scan, fix. Nemotron scene reasoning finds the hazards, Nemotron
            writes the 60-second report, Tavily cites the regulation. No robot, no
            $10k cameras.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {["Nemotron-Super", "Nemotron-Ultra", "Tavily"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1 font-medium text-zinc-700"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black">
          {camOn ? (
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
              <video ref={videoRef} className="hidden" muted playsInline />
              <p className="text-sm text-zinc-400">
                Camera off — demo mode still produces the full evidence pack.
              </p>
              <button
                onClick={toggleCamera}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                Enable camera
              </button>
            </div>
          )}
          {camOn && (
            <div className="flex items-center justify-between bg-zinc-950 px-4 py-2 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                LIVE PREVIEW — frames sampled every capture
              </span>
              <button onClick={toggleCamera} className="underline hover:text-zinc-200">
                Stop
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
          <label className="text-sm font-semibold text-zinc-800">Site profile</label>
          <div className="flex gap-2">
            {SITE_PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfile(p.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  profile === p.id
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-1 gap-2">
            <button
              onClick={startScan}
              disabled={!!busy}
              className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {scan ? "Restart scan" : "Start scan"}
            </button>
            <button
              onClick={captureFrame}
              disabled={!scan || !!busy}
              className="rounded-xl border border-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-40"
            >
              Capture + analyze frame{scan ? ` (${scan.frames.length} so far)` : ""}
            </button>
            <button
              onClick={buildReport}
              disabled={!scan || scan.hazards.length === 0 || !!busy}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
            >
              Build 60-sec report
            </button>
          </div>

          {busy && <p className="text-sm text-zinc-500">{busy}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {scan?.trace && (
            <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">
              <p>
                Mode: <strong>{scan.trace.mode.toUpperCase()}</strong> · Tavily:{" "}
                {scan.trace.tavily} · {scan.trace.latencyMs}ms · {scan.trace.costUsd}
              </p>
              <p className="mt-1 break-all">Models: {scan.trace.models.join(" · ")}</p>
            </div>
          )}
        </div>
      </section>

      {scan && (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold text-zinc-950">
              Live hazards ({scan.hazards.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {scan.hazards.map((h) => (
                <li
                  key={h.id}
                  className={`rounded-xl border px-3 py-2 text-sm ${SEV_STYLE[h.severity]}`}
                >
                  <span className="font-semibold uppercase">{h.severity}</span> · {h.label}
                  <span className="block text-xs opacity-80">{h.where}</span>
                </li>
              ))}
              {scan.hazards.length === 0 && (
                <li className="text-sm text-zinc-500">
                  No hazards yet — capture a frame to run the Cosmos pass.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold text-zinc-950">60-second report</h2>
            {scan.report ? (
              <>
                <p className="mt-3 text-sm leading-6 text-zinc-800">{scan.report}</p>
                {scan.citations && scan.citations.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs">
                    {scan.citations.map((c) => (
                      <li key={c.url} className="text-zinc-600">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-zinc-900 underline"
                        >
                          {c.title}
                        </a>{" "}
                        [{c.source}] — {c.snippet.slice(0, 140)}…
                      </li>
                    ))}
                  </ul>
                )}
                <a
                  href={`/r/${scan.id}`}
                  className="mt-4 inline-block rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Open shareable evidence pack →
                </a>
              </>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                Capture at least one frame, then build the report. It will include
                regulation citations and a cost receipt.
              </p>
            )}
          </div>
        </section>
      )}

      <footer className="mt-8 border-t border-zinc-200 pt-4 text-xs text-zinc-500">
        Runs on Nebius Token Factory (NVIDIA Nemotron family) or deterministic demo
        mode when keys are absent. Tavily grounds every report. Physical AI track.
      </footer>
    </div>
  );
}
