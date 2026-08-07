'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-client';

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  price_per_hour: number | null;
}

const iconMap: { [key: string]: string } = {
  'medical': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'heart': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  'user-group': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  'home': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'sparkles': 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  'chat': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  'truck': 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  'briefcase': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  'clock': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'star': 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  'lightning': 'M13 10V3L4 14h7v7l9-11h-7z',
  'sun': 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
};

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

type BookingStep = 'details' | 'payment' | 'confirmation';

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>('details');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [serviceType, setServiceType] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('1'); // Default to 1 day
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [momoSettings, setMomoSettings] = useState<PaymentSettings | null>(null);
  const [bankSettings, setBankSettings] = useState<PaymentSettings | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [dynamicQRCode, setDynamicQRCode] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [bookingDurationMode, setBookingDurationMode] = useState<'hourly' | 'daily' | 'both'>('daily');
  const [durationType, setDurationType] = useState<'hours' | 'days'>('days');
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAuth();
    loadServices();
    loadPaymentSettings();
    loadBookingDurationMode();
  }, []);

  useEffect(() => {
    calculateAmount();
  }, [selectedService, duration, durationType]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      setError('Profile not found. Please contact support.');
      return;
    }

    const clientRoles = ['client', 'caregiver', 'nurse'];
    if (!clientRoles.includes(profile.role)) {
      setError(`Booking services are only available for clients, caregivers, and nurses. Your role is: ${profile.role}`);
      return;
    }

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (client) {
      setClientId(client.id);
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: session.user.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: '',
        })
        .select()
        .single();

      if (clientError) {
        setError(`Failed to create client profile: ${clientError.message}`);
        return;
      }

      if (newClient) setClientId(newClient.id);
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (data) {
      setServices(data);
    }
  };

  const loadPaymentSettings = async () => {
    const { data: momoData } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('payment_method', 'momo')
      .eq('is_active', true)
      .single();
    if (momoData) setMomoSettings(momoData);

    const { data: bankData } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('payment_method', 'bank')
      .eq('is_active', true)
      .single();
    if (bankData) setBankSettings(bankData);
  };

  const loadBookingDurationMode = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'booking_duration_mode')
        .single();

      if (data && !error) {
        const mode = data.setting_value as 'hourly' | 'daily' | 'both';
        setBookingDurationMode(mode);
        
        // Set default duration type based on mode
        if (mode === 'daily') {
          setDurationType('days');
          setDuration('1'); // Default to 1 day
        } else {
          setDurationType('hours');
          setDuration('60'); // Default to 1 hour
        }
      }
    } catch (err) {
      console.error('Error loading booking duration mode:', err);
      // Default to daily if error
      setBookingDurationMode('daily');
      setDurationType('days');
      setDuration('1');
    }
  };

  const calculateAmount = () => {
    if (selectedService && selectedService.price_per_hour) {
      let hours: number;
      
      if (durationType === 'days') {
        // Convert days to hours (assuming 8-hour workday)
        hours = parseInt(duration) * 8;
      } else {
        // Already in minutes, convert to hours
        hours = parseInt(duration) / 60;
      }
      
      setCalculatedAmount(selectedService.price_per_hour * hours);
    } else {
      setCalculatedAmount(0);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setServiceType(serviceId);
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service || null);
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPaymentProof = async (): Promise<string | null> => {
    if (!paymentProof || !clientId) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const fileExt = paymentProof.name.split('.').pop();
    const fileName = `${session.user.id}/payment-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, paymentProof);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momoSettings) {
      // If no payment settings, skip to direct booking
      handleFinalSubmit();
    } else {
      // Generate dynamic QR code before showing payment page
      await generateDynamicQRCode();
      setStep('payment');
    }
  };

  const generateDynamicQRCode = async () => {
    if (!momoSettings || !calculatedAmount) return;

    setGeneratingQR(true);
    try {
      // Priority: Use MoMo code first, then phone number
      const recipient = momoSettings.settings.momo_code || momoSettings.settings.phone_number;
      
      if (!recipient) {
        console.error('No phone number or MoMo code configured');
        setGeneratingQR(false);
        return;
      }

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: recipient,
          amount: calculatedAmount,
          currency: 'RWF',
          reference: `BOOK-${Date.now()}`,
          merchantName: momoSettings.settings.account_name || 'iGenoGate Care',
          provider: momoSettings.settings.provider?.toLowerCase().includes('mtn') ? 'mtn' :
                   momoSettings.settings.provider?.toLowerCase().includes('airtel') ? 'airtel' :
                   momoSettings.settings.provider?.toLowerCase().includes('orange') ? 'orange' : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDynamicQRCode(data.qrCode);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentProof) {
      setError('Please upload payment proof');
      return;
    }

    await handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setError('');
    setLoading(true);

    if (!clientId) {
      setError('Please complete your profile first');
      setLoading(false);
      return;
    }

    try {
      // Upload payment proof if exists
      const paymentProofUrl = await uploadPaymentProof();

      // Create booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: clientId,
          service_type: selectedService?.name || serviceType,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          duration: durationType === 'days' ? parseInt(duration) * 480 : parseInt(duration), // Convert days to minutes (8 hours = 480 min)
          notes,
          status: 'pending',
          payment_status: paymentProofUrl ? 'pending_verification' : 'pending',
          payment_method: momoSettings ? 'momo' : null,
          payment_amount: calculatedAmount > 0 ? calculatedAmount : null,
          payment_proof_url: paymentProofUrl,
        });

      if (bookingError) throw bookingError;

      setSuccess(true);
      setStep('confirmation');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (success && step === 'confirmation') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-3xl font-bold text-green-800 mb-4">Booking Confirmed!</h2>
          <p className="text-gray-700 mb-2">Your service booking has been created successfully.</p>
          {momoSettings && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Payment Verification Pending</strong>
                <br />
                Your payment proof has been submitted. An admin will verify it shortly.
                <br />
                You'll be notified once verified.
              </p>
            </div>
          )}
          <p className="text-gray-600 mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className={`flex items-center ${step === 'details' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-blue-600' : 'bg-green-600'} text-white font-bold`}>
              {step === 'details' ? '1' : '✓'}
            </div>
            <span className="ml-2 font-semibold">Service Details</span>
          </div>
          
          {momoSettings && (
            <>
              <div className="w-16 h-1 mx-4 bg-gray-300"></div>
              <div className={`flex items-center ${step === 'payment' ? 'text-blue-600' : step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-blue-600' : step === 'confirmation' ? 'bg-green-600' : 'bg-gray-300'} text-white font-bold`}>
                  {step === 'confirmation' ? '✓' : '2'}
                </div>
                <span className="ml-2 font-semibold">Payment</span>
              </div>
            </>
          )}
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-center">Book a Care Service</h1>

      {error && (
        <div className="mb-6 rounded-lg p-4" style={{ backgroundColor: '#1992A3' }}>
          <p className="text-white font-semibold">{error}</p>
        </div>
      )}

      {/* Step 1: Service Details */}
      {step === 'details' && (
        <form onSubmit={handleDetailsSubmit} className="bg-white shadow-md rounded-lg p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceChange(service.id)}
                    className={`rounded-lg p-4 cursor-pointer transition shadow-md ${
                      serviceType === service.id
                        ? 'bg-blue-50 shadow-lg'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-2xl border-2" style={{ backgroundColor: '#694EAB', borderColor: '#4e3a80' }}>
                        <svg className={`w-6 h-6 text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.icon && iconMap[service.icon] ? iconMap[service.icon] : iconMap['medical']} />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.description}</p>
                        {service.price_per_hour && (
                          <p className="text-blue-600 font-bold mt-2">RWF {service.price_per_hour}/hour</p>
                        )}
                      </div>
                      {serviceType === service.id && (
                        <div className="text-blue-600 text-xl">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="scheduledDate"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  id="scheduledTime"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              
              {/* Show duration type selector if mode is 'both' */}
              {bookingDurationMode === 'both' && (
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDurationType('hours');
                      setDuration('60'); // Reset to 1 hour
                    }}
                    className={`flex-1 px-4 py-2 rounded-md font-semibold transition ${
                      durationType === 'hours'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Per Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDurationType('days');
                      setDuration('1'); // Reset to 1 day
                    }}
                    className={`flex-1 px-4 py-2 rounded-md font-semibold transition ${
                      durationType === 'days'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Per Day
                  </button>
                </div>
              )}

              {/* Duration selector based on type */}
              {(durationType === 'hours' || bookingDurationMode === 'hourly') && (
                <select
                  id="duration"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                  <option value="300">5 hours</option>
                  <option value="360">6 hours</option>
                  <option value="420">7 hours</option>
                  <option value="480">8 hours</option>
                  <option value="540">9 hours</option>
                  <option value="600">10 hours</option>
                  <option value="660">11 hours</option>
                  <option value="720">12 hours</option>
                </select>
              )}

              {(durationType === 'days' || bookingDurationMode === 'daily') && (
                <select
                  id="duration"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="4">4 days</option>
                  <option value="5">5 days</option>
                  <option value="6">6 days</option>
                  <option value="7">1 week</option>
                  <option value="14">2 weeks</option>
                  <option value="21">3 weeks</option>
                  <option value="30">1 month</option>
                </select>
              )}
              
              <p className="text-xs text-gray-600 mt-1">
                {durationType === 'days' || bookingDurationMode === 'daily'
                  ? 'Select the number of days you need the service'
                  : 'Select the number of hours you need the service'}
              </p>
            </div>

            {calculatedAmount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Estimated Cost:</span>
                  <span className="text-2xl font-bold text-blue-600">RWF {calculatedAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any special requirements or information we should know..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading || !serviceType}
              className="flex-1 px-6 py-3 text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1A92A3' }}
            >
              {momoSettings ? 'Proceed to Payment' : 'Book Service'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Payment */}
      {step === 'payment' && momoSettings && (
        <form onSubmit={handlePaymentSubmit} className="bg-white shadow-md rounded-lg p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Pay with {momoSettings.settings.provider}</h2>
              <p className="text-gray-600">Amount to pay: <span className="text-2xl font-bold text-blue-600">RWF {calculatedAmount.toFixed(2)}</span></p>
            </div>

            {/* QR Code + USSD Combined Display */}
            {generatingQR ? (
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating your payment QR code...</p>
              </div>
            ) : dynamicQRCode ? (
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
                <p className="font-semibold mb-4 text-lg"> Scan QR Code to Auto-Dial</p>
                <img 
                  src={dynamicQRCode} 
                  alt="Payment QR Code" 
                  className="w-64 h-64 mx-auto object-contain border-4 border-gray-100 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-3">
                  Scanning opens your dialer with payment code ready
                </p>
              </div>
            ) : null}

            {/* USSD Payment Code Display */}
            <div className="rounded-lg p-6" style={{ backgroundColor: '#694EAB' }}>
              <p className="font-bold text-white mb-4 text-center text-lg">
                {dynamicQRCode ? ' Or dial this code manually:' : '📱 Dial this code from your phone:'}
              </p>
              
              {momoSettings.settings.momo_code ? (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 mb-2 text-center">Using MoMo Code:</p>
                  <div className="bg-gray-50 border-2 border-green-500 rounded-lg p-4">
                    <p className="text-2xl font-mono font-bold text-center text-green-700">
                      *182*8*1*{momoSettings.settings.momo_code}*{Math.round(calculatedAmount)}#
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Press the dial/call button after entering</p>
                </div>
              ) : momoSettings.settings.phone_number ? (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 mb-2 text-center">Using Phone Number:</p>
                  <div className="bg-gray-50 border-2 border-green-500 rounded-lg p-4">
                    <p className="text-2xl font-mono font-bold text-center text-green-700 break-all">
                      *182*8*1*{momoSettings.settings.phone_number.replace(/[\s\-\(\)\+]/g, '')}*{Math.round(calculatedAmount)}#
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Press the dial/call button after entering</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-500">Payment details not configured. Please contact support.</p>
                </div>
              )}
            </div>

            {/* Bank Transfer Section */}
            {bankSettings && (
              <div className="rounded-lg p-6" style={{ backgroundColor: '#009292' }}>
                <p className="text-sm font-semibold text-white mb-3">Or pay via Bank Transfer:</p>
                <p className="text-xl font-bold text-white mb-1">{bankSettings.settings.bank_name}</p>
                <p className="text-white opacity-90">{bankSettings.settings.bank_account_name}</p>
                <p className="text-white opacity-90">Account No: <span className="font-mono font-semibold">{bankSettings.settings.bank_account_number}</span></p>
                <p className="text-white opacity-75 mt-2 text-sm">Amount: RWF {calculatedAmount.toFixed(2)}</p>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">Payment Details:</p>
              {momoSettings.settings.momo_code ? (
                <>
                  <p className="text-xl font-bold mb-1">MoMo Code: {momoSettings.settings.momo_code}</p>
                  <p className="text-gray-700">{momoSettings.settings.account_name}</p>
                </>
              ) : momoSettings.settings.phone_number ? (
                <>
                  <p className="text-xl font-bold mb-1">{momoSettings.settings.phone_number}</p>
                  <p className="text-gray-700">{momoSettings.settings.account_name}</p>
                </>
              ) : null}
              <p className="text-sm text-gray-500 mt-2">Amount: RWF {calculatedAmount.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Payment Proof *
              </label>
              {paymentProofPreview && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <img src={paymentProofPreview} alt="Payment Proof" className="max-w-full h-48 object-contain mx-auto" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                required
                onChange={handlePaymentProofChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Upload a screenshot of your payment confirmation or transaction receipt
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !paymentProof}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
