import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InvoiceBuilder from './components/InvoiceBuilder';
import EInvoiceModule from './components/EInvoiceModule';
import TransactionLedger from './components/TransactionLedger';
import Settings from './components/Settings';

function AppContent() {
  const { isAuthenticated } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'invoices': return <InvoiceBuilder />;
      case 'einvoice': return <EInvoiceModule />;
      case 'transactions': return <TransactionLedger />;
      case 'settings': return <Settings />;
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
