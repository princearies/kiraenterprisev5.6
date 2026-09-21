import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Building2, Shield, Wifi, WifiOff } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState('ahmad@kiraenterprise.my');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [apiMode, setApiMode] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');

    if (apiMode) {
      try {
        await api.login(email, password);
        login(email, password);
      } catch (err: any) {
        setApiError(err.message || 'API connection failed');
        // Fall back to demo mode
        setTimeout(() => login(email, password), 500);
      }
    } else {
      // Demo mode - instant login
      setTimeout(() => {
        login(email, password);
        setLoading(false);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">KiraEnterprise</h1>
          <p className="text-primary-200 mt-1 text-sm">v5.6 • Cloud Accounting & e-Invoice</p>
          <p className="text-primary-300 text-xs mt-1">Sabah, Malaysia</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Welcome Back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Forgot?</a>
            </div>

            {/* API Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                {apiMode ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-gray-400" />}
                <span className="text-xs text-gray-600">
                  {apiMode ? 'Connected to Cloud API' : 'Demo Mode (Local Data)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setApiMode(!apiMode)}
                className={`relative w-10 h-5 rounded-full transition-colors ${apiMode ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${apiMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {apiError && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                ⚠️ {apiError} — Falling back to demo mode
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {apiMode 
                ? 'API: kiraenterprisev5-6.mykira.workers.dev' 
                : 'Demo: Use any email/password to login with local data'}
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-xs leading-relaxed">
            <strong>⚠️ Disclaimer:</strong> KiraEnterprise helps organize and prepare data for tax/e-Invoice purposes. 
            It does not automatically guarantee full legal compliance with LHDN/IRBM. 
            Final review must be performed by a qualified accountant or tax agent.
          </p>
        </div>
      </div>
    </div>
  );
}
