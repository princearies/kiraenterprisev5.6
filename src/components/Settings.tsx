import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Building2, Users, Receipt, Shield, Save, Check } from 'lucide-react';

export default function Settings() {
  const { activeCompany } = useApp();
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);

  const [companySettings, setCompanySettings] = useState({
    name: activeCompany?.name || '',
    registration_no: activeCompany?.registration_no || '',
    sst_no: activeCompany?.sst_no || '',
    tin: activeCompany?.tin || '',
    address: activeCompany?.address || '',
    city: activeCompany?.city || '',
    state: activeCompany?.state || '',
    postcode: activeCompany?.postcode || '',
    phone: activeCompany?.phone || '',
    email: activeCompany?.email || '',
    financial_year_end: activeCompany?.financial_year_end || '',
    tax_rate: activeCompany?.tax_rate || 24,
    sst_rate: activeCompany?.sst_rate || 6,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'tax', label: 'Tax & SST', icon: Receipt },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-gray-600" />
          Settings
        </h1>
        <p className="text-sm text-gray-500">Configure {activeCompany?.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-primary-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Company Settings */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Company Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Company Name</label>
              <input value={companySettings.name} onChange={e => setCompanySettings({...companySettings, name: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Registration No.</label>
              <input value={companySettings.registration_no} onChange={e => setCompanySettings({...companySettings, registration_no: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">SST No.</label>
              <input value={companySettings.sst_no} onChange={e => setCompanySettings({...companySettings, sst_no: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">TIN (Tax Identification No.)</label>
              <input value={companySettings.tin} onChange={e => setCompanySettings({...companySettings, tin: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone</label>
              <input value={companySettings.phone} onChange={e => setCompanySettings({...companySettings, phone: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input value={companySettings.email} onChange={e => setCompanySettings({...companySettings, email: e.target.value})} className="input-field" type="email" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Address</label>
              <input value={companySettings.address} onChange={e => setCompanySettings({...companySettings, address: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">City</label>
              <input value={companySettings.city} onChange={e => setCompanySettings({...companySettings, city: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">State</label>
              <select value={companySettings.state} onChange={e => setCompanySettings({...companySettings, state: e.target.value})} className="input-field">
                <option value="Sabah">Sabah</option>
                <option value="Sarawak">Sarawak</option>
                <option value="Selangor">Selangor</option>
                <option value="Kuala Lumpur">Kuala Lumpur</option>
                <option value="Johor">Johor</option>
                <option value="Penang">Penang</option>
                <option value="Perak">Perak</option>
                <option value="Kelantan">Kelantan</option>
                <option value="Terengganu">Terengganu</option>
                <option value="Pahang">Pahang</option>
                <option value="Negeri Sembilan">Negeri Sembilan</option>
                <option value="Melaka">Melaka</option>
                <option value="Kedah">Kedah</option>
                <option value="Perlis">Perlis</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Postcode</label>
              <input value={companySettings.postcode} onChange={e => setCompanySettings({...companySettings, postcode: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Financial Year End</label>
              <input type="date" value={companySettings.financial_year_end} onChange={e => setCompanySettings({...companySettings, financial_year_end: e.target.value})} className="input-field" />
            </div>
          </div>
        </div>
      )}

      {/* Tax Settings */}
      {activeTab === 'tax' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Tax & SST Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Corporate Tax Rate (%)</label>
              <input type="number" value={companySettings.tax_rate} onChange={e => setCompanySettings({...companySettings, tax_rate: parseFloat(e.target.value) || 0})} className="input-field" min="0" max="100" />
              <p className="text-xs text-gray-400 mt-1">Malaysia: 24% (standard), 17% (SME first RM600k)</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">SST Rate (%)</label>
              <input type="number" value={companySettings.sst_rate} onChange={e => setCompanySettings({...companySettings, sst_rate: parseFloat(e.target.value) || 0})} className="input-field" min="0" max="100" />
              <p className="text-xs text-gray-400 mt-1">Service Tax: 6% or 8% | Sales Tax: 5% or 10%</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">SST Rules</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-xs text-gray-700">Taxable Services</span>
                <span className="text-xs font-medium text-blue-700">6% - 8%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-xs text-gray-700">Taxable Goods</span>
                <span className="text-xs font-medium text-blue-700">5% - 10%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-xs text-gray-700">Exempt Supplies</span>
                <span className="text-xs font-medium text-green-700">0%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-xs text-gray-700">Out of Scope</span>
                <span className="text-xs font-medium text-gray-500">N/A</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> SST rates are configurable per company. Ensure rates match your SSM registration.
              Consult your tax agent for correct classification.
            </p>
          </div>
        </div>
      )}

      {/* Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Users & Role-Based Access Control</h3>
          <div className="space-y-3">
            {[
              { name: 'Ahmad Razak', role: 'accountant_owner', email: 'ahmad@kiraenterprise.my', status: 'active' },
              { name: 'Siti Aminah', role: 'client_owner', email: 'siti@sabahmaju.my', status: 'active' },
              { name: 'Raj Kumar', role: 'client_staff', email: 'raj@sabahmaju.my', status: 'active' },
              { name: 'Lim Wei Ming', role: 'viewer', email: 'lim@audit-firm.my', status: 'invited' },
            ].map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">{user.role.replace(/_/g, ' ')}</span>
                  <p className={`text-xs mt-1 ${user.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                    {user.status === 'active' ? '● Active' : '○ Invited'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Roles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg"><strong>platform_admin</strong> - System-wide manager</div>
              <div className="p-2 bg-white rounded-lg"><strong>accountant_owner</strong> - Manages multiple clients</div>
              <div className="p-2 bg-white rounded-lg"><strong>accountant_staff</strong> - Staff under accounting firm</div>
              <div className="p-2 bg-white rounded-lg"><strong>client_owner</strong> - Business owner</div>
              <div className="p-2 bg-white rounded-lg"><strong>client_staff</strong> - Employee access</div>
              <div className="p-2 bg-white rounded-lg"><strong>viewer</strong> - Read-only auditor</div>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Security Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Add extra security to your account</p>
              </div>
              <button className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg">Enabled</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">Session Timeout</p>
                <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
              </div>
              <span className="text-sm text-gray-600">30 minutes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">Data Encryption</p>
                <p className="text-xs text-gray-500">All data encrypted at rest and in transit</p>
              </div>
              <span className="text-xs text-green-600 font-medium">AES-256 ✓</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">API Access</p>
                <p className="text-xs text-gray-500">Cloudflare Workers API key management</p>
              </div>
              <button className="px-3 py-1.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg">Manage</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button 
        onClick={handleSave}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors active:scale-95"
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
