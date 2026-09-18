# SiteSentry — any camera becomes a safety copilot

Physical AI track · Nebius x NVIDIA Global AI Hackathon.

Point a phone/laptop camera at a warehouse aisle, stockroom, or workshop.
Cosmos vision reasoning finds hazards, Nemotron triages + writes the 60-second
report, Tavily cites the regulation. Shareable evidence pack included.

## Stack (all sponsor tech used functionally)

- **Nebius Token Factory** (OpenAI-compatible) — `nvidia/nemotron-3-super-120b-a12b`
  scene pass, `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` triage,
  `nvidia/Nemotron-3-Ultra-550b-a55b` report writer. Runtime call = hackathon requirement.
- **Tavily** `search` — grounds every report in a live OSHA clause
  (Best Use of Tavily bonus). Cached citations labeled when offline.
- **Nebius Serverless-ready** — `Dockerfile` for AI Cloud Endpoints; eval
  pattern fits Serverless Jobs (see `scripts/eval.sh`).

## Run

```bash
cp .env.example .env.local   # demo mode works with blank keys
pnpm install
pnpm dev                     # http://localhost:3000
```

With keys: `NEBIUS_API_KEY` (Token Factory key, starts `v1.`) +
`TAVILY_API_KEY` switch the pipeline from DEMO to LIVE. Model IDs
overridable via `MODEL_VLM / MODEL_FAST / MODEL_REASONER`.

## Demo script (3-min video)

1. Start scan (warehouse) → capture 2 frames → hazards pop with severity.
2. Build report → show Tavily OSHA citation + cost/latency footer.
3. Open `/r/:id` evidence pack on a second phone → assign fix.

## Verify

```bash
pnpm build
./scripts/eval.sh   # exercises scan → frames → report API, prints trace
```

## License

Apache-2.0. Built Aug–Oct 2026 for the hackathon submission period.
