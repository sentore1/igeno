'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

interface PaymentSettings {
  id: string;
  payment_method: string;
  is_active: boolean;
  settings: {
    provider?: string;
    qr_code_url?: string;
    phone_number?: string;
    momo_code?: string;
    account_name?: string;
    instructions?: string;
    bank_name?: string;
    bank_account_name?: string;
    bank_account_number?: string;
  };
}

export default function PaymentSettingsPage() {
  const [momoSettings, setMomoSettings] = useState<PaymentSettings | null>(null);
  const [bankSettings, setBankSettings] = useState<PaymentSettings | null>(null);
  const [bankForm, setBankForm] = useState({ bank_name: '', bank_account_name: '', bank_account_number: '', is_active: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [message, setMessage] = useState('');
  const [bankMessage, setBankMessage] = useState('');
  const [previewQRCode, setPreviewQRCode] = useState<string>('');
  const [generatingPreview, setGeneratingPreview] = useState(false);
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

    loadSettings();
  };

  const loadSettings = async () => {
    const { data: momoData } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('payment_method', 'momo')
      .single();

    if (momoData) {
      setMomoSettings(momoData);
      const recipient = momoData.settings.momo_code || momoData.settings.phone_number;
      if (recipient) {
        generatePreviewQR(recipient, momoData.settings.account_name, momoData.settings.provider);
      }
    }

    const { data: bankData } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('payment_method', 'bank')
      .single();

    if (bankData) {
      setBankSettings(bankData);
      setBankForm({
        bank_name: bankData.settings.bank_name || '',
        bank_account_name: bankData.settings.bank_account_name || '',
        bank_account_number: bankData.settings.bank_account_number || '',
        is_active: bankData.is_active || false,
      });
    }
    setLoading(false);
  };

  const generatePreviewQR = async (phoneNumber: string, accountName?: string, provider?: string) => {
    if (!phoneNumber) return;
    
    setGeneratingPreview(true);
    try {
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber, // This is the recipient - could be phone or MoMo code
          amount: 10000, // Sample amount for preview
          currency: 'RWF',
          reference: 'PREVIEW',
          merchantName: accountName || 'Your Business',
          provider: provider?.toLowerCase().includes('mtn') ? 'mtn' :
                   provider?.toLowerCase().includes('airtel') ? 'airtel' :
                   provider?.toLowerCase().includes('orange') ? 'orange' : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPreviewQRCode(data.qrCode);
      }
    } catch (error) {
      console.error('Error generating preview QR:', error);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handlePhoneNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    const momoCode = (document.querySelector('input[name="momo_code"]') as HTMLInputElement)?.value;
    const accountName = (document.querySelector('input[name="account_name"]') as HTMLInputElement)?.value;
    const provider = (document.querySelector('input[name="provider"]') as HTMLInputElement)?.value;
    // Priority: MoMo code first, then phone number
    const recipient = momoCode || phoneNumber;
    if (recipient) {
      generatePreviewQR(recipient, accountName, provider);
    }
  };

  const handleMomoCodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const momoCode = e.target.value;
    const phoneNumber = (document.querySelector('input[name="phone_number"]') as HTMLInputElement)?.value;
    const accountName = (document.querySelector('input[name="account_name"]') as HTMLInputElement)?.value;
    const provider = (document.querySelector('input[name="provider"]') as HTMLInputElement)?.value;
    // Priority: MoMo code first, then phone number
    const recipient = momoCode || phoneNumber;
    if (recipient) {
      generatePreviewQR(recipient, accountName, provider);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const settings = {
        provider: formData.get('provider') as string,
        phone_number: formData.get('phone_number') as string,
        momo_code: formData.get('momo_code') as string,
        account_name: formData.get('account_name') as string,
        instructions: formData.get('instructions') as string,
      };

      const is_active = formData.get('is_active') === 'on';

      const { error } = await supabase.from('payment_settings')
        .upsert({ ...(momoSettings ? { id: momoSettings.id } : {}), payment_method: 'momo', settings, is_active }, { onConflict: 'payment_method' });
      if (error) throw error;

      setMessage('Settings saved successfully! QR codes will be generated dynamically for each booking.');
      await loadSettings();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
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
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <Link
          href="/dashboard/admin"
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Back to Admin Dashboard
        </Link>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl"></div>
          <div>
            <h2 className="text-2xl font-bold">Mobile Money (MoMo)</h2>
            <p className="text-gray-600">Configure MoMo payment settings for service bookings</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-md">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={momoSettings?.is_active}
              className="w-5 h-5 text-blue-600"
            />
            <label className="text-sm font-medium">
              Enable Mobile Money payments (Users will see MoMo as payment option)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Name
            </label>
            <input
              type="text"
              name="provider"
              defaultValue={momoSettings?.settings.provider}
              placeholder="e.g., MTN Mobile Money, Orange Money, Airtel Money"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-122 border-yellow-300 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue mb-2"> Choose Payment Method</h4>
            <p className="text-sm text-yellow-800 mb-3">
              Select <strong>ONE</strong> payment method below. If both are provided, <strong>MoMo Code will be used</strong> for the QR code.
            </p>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 bg-white p-3 rounded border border-yellow-300">
                <strong className="text-yellow-900">Option 1: Phone Number</strong>
                <p className="text-xs text-gray-600 mt-1">Use for phone-based payments</p>
              </div>
              <div className="flex-1 bg-white p-3 rounded border-2 border-green-500">
                <strong className="text-green-900">Option 2: MoMo Code ⭐</strong>
                <p className="text-xs text-gray-600 mt-1">Preferred for QR codes</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Option 1)
            </label>
            <input
              type="tel"
              name="phone_number"
              defaultValue={momoSettings?.settings.phone_number}
              placeholder="+250 788 123 456"
              onBlur={handlePhoneNumberBlur}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              USSD: *182*8*1*250788123456*amount#
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              MoMo Code (Option 2)
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">RECOMMENDED</span>
            </label>
            <input
              type="text"
              name="momo_code"
              defaultValue={momoSettings?.settings.momo_code}
              placeholder="e.g., 123456"
              onBlur={handleMomoCodeBlur}
              className="w-full px-4 py-2 border-2 border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              USSD: *182*8*1*123456*amount# | <strong className="text-green-700">QR code will use this if provided</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name
            </label>
            <input
              type="text"
              name="account_name"
              defaultValue={momoSettings?.settings.account_name}
              placeholder="Business or person name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl"></div>
              <div>
                <h4 className="font-bold text-green-800 mb-2">QR Code + USSD Payment</h4>
                <p className="text-sm text-green-700 mb-2">
                  <strong>Best of both worlds!</strong> System generates QR codes AND shows USSD codes for maximum convenience.
                </p>
                <ul className="text-xs text-green-600 space-y-1">
                  <li>QR Code: Scan to auto-dial payment code (tel:*182*8*1*...)</li>
                  <li> USSD Code: Manual dial option displayed clearly</li>
                  <li> Dynamic amounts generated per booking</li>
                  <li> Standard MTN Mobile Money format</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Instructions
            </label>
            <textarea
              name="instructions"
              defaultValue={momoSettings?.settings.instructions}
              rows={4}
              placeholder="Instructions for customers on how to complete payment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>


          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <Link
              href="/dashboard/admin"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Bank Transfer Settings */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Bank Transfer</h2>
          <p className="text-gray-600">Configure bank transfer payment details for service bookings</p>
        </div>

        {bankMessage && (
          <div className={`mb-4 p-4 rounded-md ${bankMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {bankMessage}
          </div>
        )}

        <form onSubmit={async (e) => {
          e.preventDefault();
          setSavingBank(true);
          setBankMessage('');
          try {
            const settings = {
              bank_name: bankForm.bank_name,
              bank_account_name: bankForm.bank_account_name,
              bank_account_number: bankForm.bank_account_number,
            };
            const is_active = bankForm.is_active;
            const { error } = await supabase.from('payment_settings')
              .upsert({ ...(bankSettings ? { id: bankSettings.id } : {}), payment_method: 'bank', settings, is_active }, { onConflict: 'payment_method' });
            if (error) throw error;
            setBankMessage('Bank settings saved successfully!');
            await loadSettings();
          } catch (error: any) {
            setBankMessage(`Error: ${error.message}`);
          } finally {
            setSavingBank(false);
          }
        }} className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-md">
            <input
              type="checkbox"
              name="bank_is_active"
              checked={bankForm.is_active}
              onChange={(e) => setBankForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-5 h-5 text-blue-600"
            />
            <label className="text-sm font-medium">
              Enable Bank Transfer payments
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
            <input
              type="text"
              name="bank_name"
              value={bankForm.bank_name}
              onChange={(e) => setBankForm(f => ({ ...f, bank_name: e.target.value }))}
              placeholder="e.g., Bank of Kigali, Equity Bank"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
            <input
              type="text"
              name="bank_account_name"
              value={bankForm.bank_account_name}
              onChange={(e) => setBankForm(f => ({ ...f, bank_account_name: e.target.value }))}
              placeholder="Account holder name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
            <input
              type="text"
              name="bank_account_number"
              value={bankForm.bank_account_number}
              onChange={(e) => setBankForm(f => ({ ...f, bank_account_number: e.target.value }))}
              placeholder="e.g., 00012345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={savingBank}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingBank ? 'Saving...' : 'Save Bank Settings'}
          </button>
        </form>
      </div>

      {/* Preview Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">Preview (What customers will see)</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="max-w-md mx-auto">
            <h4 className="text-xl font-bold mb-2">Pay with {momoSettings?.settings.provider || 'Mobile Money'}</h4>
            <p className="text-gray-600 mb-4">Amount to pay: <span className="text-2xl font-bold text-blue-600">RWF 1,000</span></p>
            
            {/* QR Code Display */}
            {generatingPreview ? (
              <div className="bg-white p-8 rounded-lg mb-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Generating QR code...</p>
              </div>
            ) : previewQRCode ? (
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4 text-center">
                <p className="font-semibold mb-3 text-sm"> Scan QR Code to Auto-Dial</p>
                <img src={previewQRCode} alt="QR Code Preview" className="w-48 h-48 mx-auto object-contain border-2 border-gray-200 rounded" />
                {momoSettings?.settings.momo_code ? (
                  <p className="text-xs text-gray-500 mt-2">
                    QR encodes: tel:*182*8*1*{momoSettings.settings.momo_code}*1000#
                  </p>
                ) : momoSettings?.settings.phone_number ? (
                  <p className="text-xs text-gray-500 mt-2">
                    QR encodes: tel:*182*8*1*{momoSettings.settings.phone_number.replace(/[\s\-\(\)\+]/g, '')}*1000#
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">QR encodes: tel:*182*8*1*recipient*1000#</p>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 p-8 rounded-lg mb-4 text-center">
                <p className="text-gray-500">Enter phone number or MoMo code to see QR preview</p>
              </div>
            )}

            {/* USSD Code Display */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-6 mb-4">
              <p className="font-bold text-orange-800 mb-3 text-center"> Or dial this code:</p>
              
              {momoSettings?.settings.momo_code ? (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1 text-center">Using MoMo Code:</p>
                  <div className="bg-gray-50 border-2 border-green-500 rounded-lg p-3">
                    <p className="text-xl font-mono font-bold text-center text-green-700">
                      *182*8*1*{momoSettings.settings.momo_code}*1000#
                    </p>
                  </div>
                </div>
              ) : momoSettings?.settings.phone_number ? (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1 text-center">Using Phone Number:</p>
                  <div className="bg-gray-50 border-2 border-green-500 rounded-lg p-3">
                    <p className="text-xl font-mono font-bold text-center text-green-700 break-all">
                      *182*8*1*{momoSettings.settings.phone_number.replace(/[\s\-\(\)\+]/g, '')}*1000#
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-lg font-mono">*182*8*1*XXXXX*1000#</p>
                  <p className="text-xs text-gray-500 mt-2">Configure phone number or MoMo code above</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <p className="text-sm text-gray-600 mb-2">Payment details:</p>
              {momoSettings?.settings.momo_code ? (
                <>
                  <p className="font-bold text-lg">MoMo Code: {momoSettings.settings.momo_code}</p>
                  <p className="text-sm text-gray-600">{momoSettings?.settings.account_name || 'Account Name'}</p>
                </>
              ) : momoSettings?.settings.phone_number ? (
                <>
                  <p className="font-bold text-lg">{momoSettings.settings.phone_number}</p>
                  <p className="text-sm text-gray-600">{momoSettings?.settings.account_name || 'Account Name'}</p>
                </>
              ) : (
                <p className="text-gray-400">Configure payment method above</p>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {momoSettings?.settings.instructions || 'Scan QR code or dial the USSD code to send payment'}
            </p>
            <button type="button" className="w-full px-4 py-2 bg-blue-600 text-white rounded-md mb-2">
              Upload Payment Proof
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
