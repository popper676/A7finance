// Currency Exchange Rate Service
// Primary: exchangerate-api.com (if API key provided) - Most reliable
// Fallback 1: exchangerate.host (free, no API key required) - Works from browser
// Fallback 2: Binance API (USDT/MMK) - May be blocked in some regions like Malaysia

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
  private readonly API_KEY = (import.meta as any).env?.VITE_EXCHANGE_RATE_API_KEY || '';

  // Fetch exchange rate from API
  async fetchExchangeRate(): Promise<number> {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (this.exchangeRate && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.exchangeRate;
    }

    try {
      let rate: number | null = null;

      // Primary: Try exchangerate-api.com if API key is provided (Most reliable)
      if (this.API_KEY) {
        try {
          const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${this.API_KEY}/pair/USD/MMK`
          );
          const data = await response.json();
          if (data.conversion_rate) {
            rate = 1 / data.conversion_rate;
            console.log(`✓ Using exchangerate-api.com: 1 USD = ${(1/rate).toLocaleString()} MMK`);
          }
        } catch (error: any) {
          console.warn('⚠ exchangerate-api.com failed, trying fallback:', error.message || error);
        }
      }

      // Fallback 1: exchangerate.host (free, no API key) - Works from browser
      if (!rate) {
        try {
          const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=MMK');
          const data: ExchangeRateResponse = await response.json();
          
          if (data.success && data.rates?.MMK) {
            rate = 1 / data.rates.MMK;
            console.log(`✓ Using exchangerate.host: 1 USD = ${data.rates.MMK.toLocaleString()} MMK`);
          } else {
            throw new Error('exchangerate.host returned invalid data');
          }
        } catch (error: any) {
          console.warn('⚠ exchangerate.host failed:', error.message || error);
        }
      }

      // Fallback 2: Try Binance API (USDT/MMK pair) - May be blocked in some regions
      // USDT is pegged to USD, so USDT/MMK price gives us USD/MMK rate
      if (!rate) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout (faster fail)
          
          const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTMMK', {
            signal: controller.signal,
            mode: 'cors'
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Binance API returned ${response.status}`);
          }
          
          const data: BinanceResponse = await response.json();
          
          if (data.price) {
            const usdtToMmk = parseFloat(data.price);
            if (usdtToMmk > 0 && !isNaN(usdtToMmk)) {
              rate = 1 / usdtToMmk;
              console.log(`✓ Using Binance API: 1 USDT = ${usdtToMmk.toLocaleString()} MMK`);
            } else {
              throw new Error('Invalid price from Binance API');
            }
          } else {
            throw new Error('No price data from Binance API');
          }
        } catch (error: any) {
          // Binance may be blocked in some regions (e.g., Malaysia), so we silently fail
          if (error.name === 'AbortError') {
            console.warn('⚠ Binance API timeout (may be blocked in your region)');
          } else {
            console.warn('⚠ Binance API failed (may be blocked):', error.message || error);
          }
        }
      }

      // If all APIs failed, throw error to use fallback rate
      if (!rate) {
        throw new Error('Failed to fetch exchange rate from all sources');
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

