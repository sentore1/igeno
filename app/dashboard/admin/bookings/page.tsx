'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import { Booking } from '@/lib/types';

interface Caregiver {
  id: string;
  full_name: string;
  email: string;
  specialization: string | null;
  rating: number;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCaregivers, setLoadingCaregivers] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
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

    loadBookings();
  };

  const loadBookings = async () => {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        clients (
          full_name,
          email
        ),
        caregivers (
          id,
          full_name,
          email
        )
      `);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: false });

    if (data) setBookings(data);
    setLoading(false);
  };

  const loadCaregivers = async () => {
    setLoadingCaregivers(true);
    const { data, error } = await supabase
      .from('caregivers')
      .select('id, full_name, email, specialization, rating')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error loading caregivers:', error);
      setLoadingCaregivers(false);
      return;
    }

    if (data) {
      console.log('Loaded caregivers:', data.length);
      setCaregivers(data);
    }
    setLoadingCaregivers(false);
  };

  useEffect(() => {
    if (!loading) {
      loadBookings();
      loadCaregivers();
    }
  }, [filter]);

  const assignCaregiver = async (caregiverId: string) => {
    if (!selectedBooking) return;

    const { error } = await supabase
      .from('bookings')
      .update({ 
        caregiver_id: caregiverId,
        status: 'confirmed'
      })
      .eq('id', selectedBooking.id);

    if (error) {
      alert('Failed to assign caregiver: ' + error.message);
      return;
    }

    alert('Caregiver assigned successfully!');
    setShowAssignModal(false);
    setSelectedBooking(null);
    loadBookings();
  };

  const openAssignModal = async (booking: any) => {
    setSelectedBooking(booking);
    setShowAssignModal(true);
    // Load caregivers when modal opens
    await loadCaregivers();
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

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      alert('Failed to update status');
      return;
    }

    loadBookings();
  };

  const viewPaymentProof = async (proofUrl: string) => {
    setProofLoading(true);
    setProofImageUrl('loading');

    try {
      // Extract the file path from the URL
      // URL format: .../storage/v1/object/public/payment-proofs/USER_ID/payment-TIMESTAMP.ext
      // or: .../storage/v1/object/sign/payment-proofs/...
      const bucketName = 'payment-proofs';
      const marker = `/${bucketName}/`;
      const idx = proofUrl.indexOf(marker);

      if (idx === -1) {
        // URL doesn't contain bucket path — just open directly
        setProofImageUrl(proofUrl);
        setProofLoading(false);
        return;
      }

      const filePath = proofUrl.substring(idx + marker.length);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (error || !data?.signedUrl) {
        // Fallback: try opening the original URL directly
        setProofImageUrl(proofUrl);
      } else {
        setProofImageUrl(data.signedUrl);
      }
    } catch {
      setProofImageUrl(proofUrl);
    } finally {
      setProofLoading(false);
    }
  };

  const updatePaymentStatus = async (bookingId: string, newPaymentStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: newPaymentStatus })
      .eq('id', bookingId);

    if (error) {
      alert('Failed to update payment status');
      return;
    }

    loadBookings();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Booking Management</h1>
        <Link
          href="/dashboard/admin"
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Back to Admin Dashboard
        </Link>
      </div>

      {/* Payment Proof Modal */}
      {proofImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setProofImageUrl(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Payment Proof</h2>
              <button onClick={() => setProofImageUrl(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            {proofImageUrl === 'loading' ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <img
                  src={proofImageUrl}
                  alt="Payment Proof"
                  className="w-full max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden text-center py-8 text-red-500">
                  <p>Could not load image.</p>
                  <a href={proofImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Try opening directly</a>
                </div>
                <div className="mt-4 flex justify-end">
                  <a href={proofImageUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                    Open Full Size
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign Caregiver Modal */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Assign Caregiver</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Booking: {selectedBooking.service_type} on {new Date(selectedBooking.scheduled_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Available Caregivers</h3>
              {loadingCaregivers ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : caregivers.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {caregivers.map((caregiver) => (
                    <div
                      key={caregiver.id}
                      className="border rounded-lg p-4 hover:bg-blue-50 transition cursor-pointer"
                      onClick={() => {
                        if (confirm(`Assign ${caregiver.full_name} to this booking?`)) {
                          assignCaregiver(caregiver.id);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{caregiver.full_name}</h4>
                          <p className="text-sm text-gray-600">{caregiver.email}</p>
                          {caregiver.specialization && (
                            <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                              {caregiver.specialization}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center ml-4">
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-sm font-semibold text-gray-900">{caregiver.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No caregivers available</p>
                  <Link
                    href="/dashboard/admin/caregivers"
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Caregivers
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t flex justify-end">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          {['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'All Bookings' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caregiver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.clients?.full_name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.clients?.email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.service_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.scheduled_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">{booking.scheduled_time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.duration} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.caregivers ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.caregivers.full_name}</div>
                        <div className="text-sm text-gray-500">{booking.caregivers.email}</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignModal(booking)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700"
                      >
                        Assign Caregiver
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.payment_proof_url ? (
                      <div className="space-y-1">
                        <button
                          onClick={() => viewPaymentProof(booking.payment_proof_url)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Proof
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => updatePaymentStatus(booking.id, 'verified')}
                            className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                          >
                            ✓ Verify
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(booking.id, 'rejected')}
                            className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded hover:bg-red-200"
                          >
                            ✗ Reject
                          </button>
                        </div>
                        {booking.payment_status && (
                          <span className={`text-xs font-semibold ${
                            booking.payment_status === 'verified' ? 'text-green-600' :
                            booking.payment_status === 'rejected' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {booking.payment_status}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No proof</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={booking.status}
                      onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {booking.caregivers && (
                      <button
                        onClick={() => openAssignModal(booking)}
                        className="ml-2 text-blue-600 hover:text-blue-900"
                      >
                        Reassign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No bookings found
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        <p className="text-gray-600">
          Showing {bookings.length} {filter !== 'all' ? filter : ''} booking{bookings.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
