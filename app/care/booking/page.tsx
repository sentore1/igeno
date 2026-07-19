'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-client';

export default function BookingPage() {
  const [serviceType, setServiceType] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Get user profile first to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      setError('Profile not found. Please contact support.');
      return;
    }

    // Only create client records for users with client-related roles
    const clientRoles = ['client', 'caregiver', 'nurse'];
    if (!clientRoles.includes(profile.role)) {
      setError(`Booking services are only available for clients, caregivers, and nurses. Your role is: ${profile.role}`);
      return;
    }

    // Get or create client profile only if user has appropriate role
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (client) {
      setClientId(client.id);
    } else {
      // Create client profile only for users with client-related roles
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!clientId) {
      setError('Please complete your profile first');
      setLoading(false);
      return;
    }

    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: clientId,
          service_type: serviceType,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          duration: parseInt(duration),
          notes,
          status: 'pending',
        });

      if (bookingError) throw bookingError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Book a Care Service</h1>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold text-green-800 mb-2">Booking Confirmed!</h2>
          <p className="text-green-700">Redirecting to dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                id="serviceType"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option value="">Select a service</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Medical Care">Medical Care</option>
                <option value="Companion Care">Companion Care</option>
                <option value="Respite Care">Respite Care</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Transportation">Transportation</option>
              </select>
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
                Duration (minutes) *
              </label>
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
                <option value="480">8 hours</option>
              </select>
            </div>

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
              disabled={loading}
              className="flex-1 px-6 py-3 text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1A92A3' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#147a88')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1A92A3')}
            >
              {loading ? 'Creating Booking...' : 'Book Service'}
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
    </div>
  );
}
