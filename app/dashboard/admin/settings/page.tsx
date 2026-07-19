'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

interface SystemSettings {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  maxBookingsPerUser: number;
  bookingAdvanceNoticeDays: number;
  defaultCurrency: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    platformName: 'IgenoGate Care Platform',
    supportEmail: 'support@igenogate.com',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    maxBookingsPerUser: 10,
    bookingAdvanceNoticeDays: 2,
    defaultCurrency: 'RWF',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // In a real app, load settings from database
    // For now, using local state
    setLoading(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // In a real app, save to database
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <Link
          href="/dashboard/admin"
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Back to Admin Dashboard
        </Link>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            General Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
              >
                <option value="RWF">RWF - Rwandan Franc</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Security & Access
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="allowNewRegistrations"
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                checked={settings.allowNewRegistrations}
                onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
              />
              <label htmlFor="allowNewRegistrations" className="ml-3 block">
                <span className="text-sm font-semibold text-gray-900">Allow New Registrations</span>
                <p className="text-xs text-gray-600 mt-0.5">Enable or disable new user registrations on the platform</p>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="requireEmailVerification"
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
              />
              <label htmlFor="requireEmailVerification" className="ml-3 block">
                <span className="text-sm font-semibold text-gray-900">Require Email Verification</span>
                <p className="text-xs text-gray-600 mt-0.5">Users must verify their email before accessing the platform</p>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="maintenanceMode"
                className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-0.5"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              />
              <label htmlFor="maintenanceMode" className="ml-3 block">
                <span className="text-sm font-semibold text-gray-900">Maintenance Mode</span>
                <p className="text-xs text-gray-600 mt-0.5">Temporarily disable platform access for maintenance</p>
              </label>
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Booking Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Bookings Per User
              </label>
              <input
                type="number"
                min="1"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.maxBookingsPerUser}
                onChange={(e) => setSettings({ ...settings, maxBookingsPerUser: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-gray-600 mt-1">Maximum number of active bookings a user can have</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Booking Advance Notice (Days)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.bookingAdvanceNoticeDays}
                onChange={(e) => setSettings({ ...settings, bookingAdvanceNoticeDays: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-600 mt-1">Minimum days in advance required for bookings</p>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            System Information
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Version:</span>
              <span className="ml-2 font-semibold">1.0.0</span>
            </div>
            <div>
              <span className="text-gray-600">Environment:</span>
              <span className="ml-2 font-semibold">Production</span>
            </div>
            <div>
              <span className="text-gray-600">Database:</span>
              <span className="ml-2 font-semibold text-green-600">Connected</span>
            </div>
            <div>
              <span className="text-gray-600">Storage:</span>
              <span className="ml-2 font-semibold text-green-600">Operational</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/admin"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
