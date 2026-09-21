import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { BookOpen, Plus, Filter, ArrowUpRight, ArrowDownRight, Calendar, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function TransactionLedger() {
  const { activeCompany, transactions, addTransaction } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const companyTransactions = useMemo(() => {
    return transactions
      .filter(t => t.company_id === activeCompany?.id)
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterCategory === 'all' || t.category === filterCategory)
      .filter(t => !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.reference.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(t => !dateFrom || t.date >= dateFrom)
      .filter(t => !dateTo || t.date <= dateTo)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, activeCompany, filterType, filterCategory, searchTerm, dateFrom, dateTo]);

  const categories = useMemo(() => {
    const cats = new Set(transactions.filter(t => t.company_id === activeCompany?.id).map(t => t.category));
    return Array.from(cats);
  }, [transactions, activeCompany]);

  const totals = useMemo(() => {
    const income = companyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.credit, 0);
    const expenses = companyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.debit, 0);
    return { income, expenses, net: income - expenses };
  }, [companyTransactions]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  if (showForm) {
    return <TransactionForm 
      company={activeCompany!} 
      onSave={(txn) => { addTransaction(txn); setShowForm(false); }} 
      onCancel={() => setShowForm(false)} 
    />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Transaction Ledger
          </h1>
          <p className="text-sm text-gray-500">{activeCompany?.name} • {companyTransactions.length} entries</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/25 active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Income</p>
          <p className="text-sm sm:text-lg font-bold text-green-600">{formatCurrency(totals.income)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Expenses</p>
          <p className="text-sm sm:text-lg font-bold text-red-600">{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Net</p>
          <p className={`text-sm sm:text-lg font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totals.net)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Search transactions..." 
            className="flex-1 text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
          </select>
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none" />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {companyTransactions.map(txn => (
          <div key={txn.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              txn.type === 'income' ? 'bg-green-100' : txn.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {txn.type === 'income' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{txn.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{txn.date}</span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{txn.category}</span>
                <span className="text-xs text-gray-400">A/c: {txn.account_code}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {txn.debit > 0 ? (
                <p className="text-sm font-semibold text-red-600">-{formatCurrency(txn.debit)}</p>
              ) : (
                <p className="text-sm font-semibold text-green-600">+{formatCurrency(txn.credit)}</p>
              )}
              {txn.reference && <p className="text-xs text-gray-400">{txn.reference}</p>}
            </div>
          </div>
        ))}
        {companyTransactions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionForm({ company, onSave, onCancel }: { company: any; onSave: (txn: Transaction) => void; onCancel: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState('');

  const accountTemplates: Record<string, { code: string; name: string }[]> = {
    income: [
      { code: '4000', name: 'Sales Revenue' },
      { code: '4100', name: 'Service Revenue' },
      { code: '4200', name: 'Other Income' },
    ],
    expense: [
      { code: '5000', name: 'Cost of Sales' },
      { code: '5100', name: 'Rental Expense' },
      { code: '5200', name: 'Utilities' },
      { code: '5300', name: 'Salaries & Wages' },
      { code: '5400', name: 'Marketing' },
      { code: '5500', name: 'Office Supplies' },
      { code: '5600', name: 'Professional Fees' },
    ],
  };

  const handleSave = () => {
    if (!description || !amount) return;
    const txn: Transaction = {
      id: uuidv4(),
      company_id: company.id,
      date,
      description,
      category,
      account_code: accountCode,
      debit: type === 'expense' ? amount : 0,
      credit: type === 'income' ? amount : 0,
      reference,
      type,
      created_by: 'user-001',
      created_at: new Date().toISOString().split('T')[0],
    };
    onSave(txn);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">New Transaction</h1>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
        {/* Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Expense
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount (RM)</label>
            <input type="number" value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="input-field" placeholder="0.00" min="0" step="0.01" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="Transaction description" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Account</label>
            <select value={accountCode} onChange={e => { setAccountCode(e.target.value); const acc = accountTemplates[type].find(a => a.code === e.target.value); if (acc) setCategory(acc.name); }} className="input-field">
              <option value="">Select account...</option>
              {accountTemplates[type].map(acc => (
                <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Reference</label>
            <input value={reference} onChange={e => setReference(e.target.value)} className="input-field" placeholder="Receipt/Invoice no." />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors active:scale-95">
            Save Transaction
          </button>
          <button onClick={onCancel} className="px-4 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
