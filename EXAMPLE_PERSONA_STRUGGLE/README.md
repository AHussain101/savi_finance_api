# The Struggle is Real

This folder demonstrates the pain of managing multiple financial data APIs.

**Before VaultLine, developers had to:**

- Manage 4+ different API keys
- Handle 4+ different authentication methods
- Navigate 4+ different rate limiting schemes
- Parse 4+ different response formats
- Maintain 800+ lines of fragile integration code

## Files

- `financial_data_aggregator.py` - 800+ lines of chaos
- `config.py` - TODO: Move secrets here someday
- `utils.py` - TODO: Actually implement
- `cache.py` - TODO: Set up Redis
- `models.py` - TODO: Normalize data (impossible)

## The APIs

| API | Purpose | Problems |
|-----|---------|----------|
| CoinGecko | Crypto prices | Uses IDs not symbols, rate limits, format changes |
| Alpha Vantage | Stock prices | 5 calls/min, inconsistent field names, CSV/JSON mixed |
| Fixer.io | Forex rates | HTTP only on free tier, EUR base only, paid features |
| Metals-API | Precious metals | Sparse docs, weird codes, inverse rates maybe? |

## With VaultLine

```python
from vaultline import VaultLine

client = VaultLine("vl_your_api_key")
rates = client.get_rates(["BTC/USD", "AAPL", "EUR/GBP", "XAU"])
```

**One API. One key. One schema. Done.**
