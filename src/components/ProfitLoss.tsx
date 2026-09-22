import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function ProfitLoss() {
  const { api } = useApp();
  const [pl, setPl] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/profit-loss')
      .then(data => setPl(data))
      .catch(err => console.error('Failed to load P&L:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const revenue = pl.filter(a => a.type === 'revenue');
  const expenses = pl.filter(a => a.type === 'expense');

  const totalRevenue = revenue.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, a) => sum + (a.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Profit & Loss Statement</h2>
      
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-green-800 mb-2">Revenue</h3>
        <div className="space-y-2">
          {revenue.map((item, i) => (
            <div key={i} className="flex justify-between py-1">
              <span className="text-gray-700">{item.name}</span>
              <span className="font-mono">RM {(item.amount || 0).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-green-200 pt-2 mt-2 font-semibold">
            <span className="text-green-800">Total Revenue</span>
            <span className="font-mono ml-4">RM {totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-red-800 mb-2">Expenses</h3>
        <div className="space-y-2">
          {expenses.map((item, i) => (
            <div key={i} className="flex justify-between py-1">
              <span className="text-gray-700">{item.name}</span>
              <span className="font-mono">RM {(item.amount || 0).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-red-200 pt-2 mt-2 font-semibold">
            <span className="text-red-800">Total Expenses</span>
            <span className="font-mono ml-4">RM {totalExpenses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={`rounded-xl p-4 mb-6 ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Net Profit / (Loss)</span>
          <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            RM {netProfit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
