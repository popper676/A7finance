// Currency Exchange Rate Service
// Uses exchangerate.host (free, no API key required) or exchangerate-api.com (with API key)

interface ExchangeRateResponse {
  success: boolean;
  rates?: {
    USD?: number;
  };
  conversion_rates?: {
    USD?: number;
  };
  error?: string;
}

class CurrencyService {
  private exchangeRate: number | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
  private readonly API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY || '';

  // Fetch exchange rate from API
  async fetchExchangeRate(): Promise<number> {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (this.exchangeRate && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.exchangeRate;
    }

    try {
      let rate: number | null = null;

      // Try exchangerate-api.com first if API key is provided
      if (this.API_KEY) {
        try {
          const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${this.API_KEY}/pair/MMK/USD`
          );
          const data = await response.json();
          if (data.conversion_rate) {
            rate = data.conversion_rate;
          }
        } catch (error) {
          console.warn('ExchangeRate-API failed, trying fallback:', error);
        }
      }

      // Fallback to exchangerate.host (free, no API key)
      if (!rate) {
        const response = await fetch('https://api.exchangerate.host/latest?base=MMK&symbols=USD');
        const data: ExchangeRateResponse = await response.json();
        
        if (data.success && data.rates?.USD) {
          rate = data.rates.USD;
        } else {
          throw new Error('Failed to fetch exchange rate');
        }
      }

      if (!rate || rate <= 0) {
        throw new Error('Invalid exchange rate received');
      }

      this.exchangeRate = rate;
      this.lastFetchTime = now;
      
      // Store in localStorage as backup
      localStorage.setItem('mmk_usd_rate', JSON.stringify({ rate, timestamp: now }));
      
      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Try to use cached rate from localStorage
      const cached = localStorage.getItem('mmk_usd_rate');
      if (cached) {
        try {
          const { rate, timestamp } = JSON.parse(cached);
          if (rate && (now - timestamp) < this.CACHE_DURATION * 24) { // Allow 24 hour cache from localStorage
            this.exchangeRate = rate;
            this.lastFetchTime = timestamp;
            return rate;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Fallback to approximate rate if all else fails (as of 2024, ~2100 MMK = 1 USD)
      const fallbackRate = 2100;
      console.warn(`Using fallback exchange rate: 1 USD = ${fallbackRate} MMK`);
      return fallbackRate;
    }
  }

  // Convert MMK to USD
  async convertToUSD(mmkAmount: number): Promise<number> {
    const rate = await this.fetchExchangeRate();
    return mmkAmount * rate;
  }

  // Get current cached rate (synchronous)
  getCachedRate(): number | null {
    return this.exchangeRate;
  }

  // Clear cache (force refresh on next fetch)
  clearCache(): void {
    this.exchangeRate = null;
    this.lastFetchTime = 0;
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();

// Helper function to convert MMK to USD (async)
export const convertMMKtoUSD = async (mmkAmount: number): Promise<number> => {
  return await currencyService.convertToUSD(mmkAmount);
};

