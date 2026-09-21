import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Building2, Shield, Wifi, WifiOff } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  // Check API connection on mount
  React.useEffect(() => {
    api.healthCheck()
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
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

          {/* API Status */}
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
            apiStatus === 'connected' ? 'bg-green-50 border border-green-200' :
            apiStatus === 'offline' ? 'bg-amber-50 border border-amber-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            {apiStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : apiStatus === 'offline' ? (
              <WifiOff className="w-4 h-4 text-amber-600" />
            ) : (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            )}
            <span className={`text-xs font-medium ${
              apiStatus === 'connected' ? 'text-green-700' :
              apiStatus === 'offline' ? 'text-amber-700' :
              'text-gray-600'
            }`}>
              {apiStatus === 'connected' ? 'Connected to Cloud API (mykira DB)' :
               apiStatus === 'offline' ? 'API Offline - Using Demo Mode' :
               'Checking API connection...'}
            </span>
          </div>

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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
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
              {apiStatus === 'connected' 
                ? '🔗 Connected to: kiraenterprisev5-6.mykira.workers.dev' 
                : '⚠️ Using local demo data - API not available'}
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
