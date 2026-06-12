#!/usr/bin/env bash
# Deploy the Bingocle suite and wire the resulting addresses into agent/.env and
# capability/.env automatically (no manual copy/paste).
#
# Usage:
#   PRIVATE_KEY=0x... AGENT_ADDRESS=0x... RPC_URL=https://rpc.sepolia.mantle.xyz \
#     scripts/deploy.sh [--broadcast] [--verify]
#
# For a local anvil run:
#   anvil --silent &
#   PRIVATE_KEY=0xac09...ff80 RPC_URL=http://127.0.0.1:8545 scripts/deploy.sh --broadcast
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
: "${PRIVATE_KEY:?set PRIVATE_KEY}"
EXTRA_ARGS="${*:-}"

echo "Deploying to $RPC_URL ..."
OUT="$(cd "$ROOT/contracts" && PRIVATE_KEY="$PRIVATE_KEY" AGENT_ADDRESS="${AGENT_ADDRESS:-}" \
  forge script script/Deploy.s.sol --rpc-url "$RPC_URL" $EXTRA_ARGS 2>&1)"
echo "$OUT" | grep -E "_ADDRESS=" || { echo "Deploy produced no addresses:"; echo "$OUT" | tail -20; exit 1; }

# Collect KEY=VALUE address pairs from the script logs.
ADDRS="$(echo "$OUT" | grep -oE '[A-Z_]+_ADDRESS= 0x[0-9a-fA-F]{40}' | sed 's/= /=/')"

upsert() { # upsert KEY VALUE FILE
  local key="$1" val="$2" file="$3"
  [ -f "$file" ] || cp "${file}.example" "$file"
  if grep -qE "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    printf '%s=%s\n' "$key" "$val" >> "$file"
  fi
}

for target in "$ROOT/agent/.env" "$ROOT/capability/.env"; do
  while IFS='=' read -r k v; do
    [ -n "$k" ] && upsert "$k" "$v" "$target"
  done <<< "$ADDRS"
  echo "Wrote addresses -> $target"
done

# Frontend uses NEXT_PUBLIC_<NAME> (drop the _ADDRESS suffix, add the prefix).
FE="$ROOT/frontend/.env.local"
[ -f "$FE" ] || { [ -f "$ROOT/frontend/.env.example" ] && cp "$ROOT/frontend/.env.example" "$FE" || touch "$FE"; }
while IFS='=' read -r k v; do
  [ -z "$k" ] && continue
  nk="NEXT_PUBLIC_${k%_ADDRESS}"
  upsert "$nk" "$v" "$FE"
done <<< "$ADDRS"
echo "Wrote NEXT_PUBLIC_* addresses -> $FE"

echo "Done. Addresses also belong in README.md (Deployed addresses table)."
