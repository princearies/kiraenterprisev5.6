import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Database, RefreshCw, AlertTriangle, CheckCircle, Terminal, Trash2, Download } from 'lucide-react';
import api from '../services/api';

export default function AdminPanel() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'queries' | 'maintenance' | 'backup'>('queries');
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is admin
  if (user?.role !== 'platform_admin' && user?.role !== 'accountant_owner') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setQueryResult(null);

    try {
      const result = await api.executeAdminQuery(query);
      setQueryResult(result);
      setSuccess('Query executed successfully');
    } catch (err: any) {
      setError(err.message || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const runMaintenance = async (task: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.runMaintenanceTask(task);
      setSuccess(result.message || 'Maintenance task completed');
    } catch (err: any) {
      setError(err.message || 'Maintenance task failed');
    } finally {
      setLoading(false);
    }
  };

  const exportBackup = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.exportDatabaseBackup();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kiraenterprise-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Backup exported successfully');
    } catch (err: any) {
      setError(err.message || 'Backup export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary-600" />
            Admin Panel
          </h1>
          <p className="text-sm text-gray-500 mt-1">System maintenance and database management</p>
        </div>
        <div className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
          ⚠️ ADMIN ONLY
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Warning: Admin Access</p>
            <p className="text-xs text-amber-700 mt-1">
              This panel provides direct access to database operations. Incorrect queries may cause data loss or system instability.
              Always backup before running destructive operations.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('queries')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'queries'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Terminal className="w-4 h-4 inline mr-2" />
          SQL Queries
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'maintenance'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Maintenance
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'backup'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Download className="w-4 h-4 inline mr-2" />
          Backup & Export
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </p>
        </div>
      )}

      {/* SQL Queries Tab */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Execute SQL Query
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SQL Query
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT * FROM companies LIMIT 10;"
                  className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={executeQuery}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Terminal className="w-4 h-4" />
                  )}
                  Execute Query
                </button>
                <button
                  onClick={() => setQuery('')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>

              {/* Quick Queries */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Queries:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setQuery('SELECT * FROM companies LIMIT 10;')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                  >
                    List Companies
                  </button>
                  <button
                    onClick={() => setQuery('SELECT COUNT(*) as total FROM invoices;')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                  >
                    Count Invoices
                  </button>
                  <button
                    onClick={() => setQuery('SELECT * FROM users;')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                  >
                    List Users
                  </button>
                  <button
                    onClick={() => setQuery('SELECT code, name, type FROM chart_of_accounts ORDER BY code;')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                  >
                    Chart of Accounts
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Query Results */}
          {queryResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Query Results</h3>
              
              {queryResult.changes !== undefined && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Affected rows:</strong> {queryResult.changes}
                  </p>
                </div>
              )}

              {queryResult.results && queryResult.results.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(queryResult.results[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {queryResult.results.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.values(row).map((value: any, i: number) => (
                            <td key={i} className="px-4 py-2 text-xs text-gray-700">
                              {value === null ? <span className="text-gray-400">NULL</span> : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-500 mt-2">
                    {queryResult.results.length} row(s) returned
                  </p>
                </div>
              )}

              {queryResult.results && queryResult.results.length === 0 && (
                <p className="text-sm text-gray-500">No results returned</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Tasks</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Reinitialize Database Schema</p>
                  <p className="text-xs text-gray-500 mt-1">Recreate all tables and default data</p>
                </div>
                <button
                  onClick={() => runMaintenance('reinit-schema')}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  Run Task
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Reset Chart of Accounts</p>
                  <p className="text-xs text-gray-500 mt-1">Recreate default chart of accounts (100+ accounts)</p>
                </div>
                <button
                  onClick={() => runMaintenance('reset-coa')}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  Run Task
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Clear All Test Data</p>
                  <p className="text-xs text-gray-500 mt-1">Remove all invoices, journal entries, and transactions</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure? This will delete all transaction data!')) {
                      runMaintenance('clear-test-data');
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Data
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Optimize Database</p>
                  <p className="text-xs text-gray-500 mt-1">Run VACUUM and optimize indexes</p>
                </div>
                <button
                  onClick={() => runMaintenance('optimize')}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Run Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Database Backup & Export
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Full Database Export:</strong> Export all data including companies, users, invoices, 
                  journal entries, chart of accounts, and transactions as JSON.
                </p>
              </div>

              <button
                onClick={exportBackup}
                disabled={loading}
                className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Export Full Backup
              </button>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Export Options:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      const result = await api.executeAdminQuery('SELECT * FROM companies');
                      const blob = new Blob([JSON.stringify(result.results, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'companies-export.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    Export Companies
                  </button>
                  <button
                    onClick={async () => {
                      const result = await api.executeAdminQuery('SELECT * FROM invoices');
                      const blob = new Blob([JSON.stringify(result.results, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'invoices-export.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    Export Invoices
                  </button>
                  <button
                    onClick={async () => {
                      const result = await api.executeAdminQuery('SELECT * FROM chart_of_accounts');
                      const blob = new Blob([JSON.stringify(result.results, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'chart-of-accounts-export.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    Export Chart of Accounts
                  </button>
                  <button
                    onClick={async () => {
                      const result = await api.executeAdminQuery('SELECT * FROM users');
                      const blob = new Blob([JSON.stringify(result.results, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'users-export.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    Export Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
