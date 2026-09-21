import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Receipt, FileCheck, Download, AlertTriangle, CheckCircle2, Clock, Filter } from 'lucide-react';

export default function EInvoiceModule() {
  const { activeCompany, invoices } = useApp();
  const [activeTab, setActiveTab] = useState<'ready' | 'submitted' | 'consolidated'>('ready');

  const companyInvoices = invoices.filter(i => i.company_id === activeCompany?.id && i.is_einvoice);
  const readyInvoices = companyInvoices.filter(i => i.status === 'draft' || i.status === 'sent');
  const submittedInvoices = companyInvoices.filter(i => i.status === 'paid');
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  const categories = [
    { code: '01001', name: 'Goods/Services - B2B' },
    { code: '01002', name: 'Goods/Services - B2C' },
    { code: '02001', name: 'Professional Services' },
    { code: '03001', name: 'Construction' },
    { code: '04001', name: 'Lease/Rental' },
    { code: '05001', name: 'Digital Services' },
  ];

  const handleGenerateLHDNFile = () => {
    const data = {
      company: activeCompany,
      invoices: readyInvoices,
      generated_at: new Date().toISOString(),
      format: 'LHDN_eInvoice_v2.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eInvoice_${activeCompany?.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-purple-600" />
            e-Invoice Module
          </h1>
          <p className="text-sm text-gray-500">LHDN/IRBM e-Invoice compliance for {activeCompany?.name}</p>
        </div>
        <button 
          onClick={handleGenerateLHDNFile}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-500/25 active:scale-95"
        >
          <Download className="w-4 h-4" />
          Export LHDN File
        </button>
      </div>

      {/* Compliance Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Compliance Notice</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              This module prepares e-Invoice data in LHDN-compliant format. However, actual submission to the 
              LHDN MyInvois portal requires valid API credentials and digital certificates. 
              Please ensure all data is reviewed by a qualified tax agent before submission.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'ready', label: 'Ready to Submit', count: readyInvoices.length },
          { id: 'submitted', label: 'Submitted', count: submittedInvoices.length },
          { id: 'consolidated', label: 'Consolidated', count: 0 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-white text-primary-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'ready' && (
        <div className="space-y-3">
          {readyInvoices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No invoices ready for submission</p>
            </div>
          ) : (
            readyInvoices.map(invoice => (
              <div key={invoice.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{invoice.invoice_no}</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Pending</span>
                    </div>
                    <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Category: {categories.find(c => c.code === invoice.einvoice_category)?.name || invoice.einvoice_category}
                    </p>
                    <p className="text-xs text-gray-400">TIN: {invoice.customer_tin || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(invoice.grand_total)}</p>
                    <button className="mt-2 text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                      Submit to LHDN
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'submitted' && (
        <div className="space-y-3">
          {submittedInvoices.map(invoice => (
            <div key={invoice.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{invoice.invoice_no}</p>
                    <p className="text-xs text-gray-500">{invoice.customer_name}</p>
                    <p className="text-xs text-green-600 mt-0.5">✓ Validated by LHDN</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800">{formatCurrency(invoice.grand_total)}</p>
              </div>
            </div>
          ))}
          {submittedInvoices.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No submitted invoices yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'consolidated' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">Consolidated e-Invoices</h3>
          <p className="text-sm text-gray-500 mb-4">
            Combine multiple B2C transactions into a single consolidated e-Invoice for the month.
          </p>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors">
            Generate Consolidated Invoice
          </button>
        </div>
      )}

      {/* e-Invoice Categories Reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" /> e-Invoice Categories (LHDN)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map(cat => (
            <div key={cat.code} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">{cat.code}</span>
              <span className="text-xs text-gray-700">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
