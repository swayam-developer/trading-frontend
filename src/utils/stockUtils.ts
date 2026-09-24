/**
 * Stock & Security Branding Utilities
 */

export interface BrandTheme {
  bg: string;
  text: string;
  border: string;
  accent: string;
}

// Known domain mappings for reliable logo generation via Google Favicon CDN
export const STOCK_DOMAIN_MAP: Record<string, string> = {
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  AMZN: 'amazon.com',
  TSLA: 'tesla.com',
  META: 'meta.com',
  NVDA: 'nvidia.com',
  NFLX: 'netflix.com',
  JPM: 'jpmorganchase.com',
  JNJ: 'jnj.com',
  V: 'visa.com',
  WMT: 'walmart.com',
  PG: 'pg.com',
  HD: 'homedepot.com',
  DIS: 'disney.com',
  BTC: 'bitcoin.org',
  ETH: 'ethereum.org',
  PYPL: 'paypal.com',
  ADBE: 'adobe.com',
  CRM: 'salesforce.com',
  INTC: 'intel.com',
  AMD: 'amd.com',
  UBER: 'uber.com',
  ABNB: 'airbnb.com',
  COIN: 'coinbase.com',
  SPOT: 'spotify.com',
  ORCL: 'oracle.com',
  CSCO: 'cisco.com',
  COST: 'costco.com',
  PEP: 'pepsico.com',
  KO: 'coca-cola.com',
  NKE: 'nike.com',
  BABA: 'alibaba.com',
};

// Branded color palettes for top securities
export const BRAND_COLORS: Record<string, BrandTheme> = {
  AAPL: { bg: '#1E293B', text: '#E2E8F0', border: '#334155', accent: '#A2AAAD' },
  MSFT: { bg: 'rgba(0, 164, 239, 0.12)', text: '#00A4EF', border: 'rgba(0, 164, 239, 0.35)', accent: '#00A4EF' },
  GOOGL: { bg: 'rgba(234, 67, 53, 0.12)', text: '#EA4335', border: 'rgba(234, 67, 53, 0.35)', accent: '#4285F4' },
  GOOG: { bg: 'rgba(234, 67, 53, 0.12)', text: '#EA4335', border: 'rgba(234, 67, 53, 0.35)', accent: '#4285F4' },
  AMZN: { bg: 'rgba(255, 153, 0, 0.12)', text: '#FF9900', border: 'rgba(255, 153, 0, 0.35)', accent: '#FF9900' },
  TSLA: { bg: 'rgba(232, 33, 39, 0.12)', text: '#E82127', border: 'rgba(232, 33, 39, 0.35)', accent: '#E82127' },
  META: { bg: 'rgba(6, 104, 225, 0.12)', text: '#0668E1', border: 'rgba(6, 104, 225, 0.35)', accent: '#0668E1' },
  NVDA: { bg: 'rgba(118, 185, 0, 0.12)', text: '#76B900', border: 'rgba(118, 185, 0, 0.35)', accent: '#76B900' },
  NFLX: { bg: 'rgba(229, 9, 20, 0.12)', text: '#E50914', border: 'rgba(229, 9, 20, 0.35)', accent: '#E50914' },
  DIS: { bg: 'rgba(17, 60, 207, 0.12)', text: '#3B82F6', border: 'rgba(17, 60, 207, 0.35)', accent: '#113CCF' },
  JPM: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.35)', accent: '#10B981' },
  JNJ: { bg: 'rgba(213, 25, 34, 0.12)', text: '#D51922', border: 'rgba(213, 25, 34, 0.35)', accent: '#D51922' },
  V: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.35)', accent: '#1A1F71' },
  WMT: { bg: 'rgba(0, 113, 206, 0.12)', text: '#0071CE', border: 'rgba(0, 113, 206, 0.35)', accent: '#FFC220' },
  PG: { bg: 'rgba(0, 61, 165, 0.12)', text: '#38BDF8', border: 'rgba(0, 61, 165, 0.35)', accent: '#003DA5' },
  HD: { bg: 'rgba(249, 99, 2, 0.12)', text: '#F96302', border: 'rgba(249, 99, 2, 0.35)', accent: '#F96302' },
  BTC: { bg: 'rgba(247, 147, 26, 0.12)', text: '#F7931A', border: 'rgba(247, 147, 26, 0.35)', accent: '#F7931A' },
  ETH: { bg: 'rgba(98, 126, 234, 0.12)', text: '#627EEA', border: 'rgba(98, 126, 234, 0.35)', accent: '#627EEA' },
};

export const DEFAULT_BRAND: BrandTheme = {
  bg: 'rgba(0, 230, 118, 0.12)',
  text: '#00E676',
  border: 'rgba(0, 230, 118, 0.3)',
  accent: '#00E676',
};

/**
 * Returns the verified, high-resolution company logo URL.
 * Prefers Google's 128px Favicon CDN which provides 100% uptime and high fidelity.
 */
export const getStockLogoUrl = (symbol?: string, iconUrl?: string): string => {
  const cleanSymbol = (symbol || '').toUpperCase().trim().replace('/USD', '');

  // 1. If we have a verified domain for this ticker, use Google Favicon V2 (128x128)
  if (STOCK_DOMAIN_MAP[cleanSymbol]) {
    const domain = STOCK_DOMAIN_MAP[cleanSymbol];
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
  }

  // 2. If existing iconUrl is valid and NOT an inaccessible Clearbit URL, use it
  if (iconUrl && iconUrl.startsWith('http') && !iconUrl.includes('clearbit.com')) {
    return iconUrl;
  }

  // 3. Fallback: guess domain from ticker or symbol
  if (cleanSymbol) {
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanSymbol.toLowerCase()}.com&size=128`;
  }

  return '';
};

/**
 * Returns the brand styling configuration for a given stock symbol.
 */
export const getStockBrand = (symbol?: string): BrandTheme => {
  const cleanSymbol = (symbol || '').toUpperCase().trim().replace('/USD', '');
  return BRAND_COLORS[cleanSymbol] || DEFAULT_BRAND;
};
