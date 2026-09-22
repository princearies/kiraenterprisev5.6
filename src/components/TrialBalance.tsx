import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

export default function TrialBalance() {
  const { api } = useApp();
  const [tb, setTb] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/trial-balance')
      .then(data => setTb(data))
      .catch(err => console.error('Failed to load trial balance:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const assets = tb.filter(a => a.type === 'asset');
  const liabilities = tb.filter(a => a.type === 'liability');
  const equity = tb.filter(a => a.type === 'equity');
  const revenue = tb.filter(a => a.type === 'revenue');
  const expenses = tb.filter(a => a.type === 'expense');

  const totalDebit = tb.reduce((sum, a) => sum + (a.debit || 0), 0);
  const totalCredit = tb.reduce((sum, a) => sum + (a.credit || 0), 0);

  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Trial Balance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border-green-200 rounded-xl p-4">
          <h3 className="font-semibold text-green-800 mb-2">Total Debit</h3>
          <p className="text-2xl font-bold text-green-800">RM {totalDebit.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 mb-2">Total Credit</h3>
          <p className="text-2xl font-bold text-red-800">RM {totalCredit.toFixed(2)}</p>
        </div>
      </div>
      {totalDebit !== totalCredit && (
        <div className="bg-amber-50 border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-amber-800 font-medium">⚠️ Not balanced! Difference: RM {(totalDebit - totalCredit).toFixed(2)}</p>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Account</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tb.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-600">{item.code}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-center text-xs uppercase">{item.type}</td>
                <td className="px-4 py-3 text-right font-mono">{item.debit ? 'RM ' + item.debit.toFixed(2) : '-'}</td>
                <td className="px-4 py-3 text-right font-mono">{item.credit ? 'RM ' + item.credit.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
