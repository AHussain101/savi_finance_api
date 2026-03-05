#!/bin/bash
#
# VaultLine API Examples
#
# Usage:
#   export VAULTLINE_API_KEY="vl_your_api_key"
#   ./vaultline.sh rates BTC/USD,ETH/USD
#   ./vaultline.sh assets crypto
#   ./vaultline.sh history BTC/USD 2024-01-01 2024-01-31

API_KEY="${VAULTLINE_API_KEY:-vl_your_api_key_here}"
BASE_URL="https://api.vaultline.io/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

request() {
  local endpoint="$1"
  local response

  response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $API_KEY" \
    "${BASE_URL}${endpoint}")

  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    echo "$body" | jq .
  else
    echo -e "${RED}Error ${http_code}:${NC}" >&2
    echo "$body" | jq . >&2
    return 1
  fi
}

case "$1" in
  rates)
    symbols="${2:-BTC/USD}"
    echo -e "${GREEN}Fetching rates for: $symbols${NC}"
    request "/rates?symbols=$symbols"
    ;;

  assets)
    asset_class="$2"
    if [[ -n "$asset_class" ]]; then
      echo -e "${GREEN}Fetching $asset_class assets${NC}"
      request "/assets?asset_class=$asset_class"
    else
      echo -e "${GREEN}Fetching all assets${NC}"
      request "/assets"
    fi
    ;;

  history)
    symbol="${2:-BTC/USD}"
    from="${3:-$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d '30 days ago' +%Y-%m-%d)}"
    to="${4:-$(date +%Y-%m-%d)}"
    echo -e "${GREEN}Fetching history for $symbol ($from to $to)${NC}"
    request "/rates/history?symbol=$symbol&from=$from&to=$to"
    ;;

  *)
    echo "VaultLine API CLI"
    echo ""
    echo "Usage:"
    echo "  $0 rates [symbols]       Get current rates (comma-separated)"
    echo "  $0 assets [class]        Get available assets"
    echo "  $0 history [symbol] [from] [to]  Get historical data"
    echo ""
    echo "Examples:"
    echo "  $0 rates BTC/USD,ETH/USD,AAPL"
    echo "  $0 assets crypto"
    echo "  $0 history BTC/USD 2024-01-01 2024-01-31"
    echo ""
    echo "Set VAULTLINE_API_KEY environment variable or edit this script."
    ;;
esac
