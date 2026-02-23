#!/usr/bin/env bash
# Fetch a transaction trace tree from the mevscan API.
#
# Usage:
#   scripts/query_tree.sh <tx_hash>
#
# Environment:
#   MEVSCAN_API_URL - API base URL (default: http://localhost:3001)

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <tx_hash>" >&2
  exit 1
fi

API_URL="${MEVSCAN_API_URL:-http://localhost:3001}"
TX_HASH="$1"

curl -sf "${API_URL}/api/tree/${TX_HASH}" | jq .
