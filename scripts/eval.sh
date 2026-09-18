#!/usr/bin/env bash
# Smoke-test the full scan → frames → report loop (demo mode OK).
set -euo pipefail
BASE="${BASE:-http://localhost:3000}"

echo "== create scan =="
SCAN=$(curl -s -X POST "$BASE/api/scans" -H 'Content-Type: application/json' -d '{"profile":"warehouse"}')
echo "$SCAN" | head -c 400; echo
ID=$(python3 -c "import sys,json; print(json.load(sys.stdin)['scan']['id'])" <<< "$SCAN")

echo "== frame 1 =="
curl -s -X POST "$BASE/api/scans/$ID/frames" -H 'Content-Type: application/json' -d '{"note":"Wide view of main aisle"}' | head -c 400; echo
echo "== frame 2 =="
curl -s -X POST "$BASE/api/scans/$ID/frames" -H 'Content-Type: application/json' -d '{"note":"Fire equipment wall, pallets nearby"}' | head -c 400; echo
echo "== report =="
curl -s -X POST "$BASE/api/scans/$ID/report" | python3 -c "import sys,json; d=json.load(sys.stdin)['scan']; print('hazards:',len(d['hazards'])); print('report:',(d.get('report') or '')[:300]); print('trace:',d.get('trace'))"
echo "== report page =="
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/r/$ID"
