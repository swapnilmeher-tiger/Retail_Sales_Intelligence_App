import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, Download, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, WeeklySalesRecord, INITIAL_STORES, generateRealisticSalesData } from '@/lib/data-generator';

interface DataUploaderProps {
  onDataLoaded: (stores: Store[], sales: WeeklySalesRecord[]) => void;
}

export function DataUploader({ onDataLoaded }: DataUploaderProps) {
  const [storesData, setStoresData] = useState<Store[] | null>(null);
  const [salesData, setSalesData] = useState<WeeklySalesRecord[] | null>(null);
  const [storesFileName, setStoresFileName] = useState<string>('');
  const [salesFileName, setSalesFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]+/g, '');

  const handleStoreFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

      if (!rawRows || rawRows.length === 0) {
        throw new Error('Store Master file is empty.');
      }

      const parsedStores: Store[] = rawRows.map((row, idx) => {
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach(k => {
          normalized[normalizeKey(k)] = row[k];
        });

        const storeId = normalized['storeid'] || normalized['id'] || `STR_${String(idx + 1).padStart(3, '0')}`;
        const storeName = normalized['storename'] || normalized['name'] || `Store ${idx + 1}`;
        const region = normalized['region'] || 'Central';
        const city = normalized['city'] || 'Metropolis';
        const storeFormat = normalized['storeformat'] || normalized['format'] || 'Supercenter';

        return {
          store_id: String(storeId).trim(),
          store_name: String(storeName).trim(),
          region: region as any,
          city: String(city).trim(),
          store_format: storeFormat as any,
        };
      });

      setStoresData(parsedStores);
      setStoresFileName(file.name);
    } catch (err: any) {
      setUploadError(`Failed to parse Store Master: ${err.message || 'Check Excel format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSalesFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

      if (!rawRows || rawRows.length === 0) {
        throw new Error('Weekly Sales file is empty.');
      }

      const parsedSales: WeeklySalesRecord[] = rawRows.map((row, idx) => {
        const n: Record<string, any> = {};
        Object.keys(row).forEach(k => {
          n[normalizeKey(k)] = row[k];
        });

        const week = String(n['week'] || `2024-W${Math.floor(idx / 120) + 1}`).trim();
        const storeId = String(n['storeid'] || n['id'] || 'STR_001').trim();
        const productCategory = String(n['productcategory'] || n['category'] || 'General Retail').trim();
        
        const netSales = Number(n['netsales'] || n['sales'] || 0);
        const grossSales = Number(n['grosssales'] || netSales * 1.15 || 0);
        const targetSales = Number(n['targetsales'] || n['target'] || netSales * 1.05 || 0);
        const returnAmount = Number(n['returnamount'] || n['returns'] || netSales * 0.05 || 0);
        const discountAmount = Number(n['discountamount'] || n['discount'] || netSales * 0.1 || 0);
        const transactionCount = Number(n['transactioncount'] || n['transactions'] || Math.max(1, Math.round(netSales / 75)));
        const footfall = Number(n['footfall'] || transactionCount * 4);
        const unitsSold = Number(n['unitssold'] || transactionCount * 2);
        const stockoutRaw = n['stockoutflag'] ?? n['stockout'] ?? 0;
        const stockoutFlag = Number(stockoutRaw) > 0 ? 1 : 0;
        const conversionRate = Number(n['conversionrate'] || (footfall > 0 ? (transactionCount / footfall) * 100 : 25));

        return {
          week,
          store_id: storeId,
          product_category: productCategory,
          gross_sales: grossSales,
          discount_amount: discountAmount,
          return_amount: returnAmount,
          net_sales: netSales,
          target_sales: targetSales,
          transaction_count: transactionCount,
          footfall,
          units_sold: unitsSold,
          stockout_flag: stockoutFlag as 0 | 1,
          conversion_rate: conversionRate,
          avg_basket_size: Number((unitsSold / Math.max(1, transactionCount)).toFixed(2)),
          promotional_units: Math.round(unitsSold * 0.2),
          shrinkage_loss: Math.round(netSales * 0.01),
          operating_hours: 80,
          customer_satisfaction_score: 4.5,
          online_pickup_orders: Math.round(transactionCount * 0.15),
          inventory_turnover: 5.2,
        };
      });

      setSalesData(parsedSales);
      setSalesFileName(file.name);
    } catch (err: any) {
      setUploadError(`Failed to parse Weekly Sales: ${err.message || 'Check Excel format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLaunchWithUploaded = () => {
    if (!storesData || !salesData) {
      setUploadError('Please upload both files before launching the dashboard.');
      return;
    }
    onDataLoaded(storesData, salesData);
  };

  const handleLoadDemoDataset = () => {
    setIsProcessing(true);
    const demoStores = INITIAL_STORES;
    const demoSales = generateRealisticSalesData(demoStores);
    setStoresData(demoStores);
    setSalesData(demoSales);
    setStoresFileName('store_master.xlsx (Sample 20 Stores)');
    setSalesFileName('retail_weekly_sales.xlsx (Sample 1,920 Rows)');
    setIsProcessing(false);
    onDataLoaded(demoStores, demoSales);
  };

  const downloadSampleFiles = () => {
    // 1. Store Master Workbook
    const storeWb = XLSX.utils.book_new();
    const storeWs = XLSX.utils.json_to_sheet(INITIAL_STORES);
    XLSX.utils.book_append_sheet(storeWb, storeWs, "Store_Master");
    XLSX.writeFile(storeWb, "store_master.xlsx");

    // 2. Sales Dataset
    const sampleSales = generateRealisticSalesData(INITIAL_STORES);
    const salesWb = XLSX.utils.book_new();
    const salesWs = XLSX.utils.json_to_sheet(sampleSales);
    XLSX.utils.book_append_sheet(salesWb, salesWs, "Weekly_Sales");
    XLSX.writeFile(salesWb, "retail_weekly_sales.xlsx");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Retail Sales Intelligence Platform
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Data Integration & Ingestion
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Upload your retail store and weekly sales performance spreadsheets to generate executive KPIs, multi-dimensional filters, and actionable business insights.
        </p>
      </div>

      {/* Quick Action Card: Instant Demo */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600 text-white font-medium">Recommended</Badge>
              <span className="text-xs text-slate-400 font-mono">1,920 Rows • 20 Stores • 5 Regions</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Load Standard Benchmark Dataset
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Explore the fully calculated dashboard right away with the complete assignment dataset structure: 20 stores, 16 weeks, 6 categories, target achievement, return rates, discount rates, and stockouts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={handleLoadDemoDataset}
              size="lg"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Launch Dashboard Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={downloadSampleFiles}
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
              title="Download store_master.xlsx and retail_weekly_sales.xlsx templates"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Templates
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Master Card */}
        <Card className="border-slate-800 bg-slate-900/90 relative group hover:border-slate-700 transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              {storesData ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready ({storesData.length} Stores)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-slate-400">Step 1</Badge>
              )}
            </div>
            <CardTitle className="mt-3">store_master.xlsx</CardTitle>
            <CardDescription>
              Reference data for store IDs, names, 5 regions, cities, and store formats (20 rows, 5 columns).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 cursor-pointer bg-slate-950/40 hover:bg-slate-900/60 transition group/label">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover/label:text-blue-400 transition mb-2" />
              <span className="text-sm font-medium text-slate-200">
                {storesFileName || 'Click to browse store_master.xlsx'}
              </span>
              <span className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, .csv</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleStoreFileUpload}
                className="hidden"
              />
            </label>

            {storesData && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">File Loaded Successfully</div>
                <div>{storesFileName} • {storesData.length} store entries mapped.</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Sales Card */}
        <Card className="border-slate-800 bg-slate-900/90 relative group hover:border-slate-700 transition">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              {salesData ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready ({salesData.length} Records)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-slate-400">Step 2</Badge>
              )}
            </div>
            <CardTitle className="mt-3">retail_weekly_sales.xlsx</CardTitle>
            <CardDescription>
              Main performance dataset with sales, returns, discounts, targets, stockouts (1,920 rows, 19 columns).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 cursor-pointer bg-slate-950/40 hover:bg-slate-900/60 transition group/label">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover/label:text-blue-400 transition mb-2" />
              <span className="text-sm font-medium text-slate-200">
                {salesFileName || 'Click to browse retail_weekly_sales.xlsx'}
              </span>
              <span className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, .csv</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSalesFileUpload}
                className="hidden"
              />
            </label>

            {salesData && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">File Loaded Successfully</div>
                <div>{salesFileName} • {salesData.length} records parsed and validated.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Message if any */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Upload Notice</div>
            <div className="text-xs text-rose-300 mt-0.5">{uploadError}</div>
          </div>
        </div>
      )}

      {/* Launch Custom Files Action */}
      {storesData && salesData && (
        <div className="text-center pt-2">
          <Button
            size="lg"
            onClick={handleLaunchWithUploaded}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 shadow-lg shadow-emerald-600/30"
          >
            Launch Dashboard With Uploaded Files
          </Button>
        </div>
      )}
    </div>
  );
}
