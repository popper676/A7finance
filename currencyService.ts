// Currency Exchange Rate Service
// Primary: Binance API (USDT/MMK trading pair - USDT is pegged to USD, so USDT price = USD price)
// Fallback 1: exchangerate-api.com (if API key provided)
// Fallback 2: exchangerate.host (free, no API key required)

interface ExchangeRateResponse {
  success: boolean;
  rates?: {
    USD?: number;
    MMK?: number;
  };
  conversion_rates?: {
    USD?: number;
  };
  error?: string;
}

interface BinanceResponse {
  symbol: string;
  price: string;
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

      // Primary: Try Binance API (USDT/MMK pair) - FIRST PRIORITY
      // USDT is pegged to USD, so USDT/MMK price gives us USD/MMK rate
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTMMK');
        
        if (!response.ok) {
          throw new Error(`Binance API returned ${response.status}`);
        }
        
        const data: BinanceResponse = await response.json();
        
        if (data.price) {
          const usdtToMmk = parseFloat(data.price);
          if (usdtToMmk > 0 && !isNaN(usdtToMmk)) {
            // Binance returns: 1 USDT = X MMK (where USDT ≈ USD)
            // We need: 1 MMK = ? USD, which is 1 / X
            rate = 1 / usdtToMmk;
            console.log(`✓ Binance API success: 1 USDT = ${usdtToMmk.toLocaleString()} MMK, so 1 MMK = ${rate.toFixed(6)} USD`);
          } else {
            throw new Error('Invalid price from Binance API');
          }
        } else {
          throw new Error('No price data from Binance API');
        }
      } catch (error) {
        console.warn('⚠ Binance API failed, trying fallback:', error);
      }

      // Fallback 1: Try exchangerate-api.com if API key is provided
      if (!rate && this.API_KEY) {
        try {
          const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${this.API_KEY}/pair/USD/MMK`
          );
          const data = await response.json();
          if (data.conversion_rate) {
            rate = 1 / data.conversion_rate;
          }
        } catch (error) {
          console.warn('ExchangeRate-API failed, trying next fallback:', error);
        }
      }

      // Fallback 2: exchangerate.host (free, no API key)
      if (!rate) {
        const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=MMK');
        const data: ExchangeRateResponse = await response.json();
        
        if (data.success && data.rates?.MMK) {
          rate = 1 / data.rates.MMK;
        } else {
          throw new Error('Failed to fetch exchange rate from all sources');
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

      // Fallback to approximate rate if all else fails (current rate: 1 USD = 4010 MMK)
      // So 1 MMK = 1/4010 = 0.000249 USD
      const fallbackRate = 1 / 4010; // This is "1 MMK = X USD" format
      console.warn(`Using fallback exchange rate: 1 USD = 4010 MMK (1 MMK = ${fallbackRate.toFixed(6)} USD)`);
      return fallbackRate;
    }
  }

  // Convert MMK to USD
  // Note: fetchExchangeRate returns the rate as "1 MMK = X USD" (a small number like 0.000476)
  // So to convert: MMK amount * rate = USD amount
  async convertToUSD(mmkAmount: number): Promise<number> {
    const rate = await this.fetchExchangeRate();
    // Rate is already in "1 MMK = X USD" format, so multiply
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

