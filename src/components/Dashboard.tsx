import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, FileText, TrendingUp, AlertCircle, Clock, 
  ArrowUpRight, ArrowDownRight, Calendar, Building2
} from 'lucide-react';

export default function Dashboard() {
  const { activeCompany, invoices, transactions, getDashboardStats } = useApp();
  const stats = getDashboardStats();

  const companyInvoices = invoices.filter(i => i.company_id === activeCompany?.id);
  const companyTransactions = transactions.filter(t => t.company_id === activeCompany?.id);

  // Show message if no data from API
  if (invoices.length === 0 && !activeCompany) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome to KiraEnterprise v5.6</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No Company Data Found</h2>
          <p className="text-sm text-gray-500 mb-4">
            Connect to the API to load your company data from the mykira database.
          </p>
          <p className="text-xs text-gray-400">
            API: https://kiraenterprisev5-6.mykira.workers.dev/
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCompany?.name} • Financial Year: {activeCompany?.financial_year_end}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={DollarSign}
          trend="+12.5%"
          trendUp={true}
          color="bg-green-500"
        />
        <StatCard
          title="Invoices"
          value={stats.total_invoices.toString()}
          icon={FileText}
          trend={`${stats.pending_invoices} pending`}
          trendUp={false}
          color="bg-blue-500"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding_amount)}
          icon={AlertCircle}
          trend="Needs attention"
          trendUp={false}
          color="bg-amber-500"
        />
        <StatCard
          title="Paid This Month"
          value={formatCurrency(stats.paid_this_month)}
          icon={TrendingUp}
          trend="+8.2%"
          trendUp={true}
          color="bg-purple-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction icon={FileText} label="New Invoice" color="bg-primary-600" />
        <QuickAction icon={DollarSign} label="Record Payment" color="bg-green-600" />
        <QuickAction icon={TrendingUp} label="Add Expense" color="bg-amber-600" />
        <QuickAction icon={Clock} label="View Reports" color="bg-purple-600" />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Recent Invoices
          </h3>
          <div className="space-y-3">
            {companyInvoices.slice(0, 5).map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{invoice.customer_name}</p>
                  <p className="text-xs text-gray-500">{invoice.invoice_no} • {invoice.date}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(invoice.grand_total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
            {companyInvoices.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No invoices yet</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {companyTransactions.slice(0, 5).map(txn => (
              <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${txn.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {txn.type === 'income' ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{txn.description}</p>
                    <p className="text-xs text-gray-500">{txn.date} • {txn.category}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ml-3 ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.debit || txn.credit)}
                </p>
              </div>
            ))}
            {companyTransactions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 text-xs leading-relaxed flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Compliance Notice:</strong> This application helps organize and prepare data for tax/e-Invoice purposes. 
            It does not automatically guarantee full legal compliance with LHDN/IRBM regulations. 
            Final review must be performed by a qualified accountant or registered tax agent.
          </span>
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`text-xs font-medium flex items-center gap-0.5 ${trendUp ? 'text-green-600' : 'text-amber-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : null}
          {trend}
        </span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <button className={`${color} text-white rounded-xl p-3 sm:p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity active:scale-95`}>
      <Icon className="w-5 h-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
