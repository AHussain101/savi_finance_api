# VaultLine API Usage Examples

## Authentication

All API requests require a Bearer token in the Authorization header:

```
Authorization: Bearer vl_your_api_key_here
```

---

## cURL

### Get Available Assets
```bash
curl -X GET "https://api.vaultline.io/api/v1/assets" \
  -H "Authorization: Bearer vl_your_api_key_here"
```

### Get Current Rates
```bash
curl -X GET "https://api.vaultline.io/api/v1/rates?symbols=BTC/USD,ETH/USD,EUR/USD" \
  -H "Authorization: Bearer vl_your_api_key_here"
```

### Get Historical Data
```bash
curl -X GET "https://api.vaultline.io/api/v1/rates/history?symbol=BTC/USD&from=2024-01-01&to=2024-01-31" \
  -H "Authorization: Bearer vl_your_api_key_here"
```

---

## JavaScript / TypeScript

```javascript
const API_KEY = 'vl_your_api_key_here';
const BASE_URL = 'https://api.vaultline.io/api/v1';

// Get current rates
async function getRates(symbols) {
  const response = await fetch(
    `${BASE_URL}/rates?symbols=${symbols.join(',')}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Get historical data
async function getHistory(symbol, from, to) {
  const response = await fetch(
    `${BASE_URL}/rates/history?symbol=${symbol}&from=${from}&to=${to}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    }
  );

  return response.json();
}

// Usage
const rates = await getRates(['BTC/USD', 'ETH/USD', 'AAPL']);
console.log(rates);

const history = await getHistory('BTC/USD', '2024-01-01', '2024-01-31');
console.log(history);
```

---

## Python

```python
import requests

API_KEY = 'vl_your_api_key_here'
BASE_URL = 'https://api.vaultline.io/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}'
}

# Get available assets
def get_assets(asset_class=None):
    params = {}
    if asset_class:
        params['asset_class'] = asset_class

    response = requests.get(f'{BASE_URL}/assets', headers=headers, params=params)
    response.raise_for_status()
    return response.json()

# Get current rates
def get_rates(symbols):
    params = {'symbols': ','.join(symbols)}
    response = requests.get(f'{BASE_URL}/rates', headers=headers, params=params)
    response.raise_for_status()
    return response.json()

# Get historical data
def get_history(symbol, from_date, to_date):
    params = {
        'symbol': symbol,
        'from': from_date,
        'to': to_date
    }
    response = requests.get(f'{BASE_URL}/rates/history', headers=headers, params=params)
    response.raise_for_status()
    return response.json()

# Usage
assets = get_assets('crypto')
print(assets)

rates = get_rates(['BTC/USD', 'ETH/USD', 'EUR/USD'])
print(rates)

history = get_history('BTC/USD', '2024-01-01', '2024-01-31')
print(history)
```

---

## Go

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const (
	apiKey  = "vl_your_api_key_here"
	baseURL = "https://api.vaultline.io/api/v1"
)

type RatesResponse struct {
	Data []struct {
		Symbol     string `json:"symbol"`
		Rate       string `json:"rate"`
		AssetClass string `json:"asset_class"`
		Date       string `json:"date"`
	} `json:"data"`
}

func getRates(symbols []string) (*RatesResponse, error) {
	url := fmt.Sprintf("%s/rates?symbols=%s", baseURL, strings.Join(symbols, ","))

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var rates RatesResponse
	json.Unmarshal(body, &rates)
	return &rates, nil
}

func main() {
	rates, err := getRates([]string{"BTC/USD", "ETH/USD"})
	if err != nil {
		panic(err)
	}

	for _, r := range rates.Data {
		fmt.Printf("%s: %s\n", r.Symbol, r.Rate)
	}
}
```

---

## Ruby

```ruby
require 'net/http'
require 'json'
require 'uri'

API_KEY = 'vl_your_api_key_here'
BASE_URL = 'https://api.vaultline.io/api/v1'

def get_rates(symbols)
  uri = URI("#{BASE_URL}/rates?symbols=#{symbols.join(',')}")

  request = Net::HTTP::Get.new(uri)
  request['Authorization'] = "Bearer #{API_KEY}"

  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
    http.request(request)
  end

  JSON.parse(response.body)
end

# Usage
rates = get_rates(['BTC/USD', 'ETH/USD', 'AAPL'])
puts rates
```

---

## PHP

```php
<?php

$apiKey = 'vl_your_api_key_here';
$baseUrl = 'https://api.vaultline.io/api/v1';

function getRates($symbols) {
    global $apiKey, $baseUrl;

    $url = $baseUrl . '/rates?symbols=' . implode(',', $symbols);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// Usage
$rates = getRates(['BTC/USD', 'ETH/USD', 'EUR/USD']);
print_r($rates);
```

---

## Response Examples

### GET /api/v1/assets
```json
{
  "asset_classes": [
    {
      "name": "crypto",
      "symbol_count": 25,
      "symbols": ["BTC/USD", "ETH/USD", "SOL/USD", "..."]
    },
    {
      "name": "fiat",
      "symbol_count": 30,
      "symbols": ["EUR/USD", "GBP/USD", "JPY/USD", "..."]
    },
    {
      "name": "stocks",
      "symbol_count": 50,
      "symbols": ["AAPL", "GOOGL", "MSFT", "..."]
    },
    {
      "name": "metals",
      "symbol_count": 4,
      "symbols": ["XAU/USD", "XAG/USD", "XPT/USD", "XPD/USD"]
    }
  ],
  "total_symbols": 109
}
```

### GET /api/v1/rates
```json
{
  "data": [
    {
      "symbol": "BTC/USD",
      "rate": "67432.50",
      "base_currency": "USD",
      "asset_class": "crypto",
      "date": "2024-01-15",
      "delayed_by": "24h"
    },
    {
      "symbol": "EUR/USD",
      "rate": "1.0892",
      "base_currency": "USD",
      "asset_class": "fiat",
      "date": "2024-01-15",
      "delayed_by": "24h"
    }
  ]
}
```

### GET /api/v1/rates/history
```json
{
  "symbol": "BTC/USD",
  "base_currency": "USD",
  "asset_class": "crypto",
  "from": "2024-01-01",
  "to": "2024-01-15",
  "history": [
    { "date": "2024-01-01", "rate": "42500.00" },
    { "date": "2024-01-02", "rate": "43200.50" },
    { "date": "2024-01-03", "rate": "44100.25" }
  ],
  "delayed_by": "24h"
}
```

---

## Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 997
X-RateLimit-Reset: 1705449600
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Daily request limit |
| `X-RateLimit-Remaining` | Requests remaining today |
| `X-RateLimit-Reset` | Unix timestamp when limit resets (midnight UTC) |

---

## Error Responses

### 401 Unauthorized
```json
{ "error": "Invalid or missing API key" }
```

### 429 Rate Limited
```json
{ "error": "Rate limit exceeded", "message": "Daily limit of 1000 requests reached" }
```

### 400 Bad Request
```json
{ "error": "Missing required parameter", "message": "Please provide at least one symbol" }
```
