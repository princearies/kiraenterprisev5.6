import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, FileText, Receipt, BookOpen, Settings, LogOut, 
  Menu, X, ChevronDown, Building2, Users, Shield, Menu as MenuIcon
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, companies, activeCompany, setActiveCompany, logout, sidebarOpen, toggleSidebar } = useApp();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'einvoice', label: 'e-Invoice', icon: Receipt },
    { id: 'transactions', label: 'Transactions', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const roleLabels: Record<string, string> = {
    platform_admin: 'Platform Admin',
    accountant_owner: 'Accountant (Owner)',
    accountant_staff: 'Accountant (Staff)',
    client_owner: 'Business Owner',
    client_staff: 'Staff',
    viewer: 'Viewer',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-sm">KiraEnterprise</h1>
                <p className="text-xs text-gray-400">v5.6</p>
              </div>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Company Switcher */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <button
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="w-full flex items-center gap-2 p-3 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">{activeCompany?.name.charAt(0)}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{activeCompany?.name}</p>
                <p className="text-xs text-gray-500">{activeCompany?.registration_no}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCompanyDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => { setActiveCompany(company); setShowCompanyDropdown(false); }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${activeCompany?.id === company.id ? 'bg-primary-50' : ''}`}
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">{company.name.charAt(0)}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">{company.name}</p>
                      <p className="text-xs text-gray-500">{company.city}, {company.state}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); if (sidebarOpen) toggleSidebar(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user ? roleLabels[user.role] : ''}
              </p>
            </div>
            <button onClick={logout} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6 no-print">
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <MenuIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              {activeCompany?.state}
            </span>
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center lg:hidden">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
