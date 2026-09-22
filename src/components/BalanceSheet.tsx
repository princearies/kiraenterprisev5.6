import React, { useEffect, useState } from 'react';
import { Table } from 'lucide-react';

export default function BalanceSheet() {
  const { api } = useApp();
  const [bs, setBs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/balance-sheet')
      .then(data => setBs(data))
      .catch(err => console.error('Failed to load balance sheet:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const assets = bs.filter(a => a.type === 'asset');
  const liabilities = bs.filter(a => a.type === 'liability');
  const equity = bs.filter(a => a.type === 'equity');

  const totalAssets = assets.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalEquity = equity.reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Balance Sheet</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Table className="w-5 h-5" /> Assets
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="space-y-2">
            {assets.map((item, i) => (
              <div key={i} className="flex justify-between py-1">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-mono">RM {(item.amount || 0).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-blue-200 pt-2 mt-2 font-semibold">
              <span className="text-blue-800">Total Assets</span>
              <span className="font-mono ml-4">RM {totalAssets.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Table className="w-5 h-5" /> Liabilities
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="space-y-2">
            {liabilities.map((item, i) => (
              <div key={i} className="flex justify-between py-1">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-mono">RM {(item.amount || 0).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-red-200 pt-2 mt-2 font-semibold">
              <span className="text-red-800">Total Liabilities</span>
              <span className="font-mono ml-4">RM {totalLiabilities.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Table className="w-5 h-5" /> Equity
        </h3>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="space-y-2">
            {equity.map((item, i) => (
              <div key={i} className="flex justify-between py-1">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-mono">RM {(item.amount || 0).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-purple-200 pt-2 mt-2 font-semibold">
              <span className="text-purple-800">Total Equity</span>
              <span className="font-mono ml-4">RM {totalEquity.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-xl">
        <div className="flex justify-between font-semibold">
          <span>Total Liabilities & Equity</span>
          <span className="font-mono">RM {(totalLiabilities + totalEquity).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold mt-2">
          <span>Total Assets</span>
          <span className="font-mono">RM {totalAssets.toFixed(2)}</span>
        </div>
        {totalAssets !== (totalLiabilities + totalEquity) && (
          <div className="flex justify-between mt-2 text-red-600">
            <span>⚠️ Not Balanced</span>
            <span className="font-mono">RM {(totalAssets - totalLiabilities - totalEquity).toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
