import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { BookOpen, ChevronDown, ChevronRight, Calendar, Building2 } from 'lucide-react';

interface JournalLine {
  account_code: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  company_id: string | null;
  date: string;
  description: string;
  reference: string;
  lines: JournalLine[];
  total_debit: number;
  total_credit: number;
  auto_posted: number;
  invoice_id: string | null;
  created_by: string;
  created_at: string;
}

export default function Journals() {
  const { activeCompany } = useApp();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJournals();
  }, [activeCompany]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = activeCompany ? { company_id: activeCompany.id } : undefined;
      const data = await api.getJournals(filters);
      setJournals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch journals');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading journal entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium mb-2">Error loading journals</p>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchJournals}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-600" />
            Journal Entries
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCompany?.name || 'All Companies'} • {journals.length} entries
          </p>
        </div>
        <button
          onClick={fetchJournals}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Entries</p>
          <p className="text-2xl font-bold text-gray-800">{journals.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Debits</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(journals.reduce((sum, j) => sum + j.total_debit, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Credits</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(journals.reduce((sum, j) => sum + j.total_credit, 0))}
          </p>
        </div>
      </div>

      {/* Journal Entries Table */}
      {journals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">No journal entries found</p>
          <p className="text-gray-400 text-sm">
            {activeCompany
              ? 'No journal entries for this company yet'
              : 'No journal entries available'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Entry ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Company
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {journals.map((journal) => {
                  const isExpanded = expandedRows.has(journal.id);
                  
                  return (
                    <React.Fragment key={journal.id}>
                      {/* Main Row */}
                      <tr
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleRow(journal.id)}
                      >
                        <td className="px-4 py-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-600">
                            {journal.id.substring(0, 8)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(journal.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600">
                            {journal.company_id ? journal.company_id.substring(0, 8) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                          {journal.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                          {formatCurrency(journal.total_debit)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                          {formatCurrency(journal.total_credit)}
                        </td>
                      </tr>

                      {/* Expanded Lines */}
                      {isExpanded && journal.lines && journal.lines.length > 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="ml-8 space-y-2">
                              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                Account Lines ({journal.lines.length})
                              </p>
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Account Code
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Account Name
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Description
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                        Debit
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                        Credit
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {journal.lines.map((line, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-xs font-mono text-gray-700">
                                          {line.account_code}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-700">
                                          {line.account_name}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                                          {line.description}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-right font-medium text-green-600">
                                          {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-right font-medium text-blue-600">
                                          {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                    <tr>
                                      <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-gray-700 text-right">
                                        Totals:
                                      </td>
                                      <td className="px-3 py-2 text-xs text-right font-bold text-green-700">
                                        {formatCurrency(
                                          journal.lines.reduce((sum, l) => sum + l.debit, 0)
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-xs text-right font-bold text-blue-700">
                                        {formatCurrency(
                                          journal.lines.reduce((sum, l) => sum + l.credit, 0)
                                        )}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Expanded but no lines */}
                      {isExpanded && (!journal.lines || journal.lines.length === 0) && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500">No line items for this entry</p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
