import requests
from datetime import datetime
from config import Config


class CurrencyService:
    """Service for currency conversion using exchangerate-api"""
    
    def __init__(self):
        self.api_key = Config.EXCHANGE_RATE_API_KEY
        self.base_url = Config.EXCHANGE_RATE_API_URL
    
    def get_exchange_rate(self, from_currency, to_currency):
        """
        Get exchange rate between two currencies
        
        Args:
            from_currency: Source currency code (e.g., 'USD')
            to_currency: Target currency code (e.g., 'EUR')
            
        Returns:
            float: Exchange rate or None if error
        """
        if not self.api_key:
            # Mock rate for development without API key
            return self._get_mock_rate(from_currency, to_currency)
        
        try:
            url = f"{self.base_url}/{self.api_key}/pair/{from_currency}/{to_currency}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get('conversion_rate')
        except Exception as e:
            print(f"Error fetching exchange rate: {e}")
            return self._get_mock_rate(from_currency, to_currency)
    
    def convert_amount(self, amount, from_currency, to_currency):
        """
        Convert amount from one currency to another
        
        Args:
            amount: Amount to convert
            from_currency: Source currency code
            to_currency: Target currency code
            
        Returns:
            dict: Contains original amount, converted amount, rate, and timestamp
        """
        if from_currency == to_currency:
            return {
                'original_amount': amount,
                'converted_amount': amount,
                'rate': 1.0,
                'from_currency': from_currency,
                'to_currency': to_currency,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        rate = self.get_exchange_rate(from_currency, to_currency)
        if rate:
            converted = amount * rate
            return {
                'original_amount': amount,
                'converted_amount': round(converted, 2),
                'rate': rate,
                'from_currency': from_currency,
                'to_currency': to_currency,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        return None
    
    def _get_mock_rate(self, from_currency, to_currency):
        """Get mock exchange rates for development"""
        # Mock rates relative to USD
        mock_rates = {
            'USD': 1.0,
            'EUR': 0.85,
            'GBP': 0.73,
            'INR': 74.5,
            'JPY': 110.0,
            'CAD': 1.25,
            'AUD': 1.35,
            'CHF': 0.92,
            'CNY': 6.45,
            'SGD': 1.35,
        }
        
        from_rate = mock_rates.get(from_currency, 1.0)
        to_rate = mock_rates.get(to_currency, 1.0)
        
        return to_rate / from_rate if from_rate else 1.0
    
    @staticmethod
    def get_country_currency(country_name):
        """
        Get currency code for a country using REST Countries API
        
        Args:
            country_name: Name of the country
            
        Returns:
            str: Currency code or None if not found
        """
        try:
            url = f"{Config.REST_COUNTRIES_API_URL}/name/{country_name.lower()}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                currencies = data[0].get('currencies', {})
                if currencies:
                    # Return first currency code
                    return list(currencies.keys())[0]
            return None
        except Exception as e:
            print(f"Error fetching country currency: {e}")
            return None
