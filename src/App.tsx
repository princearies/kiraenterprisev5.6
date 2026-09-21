import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InvoiceBuilder from './components/InvoiceBuilder';
import EInvoiceModule from './components/EInvoiceModule';
import TransactionLedger from './components/TransactionLedger';
import Journals from './components/Journals';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';

function AppContent() {
  const { isAuthenticated, loading } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Loading KiraEnterprise...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'invoices': return <InvoiceBuilder />;
      case 'einvoice': return <EInvoiceModule />;
      case 'transactions': return <TransactionLedger />;
      case 'journals': return <Journals />;
      case 'settings': return <Settings />;
      case 'admin': return <AdminPanel />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
