'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

interface CaregiverProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string | null;
  rating: number;
}

interface BookingWithClient {
  id: string;
  client_id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  status: string;
  notes: string | null;
  created_at: string;
  clients: {
    full_name: string;
    email: string;
    phone: string;
    address: string | null;
  } | null;
}

export default function CaregiverDashboard() {
  const [caregiver, setCaregiver] = useState<CaregiverProfile | null>(null);
  const [todayBookings, setTodayBookings] = useState<BookingWithClient[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithClient[]>([]);
  const [pastBookings, setPastBookings] = useState<BookingWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithClient | null>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    todayCount: 0,
    upcomingCount: 0,
  });
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkCaregiverAuth();
  }, []);

  const checkCaregiverAuth = async () => {
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

    if (profile?.role !== 'caregiver') {
      router.push('/dashboard');
      return;
    }

    loadCaregiverData(session.user.id);
  };

  const loadCaregiverData = async (userId: string) => {
    // Get caregiver profile
    const { data: caregiverProfile } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!caregiverProfile) {
      alert('Caregiver profile not found. Please contact admin.');
      setLoading(false);
      return;
    }

    setCaregiver(caregiverProfile);

    // Get all bookings for this caregiver
    const { data: allBookings } = await supabase
      .from('bookings')
      .select(`
        *,
        clients (
          full_name,
          email,
          phone,
          address
        )
      `)
      .eq('caregiver_id', caregiverProfile.id)
      .order('scheduled_date', { ascending: true });

    if (allBookings) {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Filter bookings
      const todayList = allBookings.filter(b => b.scheduled_date === today);
      const upcomingList = allBookings.filter(b => 
        b.scheduled_date > today && 
        ['pending', 'confirmed'].includes(b.status)
      );
      const pastList = allBookings.filter(b => 
        b.scheduled_date < today || 
        b.status === 'completed'
      ).slice(0, 10);

      setTodayBookings(todayList as any);
      setUpcomingBookings(upcomingList as any);
      setPastBookings(pastList as any);

      // Calculate stats
      const completed = allBookings.filter(b => b.status === 'completed').length;
      setStats({
        totalBookings: allBookings.length,
        completedBookings: completed,
        todayCount: todayList.length,
        upcomingCount: upcomingList.length,
      });
    }

    setLoading(false);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      alert('Failed to update status: ' + error.message);
      return;
    }

    // Reload data
    if (caregiver) {
      loadCaregiverData(caregiver.user_id);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusActions = (booking: BookingWithClient) => {
    const today = new Date().toISOString().split('T')[0];
    const isToday = booking.scheduled_date === today;

    if (booking.status === 'confirmed' && isToday) {
      return (
        <button
          onClick={() => updateBookingStatus(booking.id, 'in-progress')}
          className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700"
        >
          Start Service
        </button>
      );
    }

    if (booking.status === 'in-progress') {
      return (
        <button
          onClick={() => updateBookingStatus(booking.id, 'completed')}
          className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700"
        >
          Complete
        </button>
      );
    }

    return null;
  };

  const getModalActions = (booking: BookingWithClient) => {
    const today = new Date().toISOString().split('T')[0];
    const isToday = booking.scheduled_date === today;
    const isFuture = booking.scheduled_date > today;
    
    return (
      <div className="flex flex-wrap gap-3">
        {/* Primary Status Actions */}
        {booking.status === 'confirmed' && isToday && (
          <button
            onClick={() => {
              updateBookingStatus(booking.id, 'in-progress');
              setSelectedBooking(null);
            }}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Service
          </button>
        )}

        {booking.status === 'in-progress' && (
          <button
            onClick={() => {
              updateBookingStatus(booking.id, 'completed');
              setSelectedBooking(null);
            }}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark Complete
          </button>
        )}

        {/* Contact Client */}
        {booking.clients?.phone && (
          <a
            href={`tel:${booking.clients.phone}`}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Client
          </a>
        )}

        {/* Email Client */}
        {booking.clients?.email && (
          <a
            href={`mailto:${booking.clients.email}`}
            className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Client
          </a>
        )}

        {/* Cancel Booking (only for future bookings that are not completed) */}
        {(booking.status === 'pending' || booking.status === 'confirmed') && isFuture && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to cancel this booking?')) {
                updateBookingStatus(booking.id, 'cancelled');
                setSelectedBooking(null);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel Booking
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!caregiver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Caregiver profile not found</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {caregiver.full_name}!</h1>
            <p className="text-gray-600 mt-2">Caregiver Dashboard</p>
            <div className="mt-3">
              <Link 
                href="/dashboard/caregiver/timesheets"
                className="inline-flex items-center px-4 py-2 text-white rounded-md font-semibold transition-colors" style={{ backgroundColor: '#1481BA' }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Work Log & Timesheets
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right mr-4">
              <p className="text-sm text-gray-600">Your Rating</p>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">{caregiver.rating.toFixed(1)}</span>
              </div>
            </div>
            {caregiver.specialization && (
              <span className="px-4 py-2 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                {caregiver.specialization}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">{/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: '#4170A7' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#4170A7' }}>Today's Bookings</p>
              <p className="text-3xl font-bold" style={{ color: '#4170A7' }}>{stats.todayCount}</p>
            </div>
            <div className="p-2 rounded-2xl shadow-md" style={{ backgroundColor: '#4170A7' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: '#694EAB' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#694EAB' }}>Upcoming</p>
              <p className="text-3xl font-bold" style={{ color: '#694EAB' }}>{stats.upcomingCount}</p>
            </div>
            <div className="p-2 rounded-2xl shadow-md" style={{ backgroundColor: '#694EAB' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: '#1992A3' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#1992A3' }}>Total Bookings</p>
              <p className="text-3xl font-bold" style={{ color: '#1992A3' }}>{stats.totalBookings}</p>
            </div>
            <div className="p-2 rounded-2xl shadow-md" style={{ backgroundColor: '#1992A3' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: '#6E6E6F' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#6E6E6F' }}>Completed</p>
              <p className="text-3xl font-bold" style={{ color: '#6E6E6F' }}>{stats.completedBookings}</p>
            </div>
            <div className="p-2 rounded-2xl shadow-md" style={{ backgroundColor: '#6E6E6F' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      {todayBookings.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Today's Schedule
          </h2>
          <div className="space-y-4">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg p-4 shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl font-bold text-blue-600 mr-3">{booking.scheduled_time}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{booking.service_type}</h3>
                    <p className="text-sm text-gray-600">Duration: {booking.duration} minutes</p>
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-semibold text-gray-900">Client: {booking.clients?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{booking.clients?.email || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{booking.clients?.phone || 'N/A'}</p>
                      {booking.clients?.address && (
                        <p className="text-sm text-gray-600 mt-1">📍 {booking.clients.address}</p>
                      )}
                    </div>
                    {booking.notes && (
                      <div className="mt-2 p-3 bg-yellow-50 rounded-md border-l-4 border-yellow-400">
                        <p className="text-sm font-semibold text-gray-900">Special Requirements:</p>
                        <p className="text-sm text-gray-700">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {getStatusActions(booking)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upcoming Bookings
          </h2>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="border-l-4 border-purple-500 pl-4 py-3 hover:bg-gray-50 rounded-r cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{booking.service_type}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
                      </p>
                      <p className="text-sm text-gray-600">{booking.clients?.full_name || 'Unknown Client'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No upcoming bookings</p>
          )}
        </div>

        {/* Past Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent History
          </h2>
          {pastBookings.length > 0 ? (
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="border-l-4 border-gray-300 pl-4 py-3 hover:bg-gray-50 rounded-r cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{booking.service_type}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
                      </p>
                      <p className="text-sm text-gray-600">{booking.clients?.full_name || 'Unknown Client'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No past bookings</p>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedBooking(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  Booking ID: {selectedBooking.id.slice(0, 8)}...
                </span>
              </div>

              {/* Service Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Service Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Service Type</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.service_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedBooking.scheduled_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.scheduled_time}</p>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Client Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.clients?.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.clients?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.clients?.phone || 'N/A'}</p>
                  </div>
                  {selectedBooking.clients?.address && (
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-gray-900 flex items-start">
                        <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {selectedBooking.clients.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Notes */}
              {selectedBooking.notes && (
                <div className="rounded-lg p-4 border-l-4" style={{ backgroundColor: '#4170A7', borderColor: '#2d5077' }}>
                  <h3 className="text-lg font-semibold text-white mb-2">Special Requirements</h3>
                  <p className="text-white">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Booking Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Timeline</h3>
                <p className="text-sm text-gray-600">
                  Created on: {new Date(selectedBooking.created_at).toLocaleString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Available Actions</h3>
                </div>
                {getModalActions(selectedBooking)}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
