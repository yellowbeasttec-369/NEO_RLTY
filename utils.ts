
import { Asset, Client } from './types';
import { FINAL_ASSET_DEFAULTS } from './constants';

export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-AE', { 
    style: 'currency', 
    currency: 'AED', 
    maximumFractionDigits: 0 
  }).format(val);

export const formatArea = (sqft: number, unit: 'imperial' | 'metric' = 'imperial') => {
  if (!sqft) return '-';
  if (unit === 'metric') return `${(sqft * 0.092903).toFixed(1)} m²`;
  return `${Number(sqft).toLocaleString()} sq.ft`;
};

export const safeParseJSON = (text: string | null, fallback: any) => {
  if (!text) return fallback;
  try {
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return fallback;
  }
};

export const normalizeAsset = (asset: any): Asset => {
  const normalized = { ...FINAL_ASSET_DEFAULTS, ...asset } as Asset;
  
  // Coercion & Validation
  const numericFields = ['size', 'value', 'rent', 'serviceCharges', 'managementFee', 'otherExpenses', 'purchasePrice', 'acquisitionCosts', 'mortgageBalance', 'annualMortgagePayment'];
  numericFields.forEach(field => {
    (normalized as any)[field] = parseFloat((asset as any)[field]) || 0;
  });

  return normalized;
};

export const normalizeClient = (client: any): Client => {
  const assets = (client.assets || []).map(normalizeAsset);
  return {
    ...client,
    tags: Array.isArray(client.tags) ? client.tags : [],
    assets,
    totalValue: assets.reduce((sum: number, a: Asset) => sum + a.value, 0),
    totalUnits: assets.length
  };
};

export const calculateDaysVacant = (sinceDate: string) => {
  if (!sinceDate) return 0;
  const diff = new Date().getTime() - new Date(sinceDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};
