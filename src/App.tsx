import React, { useState } from 'react';
import { Store, WeeklySalesRecord, INITIAL_STORES, generateRealisticSalesData } from '@/lib/data-generator';
import { DataUploader } from '@/components/DataUploader';
import { DashboardView } from '@/components/DashboardView';

export default function App() {
  // Pre-load with initial synthetic benchmark so user immediately sees a functional app on startup
  const [stores, setStores] = useState<Store[]>(() => INITIAL_STORES);
  const [sales, setSales] = useState<WeeklySalesRecord[]>(() => generateRealisticSalesData(INITIAL_STORES));
  const [viewMode, setViewMode] = useState<'dashboard' | 'uploader'>('dashboard');

  const handleDataLoaded = (newStores: Store[], newSales: WeeklySalesRecord[]) => {
    setStores(newStores);
    setSales(newSales);
    setViewMode('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {viewMode === 'dashboard' && stores.length > 0 && sales.length > 0 ? (
        <DashboardView
          stores={stores}
          sales={sales}
          onResetData={() => setViewMode('uploader')}
        />
      ) : (
        <div className="min-h-screen flex flex-col justify-center">
          <DataUploader onDataLoaded={handleDataLoaded} />
        </div>
      )}
    </div>
  );
}
