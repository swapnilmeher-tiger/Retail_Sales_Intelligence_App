export interface Store {
  store_id: string;
  store_name: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  city: string;
  store_format: 'Flagship' | 'Supercenter' | 'Mall Boutique' | 'Express Outlet';
}

export interface WeeklySalesRecord {
  week: string; // e.g., '2024-W01' through '2024-W16'
  store_id: string;
  product_category: string;
  gross_sales: number;
  discount_amount: number;
  return_amount: number;
  net_sales: number;
  target_sales: number;
  transaction_count: number;
  footfall: number;
  units_sold: number;
  stockout_flag: 0 | 1;
  conversion_rate: number; // in percentage
  avg_basket_size: number;
  promotional_units: number;
  shrinkage_loss: number;
  operating_hours: number;
  customer_satisfaction_score: number;
  online_pickup_orders: number;
  inventory_turnover: number;
}

export const REGIONS: Store['region'][] = ['North', 'South', 'East', 'West', 'Central'];

export const STORE_FORMATS: Store['store_format'][] = [
  'Flagship',
  'Supercenter',
  'Mall Boutique',
  'Express Outlet'
];

export const PRODUCT_CATEGORIES = [
  'Electronics & Gadgets',
  'Fashion & Apparel',
  'Home & Kitchen',
  'Groceries & Fresh',
  'Beauty & Personal Care',
  'Sports & Outdoors'
];

export const INITIAL_STORES: Store[] = [
  { store_id: 'STR_001', store_name: 'Metro Center Flagship', region: 'North', city: 'Chicago', store_format: 'Flagship' },
  { store_id: 'STR_002', store_name: 'Lakeside Supercenter', region: 'North', city: 'Minneapolis', store_format: 'Supercenter' },
  { store_id: 'STR_003', store_name: 'Downtown Express', region: 'North', city: 'Detroit', store_format: 'Express Outlet' },
  { store_id: 'STR_004', store_name: 'Highland Mall Boutique', region: 'North', city: 'Milwaukee', store_format: 'Mall Boutique' },
  { store_id: 'STR_005', store_name: 'Lone Star Supercenter', region: 'South', city: 'Dallas', store_format: 'Supercenter' },
  { store_id: 'STR_006', store_name: 'Peach Tree Flagship', region: 'South', city: 'Atlanta', store_format: 'Flagship' },
  { store_id: 'STR_007', store_name: 'Biscayne Bay Mall', region: 'South', city: 'Miami', store_format: 'Mall Boutique' },
  { store_id: 'STR_008', store_name: 'Music City Express', region: 'South', city: 'Nashville', store_format: 'Express Outlet' },
  { store_id: 'STR_009', store_name: 'Manhattan 5th Ave', region: 'East', city: 'New York', store_format: 'Flagship' },
  { store_id: 'STR_010', store_name: 'Liberty Supercenter', region: 'East', city: 'Philadelphia', store_format: 'Supercenter' },
  { store_id: 'STR_011', store_name: 'Back Bay Boutique', region: 'East', city: 'Boston', store_format: 'Mall Boutique' },
  { store_id: 'STR_012', store_name: 'Capital Hill Express', region: 'East', city: 'Washington DC', store_format: 'Express Outlet' },
  { store_id: 'STR_013', store_name: 'Pacific Coast Flagship', region: 'West', city: 'Los Angeles', store_format: 'Flagship' },
  { store_id: 'STR_014', store_name: 'Bay Area Supercenter', region: 'West', city: 'San Francisco', store_format: 'Supercenter' },
  { store_id: 'STR_015', store_name: 'Emerald City Mall', region: 'West', city: 'Seattle', store_format: 'Mall Boutique' },
  { store_id: 'STR_016', store_name: 'Desert Ridge Express', region: 'West', city: 'Phoenix', store_format: 'Express Outlet' },
  { store_id: 'STR_017', store_name: 'Gateway Arch Flagship', region: 'Central', city: 'St. Louis', store_format: 'Flagship' },
  { store_id: 'STR_018', store_name: 'Mile High Supercenter', region: 'Central', city: 'Denver', store_format: 'Supercenter' },
  { store_id: 'STR_019', store_name: 'Plaza Mall Boutique', region: 'Central', city: 'Kansas City', store_format: 'Mall Boutique' },
  { store_id: 'STR_020', store_name: 'Heartland Express', region: 'Central', city: 'Indianapolis', store_format: 'Express Outlet' },
];

/**
 * Generates exact 1,920 records: 20 stores x 16 weeks x 6 product categories = 1,920 rows.
 * Each row has 19 columns as defined in retail_weekly_sales.xlsx.
 */
export function generateRealisticSalesData(storesList: Store[] = INITIAL_STORES): WeeklySalesRecord[] {
  const records: WeeklySalesRecord[] = [];
  const totalWeeks = 16; // 20 stores * 16 weeks * 6 categories = 1,920 rows!
  
  // Seeded pseudo-random generator for consistent, realistic patterns
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const categoryBaseValues: Record<string, { basePrice: number; returnRate: number; discountRate: number; stockoutProb: number }> = {
    'Electronics & Gadgets': { basePrice: 280, returnRate: 0.085, discountRate: 0.12, stockoutProb: 0.18 },
    'Fashion & Apparel': { basePrice: 75, returnRate: 0.145, discountRate: 0.22, stockoutProb: 0.11 },
    'Home & Kitchen': { basePrice: 110, returnRate: 0.065, discountRate: 0.15, stockoutProb: 0.09 },
    'Groceries & Fresh': { basePrice: 45, returnRate: 0.022, discountRate: 0.08, stockoutProb: 0.14 },
    'Beauty & Personal Care': { basePrice: 55, returnRate: 0.048, discountRate: 0.10, stockoutProb: 0.07 },
    'Sports & Outdoors': { basePrice: 130, returnRate: 0.078, discountRate: 0.14, stockoutProb: 0.13 },
  };

  const regionPerformanceMultiplier: Record<string, number> = {
    'West': 1.14,
    'East': 1.08,
    'North': 0.98,
    'Central': 0.91,
    'South': 0.84, // Intentionally lagging region for business insights!
  };

  for (let w = 1; w <= totalWeeks; w++) {
    const weekStr = `2024-W${w.toString().padStart(2, '0')}`;
    const seasonalTrend = 1 + Math.sin((w / totalWeeks) * Math.PI) * 0.15; // Natural retail holiday curve

    for (const store of storesList) {
      const regMult = regionPerformanceMultiplier[store.region] || 1.0;
      const formatMult = store.store_format === 'Flagship' ? 1.45 : store.store_format === 'Supercenter' ? 1.25 : store.store_format === 'Mall Boutique' ? 0.95 : 0.75;

      for (const category of PRODUCT_CATEGORIES) {
        const catConfig = categoryBaseValues[category];
        const randVariation = 0.85 + pseudoRandom() * 0.3;
        
        // Base units & footfall
        const baseFootfall = Math.round(1800 * regMult * formatMult * (0.85 + pseudoRandom() * 0.3));
        const conversionRate = Math.min(38, Math.max(12, 22 + (pseudoRandom() - 0.5) * 12));
        const transactions = Math.max(25, Math.round((baseFootfall * conversionRate) / 100));
        const unitsPerTx = 1.8 + pseudoRandom() * 1.6;
        const unitsSold = Math.round(transactions * unitsPerTx);

        const grossSales = Math.round(unitsSold * catConfig.basePrice * seasonalTrend * randVariation);
        
        // Discount & Returns
        const discountRateApplied = catConfig.discountRate + (pseudoRandom() - 0.5) * 0.05;
        const discountAmount = Math.round(grossSales * Math.max(0.02, discountRateApplied));
        
        // Return amount (Fashion has higher return rate, electronics has medium, groceries has low)
        const returnRateApplied = catConfig.returnRate + (pseudoRandom() - 0.5) * 0.03;
        const returnAmount = Math.round((grossSales - discountAmount) * Math.max(0.01, returnRateApplied));
        
        const netSales = Math.max(500, (grossSales - discountAmount) - returnAmount);

        // Target sales with store-specific variations (some stores consistently miss targets)
        const storeTargetFactor = store.store_id === 'STR_008' || store.store_id === 'STR_016' || store.store_id === 'STR_020'
          ? 1.28 // high target vs actual -> missing target
          : 0.96;
        const targetSales = Math.round(netSales * storeTargetFactor * (0.92 + pseudoRandom() * 0.2));

        // Stockout probability
        const isStockout = pseudoRandom() < (catConfig.stockoutProb * (store.store_format === 'Express Outlet' ? 1.5 : 1.0)) ? 1 : 0;

        records.push({
          week: weekStr,
          store_id: store.store_id,
          product_category: category,
          gross_sales: grossSales,
          discount_amount: discountAmount,
          return_amount: returnAmount,
          net_sales: netSales,
          target_sales: targetSales,
          transaction_count: transactions,
          footfall: baseFootfall,
          units_sold: unitsSold,
          stockout_flag: isStockout as 0 | 1,
          conversion_rate: Number(conversionRate.toFixed(2)),
          avg_basket_size: Number((unitsSold / Math.max(1, transactions)).toFixed(2)),
          promotional_units: Math.round(unitsSold * (discountRateApplied > 0.15 ? 0.35 : 0.15)),
          shrinkage_loss: Math.round(netSales * (0.008 + pseudoRandom() * 0.012)),
          operating_hours: store.store_format === 'Supercenter' ? 112 : 77,
          customer_satisfaction_score: Number((4.1 + (pseudoRandom() - 0.4) * 0.8).toFixed(1)),
          online_pickup_orders: Math.round(transactions * (0.12 + pseudoRandom() * 0.1)),
          inventory_turnover: Number((4.5 + pseudoRandom() * 2.2).toFixed(1)),
        });
      }
    }
  }

  return records;
}
