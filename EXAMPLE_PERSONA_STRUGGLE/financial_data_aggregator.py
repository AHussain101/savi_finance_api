"""
Financial Data Aggregator
Author: frustrated_developer@company.com
Last Updated: 2024-01-15 (I think?)

This module handles fetching financial data from multiple APIs.
Currently using:
- CoinGecko (crypto prices)
- Alpha Vantage (stock prices)
- Fixer.io (forex rates)
- MetalsAPI (precious metals)

TODO: This is a nightmare. Each API has different:
- Authentication methods
- Rate limits
- Response formats
- Error handling
- Pagination
- Caching requirements

I've been working on this for 3 months and it still breaks constantly.
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
import logging
import hashlib

# Configure logging (doesn't really help)
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# ============================================================================
# API KEYS - KEEP THESE SECRET (but also in plaintext in the code lol)
# ============================================================================

COINGECKO_API_KEY = "cg-3xK9mNpQrStUvWxYz1234567890"  # Free tier, 10 calls/min
ALPHA_VANTAGE_API_KEY = "AV7X2K9M4N6P8Q1R3S5T"  # Premium, $50/month, still rate limited
FIXER_API_KEY = "fx_live_8a7b6c5d4e3f2g1h0i9j"  # Basic plan, 1000 calls/month
METALS_API_KEY = "metals_9f8e7d6c5b4a3210fedcba"  # Professional, $30/month

# Base URLs (these keep changing without notice)
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
COINGECKO_PRO_URL = "https://pro-api.coingecko.com/api/v3"  # Do we use this one??
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"
FIXER_BASE_URL = "http://data.fixer.io/api"  # Note: HTTP not HTTPS on free tier!
METALS_API_BASE_URL = "https://metals-api.com/api"


# ============================================================================
# RATE LIMITING - Each API has different limits, this is chaos
# ============================================================================

class RateLimiter:
    """
    Tracks API calls to avoid rate limiting.
    TODO: This doesn't actually work properly.
    TODO: Need to handle 429 responses better.
    TODO: Should probably use Redis for distributed rate limiting.
    """

    def __init__(self):
        self.calls = {
            'coingecko': [],
            'alpha_vantage': [],
            'fixer': [],
            'metals': []
        }
        # Rate limits (requests per time period)
        self.limits = {
            'coingecko': {'calls': 10, 'period': 60},  # 10/min? or is it 50/min?
            'alpha_vantage': {'calls': 5, 'period': 60},  # 5/min on free tier
            'fixer': {'calls': 100, 'period': 3600},  # 100/hour? I think?
            'metals': {'calls': 50, 'period': 60}  # No idea actually
        }

    def can_call(self, api_name: str) -> bool:
        """Check if we can make another API call."""
        now = time.time()
        limit_info = self.limits.get(api_name, {'calls': 10, 'period': 60})

        # Remove old calls
        self.calls[api_name] = [
            t for t in self.calls[api_name]
            if now - t < limit_info['period']
        ]

        return len(self.calls[api_name]) < limit_info['calls']

    def record_call(self, api_name: str):
        """Record that we made an API call."""
        self.calls[api_name].append(time.time())

    def wait_if_needed(self, api_name: str):
        """Wait until we can make another call."""
        while not self.can_call(api_name):
            logger.warning(f"Rate limited on {api_name}, waiting...")
            time.sleep(1)  # This is terrible for performance


rate_limiter = RateLimiter()


# ============================================================================
# COINGECKO CLIENT - For cryptocurrency prices
# ============================================================================

class CoinGeckoClient:
    """
    Client for CoinGecko API.

    Problems:
    - Free tier is heavily rate limited
    - Pro tier requires different base URL
    - Response format changed in v3
    - Some endpoints require API key, some don't
    - Price precision varies by coin
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = COINGECKO_BASE_URL
        self.session = requests.Session()
        # Do we need this header? Documentation is unclear
        self.session.headers.update({
            'x-cg-demo-api-key': api_key,
            'Accept': 'application/json'
        })

    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make a request to CoinGecko API."""
        rate_limiter.wait_if_needed('coingecko')

        url = f"{self.base_url}/{endpoint}"
        params = params or {}

        try:
            response = self.session.get(url, params=params, timeout=30)
            rate_limiter.record_call('coingecko')

            if response.status_code == 429:
                # Rate limited, wait and retry
                logger.error("CoinGecko rate limit hit!")
                time.sleep(60)  # Wait a full minute
                return self._make_request(endpoint, params)  # Recursive, could be bad

            if response.status_code != 200:
                logger.error(f"CoinGecko error: {response.status_code} - {response.text}")
                return {}

            return response.json()
        except requests.exceptions.Timeout:
            logger.error("CoinGecko request timed out")
            return {}
        except requests.exceptions.RequestException as e:
            logger.error(f"CoinGecko request failed: {e}")
            return {}
        except json.JSONDecodeError:
            logger.error("CoinGecko returned invalid JSON")
            return {}

    def get_price(self, coin_ids: List[str], vs_currencies: List[str] = ['usd']) -> Dict:
        """
        Get current prices for coins.

        Note: coin_ids must be CoinGecko IDs, not symbols!
        'bitcoin' not 'BTC', 'ethereum' not 'ETH'
        This is so annoying.
        """
        params = {
            'ids': ','.join(coin_ids),
            'vs_currencies': ','.join(vs_currencies),
            'include_24hr_change': 'true',
            'include_last_updated_at': 'true'
        }
        return self._make_request('simple/price', params)

    def get_coin_list(self) -> List[Dict]:
        """Get list of all coins (for ID lookup)."""
        # WARNING: This returns 10000+ coins and is slow
        return self._make_request('coins/list')

    def get_historical_price(self, coin_id: str, date: str) -> Dict:
        """
        Get historical price for a specific date.
        Date format: dd-mm-yyyy (not ISO format, because why would they?)
        """
        return self._make_request(f'coins/{coin_id}/history', {'date': date})

    def search_coin(self, query: str) -> Dict:
        """Search for a coin by name or symbol."""
        return self._make_request('search', {'query': query})

    def get_coin_market_data(self, coin_id: str) -> Dict:
        """Get detailed market data for a coin."""
        return self._make_request(f'coins/{coin_id}', {
            'localization': 'false',
            'tickers': 'false',
            'community_data': 'false',
            'developer_data': 'false'
        })


# ============================================================================
# ALPHA VANTAGE CLIENT - For stock prices
# ============================================================================

class AlphaVantageClient:
    """
    Client for Alpha Vantage API.

    Problems:
    - 5 calls per minute on free tier (we have premium but still only 75/min)
    - Different endpoints for different data types
    - CSV and JSON responses mixed
    - Inconsistent field naming (sometimes camelCase, sometimes with spaces)
    - "Note" field in response means we're rate limited
    - Premium endpoints have different URL structure
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = ALPHA_VANTAGE_BASE_URL
        self.session = requests.Session()

    def _make_request(self, function: str, params: Dict = None) -> Dict:
        """Make a request to Alpha Vantage API."""
        rate_limiter.wait_if_needed('alpha_vantage')

        params = params or {}
        params['function'] = function
        params['apikey'] = self.api_key

        try:
            response = self.session.get(self.base_url, params=params, timeout=30)
            rate_limiter.record_call('alpha_vantage')

            data = response.json()

            # Check for rate limiting (they return 200 with an error message)
            if 'Note' in data:
                logger.error(f"Alpha Vantage rate limit: {data['Note']}")
                time.sleep(60)
                return self._make_request(function, params)

            if 'Error Message' in data:
                logger.error(f"Alpha Vantage error: {data['Error Message']}")
                return {}

            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Alpha Vantage request failed: {e}")
            return {}
        except json.JSONDecodeError:
            logger.error("Alpha Vantage returned invalid JSON")
            return {}

    def get_quote(self, symbol: str) -> Dict:
        """Get current quote for a stock."""
        data = self._make_request('GLOBAL_QUOTE', {'symbol': symbol})
        return data.get('Global Quote', {})

    def get_intraday(self, symbol: str, interval: str = '5min') -> Dict:
        """
        Get intraday time series.
        Intervals: 1min, 5min, 15min, 30min, 60min
        """
        return self._make_request('TIME_SERIES_INTRADAY', {
            'symbol': symbol,
            'interval': interval,
            'outputsize': 'compact'  # or 'full' for more data
        })

    def get_daily(self, symbol: str) -> Dict:
        """Get daily time series."""
        return self._make_request('TIME_SERIES_DAILY', {
            'symbol': symbol,
            'outputsize': 'compact'
        })

    def get_daily_adjusted(self, symbol: str) -> Dict:
        """Get daily adjusted time series (includes dividends/splits)."""
        return self._make_request('TIME_SERIES_DAILY_ADJUSTED', {
            'symbol': symbol,
            'outputsize': 'compact'
        })

    def search_symbol(self, keywords: str) -> List[Dict]:
        """Search for stock symbols."""
        data = self._make_request('SYMBOL_SEARCH', {'keywords': keywords})
        return data.get('bestMatches', [])

    def get_forex_rate(self, from_currency: str, to_currency: str) -> Dict:
        """
        Get forex exchange rate.
        Wait, should we use this or Fixer? I'm confused now.
        """
        return self._make_request('CURRENCY_EXCHANGE_RATE', {
            'from_currency': from_currency,
            'to_currency': to_currency
        })


# ============================================================================
# FIXER CLIENT - For forex/fiat currency rates
# ============================================================================

class FixerClient:
    """
    Client for Fixer.io API.

    Problems:
    - Free tier only supports HTTP (not HTTPS!) - security risk
    - Free tier only supports EUR as base currency
    - Historical data requires paid plan
    - Fluctuation data requires paid plan
    - Time series requires paid plan
    - Basically everything useful requires paid plan
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = FIXER_BASE_URL
        self.session = requests.Session()

    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make a request to Fixer API."""
        rate_limiter.wait_if_needed('fixer')

        params = params or {}
        params['access_key'] = self.api_key

        url = f"{self.base_url}/{endpoint}"

        try:
            response = self.session.get(url, params=params, timeout=30)
            rate_limiter.record_call('fixer')

            data = response.json()

            if not data.get('success', False):
                error_info = data.get('error', {})
                logger.error(f"Fixer error: {error_info.get('type')} - {error_info.get('info')}")
                return {}

            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Fixer request failed: {e}")
            return {}
        except json.JSONDecodeError:
            logger.error("Fixer returned invalid JSON")
            return {}

    def get_latest(self, base: str = 'EUR', symbols: List[str] = None) -> Dict:
        """
        Get latest exchange rates.

        NOTE: Free tier only supports EUR as base!
        If you try another base, it silently returns EUR rates anyway.
        """
        params = {}
        if base != 'EUR':
            logger.warning("Fixer free tier only supports EUR base, ignoring requested base")
        if symbols:
            params['symbols'] = ','.join(symbols)

        return self._make_request('latest', params)

    def get_historical(self, date: str, base: str = 'EUR', symbols: List[str] = None) -> Dict:
        """
        Get historical rates for a date.
        Date format: YYYY-MM-DD

        NOTE: Requires paid plan!
        """
        params = {}
        if symbols:
            params['symbols'] = ','.join(symbols)

        return self._make_request(date, params)

    def convert(self, from_currency: str, to_currency: str, amount: float) -> Dict:
        """
        Convert between currencies.

        NOTE: Requires paid plan!
        """
        return self._make_request('convert', {
            'from': from_currency,
            'to': to_currency,
            'amount': amount
        })

    def get_symbols(self) -> Dict:
        """Get list of supported currency symbols."""
        return self._make_request('symbols')


# ============================================================================
# METALS API CLIENT - For precious metals prices
# ============================================================================

class MetalsAPIClient:
    """
    Client for Metals-API.

    Problems:
    - Documentation is sparse
    - Response format is similar to Fixer but not identical
    - Some metals use weird codes (XAU for gold, XAG for silver)
    - Prices are per troy ounce, need to convert for other units
    - Free tier is very limited
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = METALS_API_BASE_URL
        self.session = requests.Session()

    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make a request to Metals API."""
        rate_limiter.wait_if_needed('metals')

        params = params or {}
        params['access_key'] = self.api_key

        url = f"{self.base_url}/{endpoint}"

        try:
            response = self.session.get(url, params=params, timeout=30)
            rate_limiter.record_call('metals')

            data = response.json()

            if not data.get('success', False):
                error_info = data.get('error', {})
                logger.error(f"Metals API error: {error_info}")
                return {}

            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Metals API request failed: {e}")
            return {}
        except json.JSONDecodeError:
            logger.error("Metals API returned invalid JSON")
            return {}

    def get_latest(self, base: str = 'USD', symbols: List[str] = None) -> Dict:
        """Get latest metal prices."""
        params = {'base': base}
        if symbols:
            params['symbols'] = ','.join(symbols)

        return self._make_request('latest', params)

    def get_historical(self, date: str, base: str = 'USD', symbols: List[str] = None) -> Dict:
        """
        Get historical metal prices.
        Date format: YYYY-MM-DD
        """
        params = {'base': base}
        if symbols:
            params['symbols'] = ','.join(symbols)

        return self._make_request(date, params)

    def convert(self, from_metal: str, to_currency: str, amount: float) -> Dict:
        """Convert metal to currency."""
        return self._make_request('convert', {
            'from': from_metal,
            'to': to_currency,
            'amount': amount
        })


# ============================================================================
# THE MAIN AGGREGATOR - Where the real chaos happens
# ============================================================================

class FinancialDataAggregator:
    """
    Aggregates financial data from multiple APIs.

    This is the main class that tries to unify all the different APIs
    into a single interface. It's a mess.

    TODO: Implement caching (Redis?)
    TODO: Handle API failures gracefully
    TODO: Normalize response formats
    TODO: Add retry logic
    TODO: Add circuit breaker pattern
    TODO: Figure out why this randomly stops working on Fridays
    """

    def __init__(self):
        self.coingecko = CoinGeckoClient(COINGECKO_API_KEY)
        self.alpha_vantage = AlphaVantageClient(ALPHA_VANTAGE_API_KEY)
        self.fixer = FixerClient(FIXER_API_KEY)
        self.metals = MetalsAPIClient(METALS_API_KEY)

        # Cache for coin ID lookups (CoinGecko uses IDs not symbols)
        self._coin_id_cache = {}
        self._last_coin_list_fetch = None

        # Cache for symbol lookups
        self._symbol_cache = {}

        # Track API health
        self._api_health = {
            'coingecko': True,
            'alpha_vantage': True,
            'fixer': True,
            'metals': True
        }

    def _get_coin_id(self, symbol: str) -> Optional[str]:
        """
        Convert crypto symbol to CoinGecko ID.

        This is necessary because CoinGecko uses IDs like 'bitcoin'
        instead of symbols like 'BTC'. So annoying.
        """
        symbol = symbol.upper()

        if symbol in self._coin_id_cache:
            return self._coin_id_cache[symbol]

        # Fetch coin list if we haven't recently
        now = datetime.now()
        if (self._last_coin_list_fetch is None or
            now - self._last_coin_list_fetch > timedelta(hours=24)):

            logger.info("Fetching CoinGecko coin list...")
            coins = self.coingecko.get_coin_list()

            if coins:
                for coin in coins:
                    self._coin_id_cache[coin.get('symbol', '').upper()] = coin.get('id')
                self._last_coin_list_fetch = now

        return self._coin_id_cache.get(symbol)

    def get_crypto_price(self, symbol: str, vs_currency: str = 'usd') -> Optional[Dict]:
        """
        Get current price for a cryptocurrency.

        Returns normalized format:
        {
            'symbol': 'BTC',
            'price': 50000.00,
            'currency': 'USD',
            'change_24h': 2.5,
            'timestamp': '2024-01-15T12:00:00Z',
            'source': 'coingecko'
        }
        """
        coin_id = self._get_coin_id(symbol)

        if not coin_id:
            logger.error(f"Could not find CoinGecko ID for {symbol}")
            return None

        data = self.coingecko.get_price([coin_id], [vs_currency.lower()])

        if not data or coin_id not in data:
            return None

        coin_data = data[coin_id]

        return {
            'symbol': symbol.upper(),
            'price': coin_data.get(vs_currency.lower()),
            'currency': vs_currency.upper(),
            'change_24h': coin_data.get(f'{vs_currency.lower()}_24h_change'),
            'timestamp': datetime.fromtimestamp(
                coin_data.get('last_updated_at', time.time())
            ).isoformat(),
            'source': 'coingecko'
        }

    def get_stock_price(self, symbol: str) -> Optional[Dict]:
        """
        Get current price for a stock.

        Returns normalized format:
        {
            'symbol': 'AAPL',
            'price': 185.50,
            'currency': 'USD',
            'change': 2.30,
            'change_percent': 1.25,
            'timestamp': '2024-01-15T16:00:00Z',
            'source': 'alpha_vantage'
        }
        """
        data = self.alpha_vantage.get_quote(symbol)

        if not data:
            return None

        # Alpha Vantage field names have spaces and are inconsistent
        # e.g., '01. symbol', '05. price', '09. change'
        try:
            return {
                'symbol': data.get('01. symbol', symbol),
                'price': float(data.get('05. price', 0)),
                'currency': 'USD',  # Alpha Vantage always returns USD
                'change': float(data.get('09. change', 0)),
                'change_percent': float(data.get('10. change percent', '0%').rstrip('%')),
                'timestamp': data.get('07. latest trading day', '') + 'T16:00:00Z',
                'source': 'alpha_vantage'
            }
        except (ValueError, TypeError) as e:
            logger.error(f"Error parsing Alpha Vantage response: {e}")
            return None

    def get_forex_rate(self, from_currency: str, to_currency: str) -> Optional[Dict]:
        """
        Get forex exchange rate.

        Returns normalized format:
        {
            'from': 'USD',
            'to': 'EUR',
            'rate': 0.92,
            'timestamp': '2024-01-15T12:00:00Z',
            'source': 'fixer'
        }

        NOTE: This is complicated because:
        - Fixer only supports EUR as base on free tier
        - We need to do math to convert to other bases
        - There might be precision issues
        """
        # Fixer only supports EUR as base, so we need to work around this
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()

        data = self.fixer.get_latest(symbols=[from_currency, to_currency])

        if not data or 'rates' not in data:
            # Fallback to Alpha Vantage forex
            logger.warning("Fixer failed, trying Alpha Vantage for forex")
            av_data = self.alpha_vantage.get_forex_rate(from_currency, to_currency)

            if av_data and 'Realtime Currency Exchange Rate' in av_data:
                rate_data = av_data['Realtime Currency Exchange Rate']
                return {
                    'from': from_currency,
                    'to': to_currency,
                    'rate': float(rate_data.get('5. Exchange Rate', 0)),
                    'timestamp': rate_data.get('6. Last Refreshed', ''),
                    'source': 'alpha_vantage'
                }
            return None

        rates = data['rates']

        # Calculate the actual rate
        # Fixer returns rates relative to EUR
        # So EUR->USD might be 1.10, EUR->GBP might be 0.85
        # To get USD->GBP we do: GBP_rate / USD_rate

        from_rate = rates.get(from_currency, 1)  # 1 if EUR
        to_rate = rates.get(to_currency, 1)

        if from_currency == 'EUR':
            rate = to_rate
        elif to_currency == 'EUR':
            rate = 1 / from_rate
        else:
            rate = to_rate / from_rate

        return {
            'from': from_currency,
            'to': to_currency,
            'rate': rate,
            'timestamp': data.get('date', '') + 'T00:00:00Z',
            'source': 'fixer'
        }

    def get_metal_price(self, metal: str, currency: str = 'USD') -> Optional[Dict]:
        """
        Get precious metal price.

        Supported metals: XAU (gold), XAG (silver), XPT (platinum), XPD (palladium)

        Returns normalized format:
        {
            'metal': 'XAU',
            'name': 'Gold',
            'price': 2050.50,
            'currency': 'USD',
            'unit': 'troy_ounce',
            'timestamp': '2024-01-15T12:00:00Z',
            'source': 'metals_api'
        }
        """
        metal = metal.upper()
        currency = currency.upper()

        # Metal code to name mapping
        metal_names = {
            'XAU': 'Gold',
            'XAG': 'Silver',
            'XPT': 'Platinum',
            'XPD': 'Palladium'
        }

        data = self.metals.get_latest(base=currency, symbols=[metal])

        if not data or 'rates' not in data:
            return None

        rates = data['rates']

        if metal not in rates:
            return None

        # Metals API returns inverse rate (1/price), need to flip it
        # Wait, or does it? The documentation is unclear.
        # TODO: Verify this is correct
        price = 1 / rates[metal]  # I think this is right?

        return {
            'metal': metal,
            'name': metal_names.get(metal, metal),
            'price': price,
            'currency': currency,
            'unit': 'troy_ounce',
            'timestamp': data.get('date', '') + 'T00:00:00Z',
            'source': 'metals_api'
        }

    def get_all_rates(self, symbols: List[str]) -> Dict[str, Optional[Dict]]:
        """
        Get rates for multiple symbols of any type.

        This tries to figure out what type each symbol is and
        fetch from the appropriate API. It's not very smart.

        Symbol format:
        - Crypto: BTC, ETH, etc.
        - Stocks: AAPL, GOOGL, etc.
        - Forex: USD/EUR, GBP/JPY, etc.
        - Metals: XAU, XAG, etc.
        """
        results = {}

        for symbol in symbols:
            symbol = symbol.upper()

            # Try to determine symbol type
            if '/' in symbol:
                # Forex pair
                parts = symbol.split('/')
                if len(parts) == 2:
                    results[symbol] = self.get_forex_rate(parts[0], parts[1])
                else:
                    results[symbol] = None

            elif symbol in ['XAU', 'XAG', 'XPT', 'XPD']:
                # Precious metal
                results[symbol] = self.get_metal_price(symbol)

            elif symbol in ['BTC', 'ETH', 'XRP', 'LTC', 'ADA', 'DOT', 'DOGE',
                           'SOL', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM']:
                # Known crypto (this list is incomplete)
                results[symbol] = self.get_crypto_price(symbol)

            else:
                # Assume it's a stock
                # TODO: This is a bad assumption
                results[symbol] = self.get_stock_price(symbol)

        return results

    def get_historical_data(
        self,
        symbol: str,
        start_date: str,
        end_date: str
    ) -> Optional[List[Dict]]:
        """
        Get historical data for a symbol.

        This is where things get really complicated because each API
        has different historical data formats and limitations.

        TODO: This doesn't really work properly yet
        TODO: Need to handle different date formats
        TODO: Need to normalize time series data
        """
        symbol = symbol.upper()

        # Determine symbol type (same logic as get_all_rates)
        if '/' in symbol:
            # Forex - use Fixer
            # Note: Historical data requires paid plan
            logger.warning("Forex historical data requires Fixer paid plan")
            return None

        elif symbol in ['XAU', 'XAG', 'XPT', 'XPD']:
            # Metal - use Metals API
            # Need to fetch day by day? Ugh.
            logger.warning("Metal historical data not implemented")
            return None

        elif symbol in ['BTC', 'ETH', 'XRP', 'LTC', 'ADA', 'DOT', 'DOGE',
                       'SOL', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM']:
            # Crypto - use CoinGecko
            # CoinGecko wants date in dd-mm-yyyy format
            coin_id = self._get_coin_id(symbol)
            if not coin_id:
                return None

            # Need to iterate through dates
            results = []
            # TODO: Parse dates and iterate
            logger.warning("Crypto historical data iteration not implemented")
            return None

        else:
            # Stock - use Alpha Vantage
            data = self.alpha_vantage.get_daily(symbol)

            if not data or 'Time Series (Daily)' not in data:
                return None

            time_series = data['Time Series (Daily)']
            results = []

            for date, values in time_series.items():
                # Check if date is in range
                if start_date <= date <= end_date:
                    results.append({
                        'date': date,
                        'open': float(values.get('1. open', 0)),
                        'high': float(values.get('2. high', 0)),
                        'low': float(values.get('3. low', 0)),
                        'close': float(values.get('4. close', 0)),
                        'volume': int(values.get('5. volume', 0))
                    })

            return sorted(results, key=lambda x: x['date'])


# ============================================================================
# HELPER FUNCTIONS - Misc utilities that don't belong anywhere else
# ============================================================================

def format_price(price: float, currency: str = 'USD') -> str:
    """Format a price with currency symbol."""
    symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CNY': '¥'
    }
    symbol = symbols.get(currency.upper(), currency + ' ')
    return f"{symbol}{price:,.2f}"


def calculate_change_percent(old_price: float, new_price: float) -> float:
    """Calculate percentage change between two prices."""
    if old_price == 0:
        return 0
    return ((new_price - old_price) / old_price) * 100


def is_market_open() -> bool:
    """
    Check if US stock market is open.

    TODO: Handle holidays
    TODO: Handle extended hours
    TODO: Handle different exchanges
    """
    now = datetime.now()

    # Weekend check
    if now.weekday() >= 5:
        return False

    # Simple time check (9:30 AM - 4:00 PM ET)
    # TODO: This doesn't handle timezones properly
    hour = now.hour
    if hour < 9 or hour >= 16:
        return False
    if hour == 9 and now.minute < 30:
        return False

    return True


def convert_currency(amount: float, from_currency: str, to_currency: str) -> Optional[float]:
    """
    Convert amount from one currency to another.

    This creates a new aggregator instance which is wasteful.
    TODO: Use a singleton or dependency injection
    """
    aggregator = FinancialDataAggregator()
    rate_data = aggregator.get_forex_rate(from_currency, to_currency)

    if not rate_data:
        return None

    return amount * rate_data['rate']


# ============================================================================
# CACHING LAYER - TODO: Actually implement this
# ============================================================================

class SimpleCache:
    """
    Simple in-memory cache.

    TODO: Replace with Redis
    TODO: Add TTL per key
    TODO: Add cache invalidation strategy
    TODO: Add cache warming
    """

    def __init__(self, default_ttl: int = 60):
        self._cache = {}
        self._timestamps = {}
        self.default_ttl = default_ttl

    def _make_key(self, *args, **kwargs) -> str:
        """Create a cache key from arguments."""
        key_data = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True)
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key not in self._cache:
            return None

        timestamp = self._timestamps.get(key, 0)
        if time.time() - timestamp > self.default_ttl:
            del self._cache[key]
            del self._timestamps[key]
            return None

        return self._cache[key]

    def set(self, key: str, value: Any, ttl: int = None):
        """Set value in cache."""
        self._cache[key] = value
        self._timestamps[key] = time.time()

    def clear(self):
        """Clear all cached data."""
        self._cache.clear()
        self._timestamps.clear()


# Global cache instance
cache = SimpleCache(default_ttl=300)  # 5 minute TTL


# ============================================================================
# MAIN - For testing (this probably doesn't work)
# ============================================================================

def main():
    """Test the aggregator."""
    print("Financial Data Aggregator Test")
    print("=" * 50)

    aggregator = FinancialDataAggregator()

    # Test crypto
    print("\n1. Testing Crypto (BTC)...")
    btc_price = aggregator.get_crypto_price('BTC')
    if btc_price:
        print(f"   BTC: {format_price(btc_price['price'])}")
    else:
        print("   ERROR: Could not fetch BTC price")

    # Test stock
    print("\n2. Testing Stock (AAPL)...")
    aapl_price = aggregator.get_stock_price('AAPL')
    if aapl_price:
        print(f"   AAPL: {format_price(aapl_price['price'])}")
    else:
        print("   ERROR: Could not fetch AAPL price")

    # Test forex
    print("\n3. Testing Forex (USD/EUR)...")
    usd_eur = aggregator.get_forex_rate('USD', 'EUR')
    if usd_eur:
        print(f"   USD/EUR: {usd_eur['rate']:.4f}")
    else:
        print("   ERROR: Could not fetch USD/EUR rate")

    # Test metals
    print("\n4. Testing Metals (XAU)...")
    gold_price = aggregator.get_metal_price('XAU')
    if gold_price:
        print(f"   Gold: {format_price(gold_price['price'])}/oz")
    else:
        print("   ERROR: Could not fetch gold price")

    # Test batch
    print("\n5. Testing Batch Query...")
    symbols = ['BTC', 'ETH', 'AAPL', 'USD/EUR', 'XAU']
    results = aggregator.get_all_rates(symbols)
    for symbol, data in results.items():
        if data:
            price = data.get('price') or data.get('rate')
            print(f"   {symbol}: {price}")
        else:
            print(f"   {symbol}: ERROR")

    print("\n" + "=" * 50)
    print("Test complete. Check logs for errors.")


if __name__ == '__main__':
    main()
