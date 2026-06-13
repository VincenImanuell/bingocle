#!/usr/bin/env bash
# Verify the deployed Bingocle contracts on Mantle Sepolia explorer (Mantlescan).
# Clears the "Contract is verified on Mantle Explorer" bar for the 20-Project
# Deployment Award and the Technical "end-to-end on Mantle" band.
#
# Prereq: foundry (forge + cast) installed, run from the repo root or contracts/.
# Get a free API key at https://mantlescan.xyz (Account → API Keys).
#
# Usage:
#   MANTLE_API_KEY=XXXX scripts/verify.sh
#
# Constructor args mirror script/Deploy.s.sol:
#   AgentIdentity(deployer) · EventFactory(deployer) · WordPool(deployer,factory)
#   WordMarket(factory) · OracleRegistry(deployer,factory) · BingoCardNFT(factory) · RewardVault(factory)
set -euo pipefail

: "${MANTLE_API_KEY:?set MANTLE_API_KEY (free key from https://mantlescan.xyz)}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

# Deployer/owner + factory addresses (override via env if you redeploy).
DEPLOYER="${DEPLOYER:-0x785cF4596b932B4319Eb31b9C353fE7Ae7695D2D}"
FACTORY="${FACTORY:-0x4ded43273E1b3be15bBBF1A5cE9494f77B045Afb}"

VERIFIER_URL="${VERIFIER_URL:-https://api-sepolia.mantlescan.xyz/api}"

# contract_name : address : abi-encoded constructor args
encode() { cast abi-encode "$@"; }

verify() {
  local name="$1" addr="$2" ctor_args="$3"
  echo "── Verifying $name @ $addr"
  forge verify-contract "$addr" "src/${name}.sol:${name}" \
    --chain 5003 \
    --verifier etherscan \
    --verifier-url "$VERIFIER_URL" \
    --etherscan-api-key "$MANTLE_API_KEY" \
    --constructor-args "$ctor_args" \
    --watch || echo "⚠️  $name verify failed (may already be verified) — continuing"
}

verify AgentIdentity  0x6EC7E9AE2dD88fAe0F1851487Fbd15F0b89382A0 "$(encode 'constructor(address)' "$DEPLOYER")"
verify EventFactory   0x4ded43273E1b3be15bBBF1A5cE9494f77B045Afb "$(encode 'constructor(address)' "$DEPLOYER")"
verify WordPool       0x1F0BebC4D0f7C4B8428Ac2FE14BBeb2178e63C29 "$(encode 'constructor(address,address)' "$DEPLOYER" "$FACTORY")"
verify WordMarket     0x2a853222d57d28a713F45b8F78503376ccF5471b "$(encode 'constructor(address)' "$FACTORY")"
verify OracleRegistry 0xe998c6F467876b2dA1C5D126EA5576A6943c2073 "$(encode 'constructor(address,address)' "$DEPLOYER" "$FACTORY")"
verify BingoCardNFT   0x1A7643b31EfD272F65fe7D8653fE35172284A1F3 "$(encode 'constructor(address)' "$FACTORY")"
verify RewardVault    0x0B0766bF126180730E408105C35A761D7AADe968 "$(encode 'constructor(address)' "$FACTORY")"

echo
echo "Done. Check https://explorer.sepolia.mantle.xyz and https://sepolia.mantlescan.xyz for the green check."
echo "If Mantlescan rejects, try Blockscout: forge verify-contract <addr> src/<C>.sol:<C> \\"
echo "  --verifier blockscout --verifier-url https://explorer.sepolia.mantle.xyz/api --chain 5003"
