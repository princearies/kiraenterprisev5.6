import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, InvoiceLineItem } from '../types';
import { 
  Plus, Trash2, Printer, MessageCircle, Save, Eye, 
  ChevronDown, ChevronUp, Building2, Phone, Mail, MapPin
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function InvoiceBuilder() {
  const { activeCompany, invoices, addInvoice, updateInvoice, deleteInvoice } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const companyInvoices = invoices
    .filter(i => i.company_id === activeCompany?.id)
    .filter(i => filterStatus === 'all' || i.status === filterStatus);

  if (previewInvoice) {
    return <InvoicePreview invoice={previewInvoice} onBack={() => setPreviewInvoice(null)} />;
  }

  if (showForm) {
    return <InvoiceForm 
      company={activeCompany!} 
      onSave={(inv) => { addInvoice(inv); setShowForm(false); }} 
      onCancel={() => setShowForm(false)} 
    />;
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-sm text-gray-500">{companyInvoices.length} invoices for {activeCompany?.name}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'draft', 'sent', 'paid', 'overdue'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterStatus === status 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {companyInvoices.map(invoice => (
          <div key={invoice.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{invoice.invoice_no}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[invoice.status]}`}>
                    {invoice.status}
                  </span>
                  {invoice.is_einvoice && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">e-Invoice</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                <p className="text-xs text-gray-400 mt-1">{invoice.date} • Due: {invoice.due_date}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">{formatCurrency(invoice.grand_total)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <button onClick={() => setPreviewInvoice(invoice)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View">
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => updateInvoice(invoice.id, { status: 'paid' })} className="p-1.5 hover:bg-green-50 rounded-lg" title="Mark Paid">
                    <span className="text-xs text-green-600 font-medium">✓</span>
                  </button>
                  <button onClick={() => deleteInvoice(invoice.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {companyInvoices.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-sm">No invoices found</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-primary-600 text-sm font-medium hover:underline">
              Create your first invoice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Invoice Form Component
function InvoiceForm({ company, onSave, onCancel }: { company: any; onSave: (inv: Invoice) => void; onCancel: () => void }) {
  const [customerName, setCustomerName] = useState('');
  const [customerTin, setCustomerTin] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isEinvoice, setIsEinvoice] = useState(true);
  const [consolidated, setConsolidated] = useState(false);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: uuidv4(), description: '', quantity: 1, unit_price: 0, tax_rate: company.sst_rate, amount: 0, tax_amount: 0, total: 0 }
  ]);

  const addLineItem = () => {
    setLineItems([...lineItems, { 
      id: uuidv4(), description: '', quantity: 1, unit_price: 0, 
      tax_rate: company.sst_rate, amount: 0, tax_amount: 0, total: 0 
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(items => items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.amount = updated.quantity * updated.unit_price;
      updated.tax_amount = updated.amount * (updated.tax_rate / 100);
      updated.total = updated.amount + updated.tax_amount;
      return updated;
    }));
  };

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = lineItems.reduce((sum, item) => sum + item.tax_amount, 0);
    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal };
  }, [lineItems]);

  const handleSave = () => {
    if (!customerName || lineItems.some(item => !item.description)) return;
    
    const invoice: Invoice = {
      id: uuidv4(),
      company_id: company.id,
      invoice_no: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
      customer_name: customerName,
      customer_tin: customerTin,
      customer_address: customerAddress,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      date,
      due_date: dueDate || date,
      line_items: lineItems,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      discount: 0,
      grand_total: totals.grandTotal,
      status: 'draft',
      notes,
      is_einvoice: isEinvoice,
      einvoice_category: '01001',
      consolidated,
      created_by: 'user-001',
      created_at: new Date().toISOString().split('T')[0],
    };
    onSave(invoice);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Create Invoice</h1>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-6">
        {/* Customer Details */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Customer Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name *" className="input-field" />
            <input value={customerTin} onChange={e => setCustomerTin(e.target.value)} placeholder="Customer TIN" className="input-field" />
            <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" className="input-field" type="email" />
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone" className="input-field" />
            <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Address" className="input-field sm:col-span-2" rows={2} />
          </div>
        </div>

        {/* Invoice Details */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isEinvoice} onChange={e => setIsEinvoice(e.target.checked)} className="w-4 h-4 rounded text-primary-600" />
              <span className="text-sm text-gray-700">e-Invoice (LHDN)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={consolidated} onChange={e => setConsolidated(e.target.checked)} className="w-4 h-4 rounded text-primary-600" />
              <span className="text-sm text-gray-700">Consolidated</span>
            </label>
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 text-sm">Line Items</h3>
            <button onClick={addLineItem} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>
          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Item #{idx + 1}</span>
                  {lineItems.length > 1 && (
                    <button onClick={() => removeLineItem(item.id)} className="p-1 hover:bg-red-100 rounded">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
                <input 
                  value={item.description} 
                  onChange={e => updateLineItem(item.id, 'description', e.target.value)} 
                  placeholder="Description" 
                  className="input-field text-sm" 
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Qty</label>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                      className="input-field text-sm" 
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Price (RM)</label>
                    <input 
                      type="number" 
                      value={item.unit_price} 
                      onChange={e => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} 
                      className="input-field text-sm" 
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Tax %</label>
                    <input 
                      type="number" 
                      value={item.tax_rate} 
                      onChange={e => updateLineItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)} 
                      className="input-field text-sm" 
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end text-sm">
                  <span className="text-gray-600">Amount: <strong className="text-gray-800">{formatCurrency(item.total)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-primary-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (SST {company.sst_rate}%)</span>
            <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
          </div>
          <div className="border-t border-primary-200 pt-2 flex justify-between">
            <span className="font-semibold text-gray-800">Grand Total</span>
            <span className="text-lg font-bold text-primary-700">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className="input-field" rows={2} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors active:scale-95">
            <Save className="w-4 h-4" /> Save Invoice
          </button>
          <button onClick={onCancel} className="px-4 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Invoice Preview with Print & WhatsApp
function InvoicePreview({ invoice, onBack }: { invoice: Invoice; onBack: () => void }) {
  const { activeCompany } = useApp();
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    const items = invoice.line_items.map(i => `• ${i.description} x${i.quantity} = RM${i.total.toFixed(2)}`).join('\n');
    const msg = `*INVOICE ${invoice.invoice_no}*\n\nFrom: ${activeCompany?.name}\nTo: ${invoice.customer_name}\nDate: ${invoice.date}\nDue: ${invoice.due_date}\n\n*Items:*\n${items}\n\nSubtotal: RM${invoice.subtotal.toFixed(2)}\nTax: RM${invoice.tax_amount.toFixed(2)}\n*Total: RM${invoice.grand_total.toFixed(2)}*\n\nThank you!`;
    const phone = invoice.customer_phone?.replace(/[^0-9]/g, '') || '';
    window.open(`https://wa.me/${phone ? '6' + phone : ''}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="animate-fade-in">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4 no-print">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        <div className="flex gap-2">
          <button onClick={handleWhatsApp} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Printer className="w-4 h-4" /> Print/PDF
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{activeCompany?.name}</h2>
                <p className="text-xs text-gray-500">{activeCompany?.registration_no}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5 mt-2">
              <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {activeCompany?.address}, {activeCompany?.postcode} {activeCompany?.city}, {activeCompany?.state}</p>
              <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {activeCompany?.phone}</p>
              <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {activeCompany?.email}</p>
              <p>TIN: {activeCompany?.tin} | SST: {activeCompany?.sst_no}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-primary-700">INVOICE</h1>
            <p className="text-sm font-medium text-gray-700 mt-1">{invoice.invoice_no}</p>
            <p className="text-xs text-gray-500 mt-2">Date: {invoice.date}</p>
            <p className="text-xs text-gray-500">Due: {invoice.due_date}</p>
            {invoice.is_einvoice && (
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                LHDN e-Invoice
              </span>
            )}
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-gray-800">{invoice.customer_name}</p>
            {invoice.customer_tin && <p className="text-xs text-gray-500">TIN: {invoice.customer_tin}</p>}
            <p className="text-sm text-gray-600 mt-1">{invoice.customer_address}</p>
            {invoice.customer_email && <p className="text-xs text-gray-500 mt-1">{invoice.customer_email}</p>}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Tax</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map(item => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-800">{item.description}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-right text-gray-600">{formatCurrency(item.tax_amount)}</td>
                  <td className="py-3 text-right font-medium text-gray-800">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-800">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-red-600">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-800">{formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div className="border-t-2 border-gray-800 pt-2 flex justify-between">
              <span className="font-bold text-gray-800">Total</span>
              <span className="text-xl font-bold text-primary-700">{formatCurrency(invoice.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">Notes: {invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Thank you for your business!</p>
          <p className="text-xs text-gray-300 mt-1">Generated by KiraEnterprise v5.6</p>
        </div>
      </div>
    </div>
  );
}
