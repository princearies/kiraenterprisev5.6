import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen } from 'lucide-react';

export default function Ledger() {
  const { api } = useApp();
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/ledger')
      .then(data => setLedger(data))
      .catch(err => console.error('Failed to load ledger:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Ledger</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Account</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
              <th className="px-4 py-3 text-left">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ledger.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{item.date}</td>
                <td className="px-4 py-3 font-medium">{item.description}</td>
                <td className="px-4 py-3 text-gray-600">{item.account_code}</td>
                <td className="px-4 py-3 text-right font-mono">{item.debit ? 'RM ' + item.debit.toFixed(2) : '-'}</td>
                <td className="px-4 py-3 text-right font-mono">{item.credit ? 'RM ' + item.credit.toFixed(2) : '-'}</td>
                <td className="px-4 py-3 text-right font-mono">{item.balance ? 'RM ' + item.balance.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ledger.length === 0 && (
        <p className="text-gray-500 text-center py-8">No ledger entries found.</p>
      )}
    </div>
  );
}
