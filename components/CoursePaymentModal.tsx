'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-client';
import Image from 'next/image';

interface CoursePaymentModalProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  onClose: () => void;
  onPaymentSubmitted: () => void;
}

export default function CoursePaymentModal({
  courseId,
  courseTitle,
  coursePrice,
  onClose,
  onPaymentSubmitted,
}: CoursePaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'bank'>('momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [momoSettings, setMomoSettings] = useState<any>(null);
  const [bankSettings, setBankSettings] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const supabase = createBrowserClient();

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  // Debug: Log when settings or QR code changes
  useEffect(() => {
    console.log('🔍 Payment Modal Debug:', {
      momoSettings,
      qrCodeUrl,
      coursePrice,
      paymentMethod,
      modalOpen: true
    });
  }, [momoSettings, qrCodeUrl]);

  const loadPaymentSettings = async () => {
    console.log('📥 Loading payment settings...');
    
    // Load MoMo settings
    const { data: momo, error: momoError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('payment_method', 'momo')
      .eq('is_active', true)
      .single();

    if (momoError) {
      console.error('❌ Error loading MoMo settings:', momoError);
    }

    if (momo) {
      console.log('✅ MoMo settings loaded:', momo);
      setMomoSettings(momo.settings);
      
      // Try MoMo code first, then fall back to phone number
      const recipient = momo.settings?.momo_code || momo.settings?.phone_number;
      
      if (recipient) {
        console.log('🔄 Generating QR code for:', recipient, 'Amount:', coursePrice);
        await generateQRCode(recipient, coursePrice);
      } else {
        console.warn('⚠️ No MoMo code or phone number in settings');
      }
    } else {
      console.warn('⚠️ No active MoMo settings found');
    }

    // Load Bank settings
    const { data: bank } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('payment_method', 'bank')
      .single();

    if (bank) {
      console.log('✅ Bank settings loaded');
      setBankSettings(bank.settings);
    }
  };

  const generateQRCode = async (phoneNumber: string, amount: number) => {
    try {
      console.log('🎯 Starting QR generation...', { phoneNumber, amount });
      
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          amount,
          currency: 'RWF',
          merchantName: 'iGenoGate Academy'
        }),
      });

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ QR API Response:', data);
        
        // API returns 'qrCode' not 'qrCodeUrl'
        if (data.qrCode) {
          console.log('🎉 QR Code received, length:', data.qrCode.length);
          setQrCodeUrl(data.qrCode);
        } else if (data.success && data.paymentData) {
          console.error('❌ QR code not in response, got:', Object.keys(data));
        } else {
          console.error('❌ Unexpected response format:', data);
        }
      } else {
        const error = await response.json();
        console.error('❌ QR generation failed with status', response.status, ':', error);
      }
    } catch (error) {
      console.error('❌ QR generation error:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFile(file);
  };

  const uploadProof = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proof-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-payments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-payments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in to continue');
        return;
      }

      // Upload proof if provided
      let proofUrl = null;
      if (proofFile) {
        setUploading(true);
        proofUrl = await uploadProof(proofFile);
        setUploading(false);

        if (!proofUrl) {
          alert('Failed to upload payment proof. Please try again.');
          return;
        }
      }

      // Check if enrollment exists
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('course_id', courseId)
        .single();

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('course_payments')
        .insert({
          user_id: session.user.id,
          course_id: courseId,
          amount: coursePrice,
          payment_method: paymentMethod,
          payment_proof_url: proofUrl,
          phone_number: paymentMethod === 'momo' ? phoneNumber : null,
          transaction_reference: transactionRef || null,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      if (existingEnrollment) {
        // Update existing enrollment
        const { error: enrollError } = await supabase
          .from('enrollments')
          .update({
            payment_status: 'pending',
            payment_id: payment.id,
            can_access: false,
          })
          .eq('user_id', session.user.id)
          .eq('course_id', courseId);

        if (enrollError) throw enrollError;
      } else {
        // Create new enrollment with pending payment
        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert({
            user_id: session.user.id,
            course_id: courseId,
            status: 'active',
            progress: 0,
            payment_status: 'pending',
            payment_id: payment.id,
            can_access: false,
          });

        if (enrollError) throw enrollError;
      }

      alert('Payment submitted successfully! Please wait for admin approval.');
      onPaymentSubmitted();
      onClose();
    } catch (error: any) {
      console.error('Payment submission error:', error);
      alert(`Failed to submit payment: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Course Payment</h2>
              <p className="text-gray-600 mt-1">{courseTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 p-4 border border-gray-200 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              Amount: {coursePrice.toLocaleString()} RWF
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method *
            </label>
            <div className="grid md:grid-cols-2 gap-3 p-6 rounded-lg bg-gradient-to-r from-[#1992A3] via-[#694EAC] to-[#009292]">
              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`p-4 border-2 rounded-lg transition ${
                  paymentMethod === 'momo'
                    ? 'border-purple-600 bg-white shadow-lg'
                    : 'border-white bg-white/80 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="font-semibold">Mobile Money</div>
                <div className="text-sm text-gray-600">MTN MoMo / Airtel Money</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`p-4 border-2 rounded-lg transition ${
                  paymentMethod === 'bank'
                    ? 'border-purple-600 bg-white shadow-lg'
                    : 'border-white bg-white/80 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="font-semibold">Bank Transfer</div>
                <div className="text-sm text-gray-600">Direct bank deposit</div>
              </button>
            </div>
          </div>

          {/* MoMo Payment Details */}
          {paymentMethod === 'momo' && momoSettings && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Mobile Money Payment</h3>
              
              {/* QR Code Section */}
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-700 mb-2 font-medium">Scan QR Code to Pay</p>
                {qrCodeUrl ? (
                  <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
                    <p className="text-xs text-gray-500 mt-2">Scan with your MoMo app</p>
                  </div>
                ) : (
                  <div className="inline-block p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="w-24 h-24 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="text-sm text-gray-500">Generating QR code...</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-semibold">Account Name:</span>{' '}
                  {momoSettings.account_name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">
                    {momoSettings.momo_code ? 'MoMo Code:' : 'Phone Number:'}
                  </span>{' '}
                  {momoSettings.momo_code || momoSettings.phone_number}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Amount:</span>{' '}
                  {coursePrice.toLocaleString()} RWF
                </p>
              </div>

              <div className="bg-white p-4 rounded border">
                <p className="font-semibold mb-2">Instructions:</p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Dial *182# (MTN) or *500# (Airtel)</li>
                  <li>Select "Send Money" or scan the QR code above</li>
                  <li>Enter code: {momoSettings.momo_code || momoSettings.phone_number}</li>
                  <li>Enter amount: {coursePrice.toLocaleString()} RWF</li>
                  <li>Enter your phone number and transaction reference below</li>
                </ol>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Your Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+250 XXX XXX XXX"
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Show message if MoMo not configured */}
          {paymentMethod === 'momo' && !momoSettings && (
            <div className="border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Mobile Money Not Configured</p>
                  <p className="text-sm text-yellow-800">
                    Mobile Money payment is not available yet. Please contact the administrator or try Bank Transfer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Payment Details */}
          {paymentMethod === 'bank' && bankSettings && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Bank Transfer Details</h3>
              <div className="space-y-2 bg-white p-4 rounded border">
                <p className="text-sm">
                  <span className="font-semibold">Bank Name:</span>{' '}
                  {bankSettings.bank_name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Account Name:</span>{' '}
                  {bankSettings.account_name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Account Number:</span>{' '}
                  {bankSettings.account_number}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Amount:</span>{' '}
                  {coursePrice.toLocaleString()} RWF
                </p>
              </div>
            </div>
          )}

          {/* Transaction Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Reference (Optional)
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g., TXN123456789"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the transaction ID/reference from your payment confirmation
            </p>
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Proof (Optional but Recommended)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a screenshot or photo of your payment confirmation
            </p>
            {proofFile && (
              <p className="text-sm text-green-600 mt-2">
                ✓ File selected: {proofFile.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting...'
                : uploading
                ? 'Uploading Proof...'
                : 'Submit Payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || uploading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
