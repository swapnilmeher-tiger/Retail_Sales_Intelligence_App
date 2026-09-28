import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  TrendingUp, TrendingDown, DollarSign, Target, ShoppingBag,
  RotateCcw, Percent, AlertOctagon, Filter, Download, Share2,
  RefreshCw, Award, ArrowUpRight, ArrowDownRight, Layers,
  ChevronDown, Check, Store as StoreIcon, ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, WeeklySalesRecord } from '@/lib/data-generator';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

interface DashboardViewProps {
  stores: Store[];
  sales: WeeklySalesRecord[];
  onResetData: () => void;
}

const REGION_COLORS: Record<string, string> = {
  West: '#3B82F6', // Blue
  East: '#10B981', // Emerald
  North: '#8B5CF6', // Purple
  Central: '#F59E0B', // Amber
  South: '#EC4899', // Pink
};

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

export function DashboardView({ stores, sales, onResetData }: DashboardViewProps) {
  // Filters State
  const [selectedWeek, setSelectedWeek] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedStore, setSelectedStore] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedLink, setCopiedLink] = useState(false);

  // Store lookup map
  const storeMap = useMemo(() => new Map(stores.map(s => [s.store_id, s])), [stores]);

  // Unique filter lists
  const availableWeeks = useMemo(() => {
    return Array.from(new Set(sales.map(s => s.week))).sort();
  }, [sales]);

  const availableRegions = useMemo(() => {
    return Array.from(new Set(stores.map(s => s.region))).sort();
  }, [stores]);

  const availableCities = useMemo(() => {
    const list = stores
      .filter(s => selectedRegion === 'ALL' || s.region === selectedRegion)
      .map(s => s.city);
    return Array.from(new Set(list)).sort();
  }, [stores, selectedRegion]);

  const availableFormats = useMemo(() => {
    return Array.from(new Set(stores.map(s => s.store_format))).sort();
  }, [stores]);

  const availableStores = useMemo(() => {
    return stores.filter(s => {
      if (selectedRegion !== 'ALL' && s.region !== selectedRegion) return false;
      if (selectedCity !== 'ALL' && s.city !== selectedCity) return false;
      if (selectedFormat !== 'ALL' && s.store_format !== selectedFormat) return false;
      return true;
    });
  }, [stores, selectedRegion, selectedCity, selectedFormat]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(sales.map(s => s.product_category))).sort();
  }, [sales]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return sales.filter(record => {
      const store = storeMap.get(record.store_id);
      if (!store) return false;

      if (selectedWeek !== 'ALL' && record.week !== selectedWeek) return false;
      if (selectedRegion !== 'ALL' && store.region !== selectedRegion) return false;
      if (selectedStore !== 'ALL' && record.store_id !== selectedStore) return false;
      if (selectedCity !== 'ALL' && store.city !== selectedCity) return false;
      if (selectedFormat !== 'ALL' && store.store_format !== selectedFormat) return false;
      if (selectedCategory !== 'ALL' && record.product_category !== selectedCategory) return false;

      return true;
    });
  }, [sales, storeMap, selectedWeek, selectedRegion, selectedStore, selectedCity, selectedFormat, selectedCategory]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedWeek('ALL');
    setSelectedRegion('ALL');
    setSelectedStore('ALL');
    setSelectedCity('ALL');
    setSelectedFormat('ALL');
    setSelectedCategory('ALL');
  };

  const hasActiveFilters =
    selectedWeek !== 'ALL' ||
    selectedRegion !== 'ALL' ||
    selectedStore !== 'ALL' ||
    selectedCity !== 'ALL' ||
    selectedFormat !== 'ALL' ||
    selectedCategory !== 'ALL';

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalNetSales = 0;
    let totalTargetSales = 0;
    let totalTransactions = 0;
    let totalReturnAmount = 0;
    let totalDiscountAmount = 0;
    let totalStockoutEvents = 0;
    let totalFootfall = 0;

    filteredRecords.forEach(r => {
      totalNetSales += r.net_sales;
      totalTargetSales += r.target_sales;
      totalTransactions += r.transaction_count;
      totalReturnAmount += r.return_amount;
      totalDiscountAmount += r.discount_amount;
      totalFootfall += r.footfall;
      if (r.stockout_flag === 1) {
        totalStockoutEvents += 1;
      }
    });

    const targetAchievement = totalTargetSales > 0 ? (totalNetSales / totalTargetSales) * 100 : 0;
    const avgTransactionValue = totalTransactions > 0 ? totalNetSales / totalTransactions : 0;
    const returnRate = totalNetSales > 0 ? (totalReturnAmount / totalNetSales) * 100 : 0;
    const discountRate = totalNetSales > 0 ? (totalDiscountAmount / totalNetSales) * 100 : 0;
    const conversionRate = totalFootfall > 0 ? (totalTransactions / totalFootfall) * 100 : 0;
    const stockoutRate = filteredRecords.length > 0 ? (totalStockoutEvents / filteredRecords.length) * 100 : 0;

    return {
      totalNetSales,
      totalTargetSales,
      targetAchievement,
      avgTransactionValue,
      returnRate,
      discountRate,
      conversionRate,
      totalTransactions,
      totalStockoutEvents,
      stockoutRate,
      recordsCount: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Weekly Trend Chart Data
  const weeklyTrendData = useMemo(() => {
    const map = new Map<string, { week: string; netSales: number; targetSales: number; returns: number }>();
    filteredRecords.forEach(r => {
      const existing = map.get(r.week) || { week: r.week, netSales: 0, targetSales: 0, returns: 0 };
      existing.netSales += r.net_sales;
      existing.targetSales += r.target_sales;
      existing.returns += r.return_amount;
      map.set(r.week, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week));
  }, [filteredRecords]);

  // Sales by Region
  const regionData = useMemo(() => {
    const map = new Map<string, { region: string; netSales: number; targetSales: number; stores: Set<string> }>();
    filteredRecords.forEach(r => {
      const store = storeMap.get(r.store_id);
      if (!store) return;
      const reg = store.region;
      const curr = map.get(reg) || { region: reg, netSales: 0, targetSales: 0, stores: new Set() };
      curr.netSales += r.net_sales;
      curr.targetSales += r.target_sales;
      curr.stores.add(r.store_id);
      map.set(reg, curr);
    });

    return Array.from(map.values())
      .map(item => ({
        region: item.region,
        netSales: item.netSales,
        targetSales: item.targetSales,
        achievement: item.targetSales > 0 ? (item.netSales / item.targetSales) * 100 : 0,
        storeCount: item.stores.size,
      }))
      .sort((a, b) => b.netSales - a.netSales);
  }, [filteredRecords, storeMap]);

  // Category Performance Data
  const categoryData = useMemo(() => {
    const map = new Map<string, { category: string; netSales: number; returnAmount: number; discountAmount: number; stockouts: number; count: number }>();
    filteredRecords.forEach(r => {
      const cat = r.product_category;
      const curr = map.get(cat) || { category: cat, netSales: 0, returnAmount: 0, discountAmount: 0, stockouts: 0, count: 0 };
      curr.netSales += r.net_sales;
      curr.returnAmount += r.return_amount;
      curr.discountAmount += r.discount_amount;
      if (r.stockout_flag === 1) curr.stockouts += 1;
      curr.count += 1;
      map.set(cat, curr);
    });

    return Array.from(map.values())
      .map(c => ({
        category: c.category,
        netSales: c.netSales,
        returnRate: c.netSales > 0 ? (c.returnAmount / c.netSales) * 100 : 0,
        discountRate: c.netSales > 0 ? (c.discountAmount / c.netSales) * 100 : 0,
        stockoutRate: c.count > 0 ? (c.stockouts / c.count) * 100 : 0,
        stockouts: c.stockouts,
      }))
      .sort((a, b) => b.netSales - a.netSales);
  }, [filteredRecords]);

  // Store Leaderboard Data
  const storeLeaderboard = useMemo(() => {
    const map = new Map<string, { store_id: string; netSales: number; targetSales: number; transactions: number; returnAmount: number }>();
    filteredRecords.forEach(r => {
      const curr = map.get(r.store_id) || { store_id: r.store_id, netSales: 0, targetSales: 0, transactions: 0, returnAmount: 0 };
      curr.netSales += r.net_sales;
      curr.targetSales += r.target_sales;
      curr.transactions += r.transaction_count;
      curr.returnAmount += r.return_amount;
      map.set(r.store_id, curr);
    });

    return Array.from(map.values())
      .map(item => {
        const storeInfo = storeMap.get(item.store_id);
        const achievement = item.targetSales > 0 ? (item.netSales / item.targetSales) * 100 : 0;
        return {
          store_id: item.store_id,
          store_name: storeInfo?.store_name || item.store_id,
          region: storeInfo?.region || 'N/A',
          city: storeInfo?.city || 'N/A',
          format: storeInfo?.store_format || 'Standard',
          netSales: item.netSales,
          targetSales: item.targetSales,
          achievement,
          atv: item.transactions > 0 ? item.netSales / item.transactions : 0,
          returnRate: item.netSales > 0 ? (item.returnAmount / item.netSales) * 100 : 0,
        };
      })
      .sort((a, b) => b.netSales - a.netSales);
  }, [filteredRecords, storeMap]);

  // Stockout Risk Analysis Data
  const stockoutRiskData = useMemo(() => {
    const map = new Map<string, { category: string; stockouts: number; totalRecords: number }>();
    filteredRecords.forEach(r => {
      const curr = map.get(r.product_category) || { category: r.product_category, stockouts: 0, totalRecords: 0 };
      if (r.stockout_flag === 1) curr.stockouts += 1;
      curr.totalRecords += 1;
      map.set(r.product_category, curr);
    });

    return Array.from(map.values())
      .map(c => ({
        category: c.category.split(' ')[0], // Compact label
        fullName: c.category,
        stockoutIncidents: c.stockouts,
        stockoutRate: c.totalRecords > 0 ? Number(((c.stockouts / c.totalRecords) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.stockoutIncidents - a.stockoutIncidents);
  }, [filteredRecords]);

  // Business Insights Synthesis
  const businessInsights = useMemo(() => {
    if (regionData.length === 0 || storeLeaderboard.length === 0) return null;

    const bestRegion = regionData[0];
    const worstRegion = regionData[regionData.length - 1];

    const storesMissingTarget = storeLeaderboard.filter(s => s.achievement < 100);
    const topStoresAboveTarget = storeLeaderboard.filter(s => s.achievement >= 100);

    const overallReturnRate = metrics.returnRate;
    const highReturnCategories = categoryData.filter(c => c.returnRate > overallReturnRate);

    const highestStockoutCat = stockoutRiskData.length > 0 ? stockoutRiskData[0] : null;

    return {
      bestRegion,
      worstRegion,
      storesMissingTarget,
      topStoresAboveTarget,
      highReturnCategories,
      highestStockoutCat,
    };
  }, [regionData, storeLeaderboard, categoryData, stockoutRiskData, metrics.returnRate]);

  // Export Filtered Data as Excel
  const handleExportData = () => {
    const exportRows = filteredRecords.map(r => {
      const st = storeMap.get(r.store_id);
      return {
        'Week': r.week,
        'Store ID': r.store_id,
        'Store Name': st?.store_name || '',
        'Region': st?.region || '',
        'City': st?.city || '',
        'Store Format': st?.store_format || '',
        'Product Category': r.product_category,
        'Net Sales ($)': r.net_sales,
        'Target Sales ($)': r.target_sales,
        'Achievement (%)': Number(((r.net_sales / Math.max(1, r.target_sales)) * 100).toFixed(1)),
        'Gross Sales ($)': r.gross_sales,
        'Discount Amount ($)': r.discount_amount,
        'Return Amount ($)': r.return_amount,
        'Transaction Count': r.transaction_count,
        'Avg Basket Size': r.avg_basket_size,
        'Stockout Flag': r.stockout_flag,
        'Conversion Rate (%)': r.conversion_rate,
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered_Sales_Intelligence');
    XLSX.writeFile(wb, `Retail_Sales_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Share link copy
  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      
      {/* Top Header Bar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Retail Sales Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Cross-regional performance analytics, store targets, and operational insights
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetData}
            className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Data Manager
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShareLink}
            className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Share Dashboard
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleExportData}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/25"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Filtered Excel
          </Button>
        </div>
      </header>

      {/* Multi-Dimensional Filter Bar */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-md">
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 tracking-wide uppercase">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>Multi-Dimensional Filters</span>
              <span className="text-slate-500 font-mono text-[11px] font-normal">
                ({metrics.recordsCount} of {sales.length} rows active)
              </span>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset All Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Week Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Week</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Weeks ({availableWeeks.length})</option>
                {availableWeeks.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Region</label>
              <select
                value={selectedRegion}
                onChange={e => {
                  setSelectedRegion(e.target.value);
                  setSelectedStore('ALL');
                  setSelectedCity('ALL');
                }}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Regions (5)</option>
                {availableRegions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Store Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Store</label>
              <select
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Stores ({availableStores.length})</option>
                {availableStores.map(s => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name} ({s.store_id})
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">City</label>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Cities ({availableCities.length})</option>
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Store Format Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Store Format</label>
              <select
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Formats ({availableFormats.length})</option>
                {availableFormats.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Product Category Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Product Category</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="ALL">All Categories ({availableCategories.length})</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Net Sales */}
        <Card className="border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Net Sales</span>
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1">
              {formatCurrency(metrics.totalNetSales)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
              <span>Target: {formatCurrency(metrics.totalTargetSales)}</span>
              <span className={metrics.totalNetSales >= metrics.totalTargetSales ? 'text-emerald-400' : 'text-amber-400'}>
                {metrics.totalNetSales >= metrics.totalTargetSales ? 'Above Target' : 'Under Target'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Target Achievement */}
        <Card className="border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Target Achievement</span>
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1 ${
              metrics.targetAchievement >= 100 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {formatPercent(metrics.targetAchievement)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              {metrics.targetAchievement >= 100 ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">+{formatPercent(metrics.targetAchievement - 100)} over plan</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-medium">{formatPercent(100 - metrics.targetAchievement)} deficit</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Average Transaction Value (ATV) */}
        <Card className="border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Transaction Value</span>
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1">
              ${metrics.avgTransactionValue.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
              <span>{formatNumber(metrics.totalTransactions)} txns</span>
              <span className="text-slate-300">Conv: {metrics.conversionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Return Rate */}
        <Card className="border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Return Rate</span>
              <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1 ${
              metrics.returnRate > 8.0 ? 'text-rose-400' : 'text-slate-100'
            }`}>
              {formatPercent(metrics.returnRate)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
              <span className="font-mono text-[11px]">(Returns / Net Sales)</span>
              <span className={metrics.returnRate > 8.0 ? 'text-rose-400 font-medium' : 'text-emerald-400'}>
                {metrics.returnRate > 8.0 ? 'High Threshold' : 'Normal Range'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Discount Rate */}
        <Card className="border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Discount Rate</span>
              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1">
              {formatPercent(metrics.discountRate)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-slate-400 flex items-center justify-between mt-1">
              <span>Stockout Events: {metrics.totalStockoutEvents}</span>
              <span className="text-amber-400 font-mono">({formatPercent(metrics.stockoutRate)})</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action-Oriented Business Insights Section */}
      {businessInsights && (
        <Card className="border-blue-500/30 bg-gradient-to-r from-slate-900 via-slate-900/95 to-blue-950/40 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">Executive Business Insights & Action Plan</CardTitle>
                  <CardDescription>
                    Algorithmic performance diagnosis and targeted commercial recommendations
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="hidden sm:inline-flex bg-blue-500/20 text-blue-300 border-blue-500/40">
                Live Data Audit
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Insight 1: Best / Worst Regions */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Regional Polarization</span>
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Top Performer:</span>
                    <span className="font-semibold text-emerald-400">
                      {businessInsights.bestRegion.region} ({formatCurrency(businessInsights.bestRegion.netSales)} • {formatPercent(businessInsights.bestRegion.achievement)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Lagging Region:</span>
                    <span className="font-semibold text-rose-400">
                      {businessInsights.worstRegion.region} ({formatCurrency(businessInsights.worstRegion.netSales)} • {formatPercent(businessInsights.worstRegion.achievement)})
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Action: Reallocate promotional budget from {businessInsights.bestRegion.region} to address footfall conversion gaps in {businessInsights.worstRegion.region}.
                </p>
              </div>

              {/* Insight 2: Stores Missing Target */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Stores Missing Target</span>
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-sm">
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {businessInsights.storesMissingTarget.length}
                  </span>
                  <span className="text-slate-400 text-xs ml-2">
                    of {storeLeaderboard.length} stores below 100% quota
                  </span>
                </div>
                <div className="text-xs text-slate-300 truncate">
                  Critical focus: {businessInsights.storesMissingTarget.slice(0, 3).map(s => s.store_name).join(', ') || 'None'}
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Action: Review local discount mix and staff peak operating hours at lagging retail locations.
                </p>
              </div>

              {/* Insight 3: High Return Categories */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>High Return Categories</span>
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="space-y-1">
                  {businessInsights.highReturnCategories.length > 0 ? (
                    businessInsights.highReturnCategories.slice(0, 2).map(c => (
                      <div key={c.category} className="flex items-center justify-between text-xs">
                        <span className="text-slate-200">{c.category}</span>
                        <span className="font-mono text-rose-400 font-semibold">{formatPercent(c.returnRate)} return rate</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-emerald-400">All categories operating within target return thresholds.</div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Action: Initiate quality control audit and sizing guide updates for merchandise categories exceeding {formatPercent(metrics.returnRate)} benchmark.
                </p>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Charts Row 1: Weekly Trend + Sales by Region */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart (2 cols) */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Weekly Performance Trend</CardTitle>
              <CardDescription>Net Sales vs Sales Target trajectory across operating weeks</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Net Sales
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Target
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => formatCurrency(val)}
                  width={65}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: number, name: string) => [formatCurrency(val), name === 'netSales' ? 'Net Sales' : 'Target Sales']}
                />
                <Area type="monotone" dataKey="netSales" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                <Line type="monotone" dataKey="targetSales" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Regional Sales Chart (1 col) */}
        <Card className="border-slate-800 bg-slate-900/80 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Sales by Region</CardTitle>
            <CardDescription>Revenue contribution across 5 core retail regions</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="netSales"
                  nameKey="region"
                >
                  {regionData.map(entry => (
                    <Cell key={entry.region} fill={REGION_COLORS[entry.region] || '#64748B'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: number) => [formatCurrency(val), 'Net Sales']}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value, entry: any) => `${value} (${formatPercent(entry.payload?.achievement || 0)})`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row 2: Category Performance & Stockout Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Performance Bar Chart */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Category Performance & Volume</CardTitle>
                <CardDescription>Total net sales and return exposure by department</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-slate-400">Ranked by Sales</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E293B" />
                <XAxis
                  type="number"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => formatCurrency(val)}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  width={110}
                  tickFormatter={str => str.length > 14 ? `${str.slice(0, 13)}...` : str}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: number, name: string) => [
                    formatCurrency(val),
                    'Net Sales'
                  ]}
                />
                <Bar dataKey="netSales" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={18}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stockout Risk Chart */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Stockout Risk by Category</CardTitle>
                <CardDescription>Recorded supply stockout incident events</CardDescription>
              </div>
              <Badge variant="warning" className="text-xs">
                Supply Chain Risk
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stockoutRiskData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="category" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: number) => [`${val} stockouts`, 'Supply Incidents']}
                />
                <Bar dataKey="stockoutIncidents" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={28}>
                  {stockoutRiskData.map((_, index) => (
                    <Cell key={`stock-${index}`} fill={index === 0 ? '#DC2626' : '#F87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Store Leaderboard Table */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Store Performance Leaderboard
              </CardTitle>
              <CardDescription>
                Ranked store performance, target attainment, and average transaction value
              </CardDescription>
            </div>
            <div className="text-xs text-slate-400">
              Showing {storeLeaderboard.length} stores based on current filter
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-y border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Store Name</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4 text-right">Net Sales</th>
                <th className="py-3 px-4 text-right">Target</th>
                <th className="py-3 px-4 text-right">Attainment</th>
                <th className="py-3 px-4 text-right">ATV</th>
                <th className="py-3 px-4 text-right">Return Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {storeLeaderboard.map((store, idx) => (
                <tr key={store.store_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">
                    <div>{store.store_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{store.store_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                      {store.region}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{store.city}</td>
                  <td className="py-3 px-4 text-slate-400">{store.format}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                    {formatCurrency(store.netSales)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {formatCurrency(store.targetSales)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    <span className={store.achievement >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
                      {formatPercent(store.achievement)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    ${store.atv.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={store.returnRate > 8 ? 'text-rose-400' : 'text-slate-300'}>
                      {formatPercent(store.returnRate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
}
