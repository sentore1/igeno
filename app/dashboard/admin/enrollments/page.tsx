'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-client';
import Link from 'next/link';

interface EnrollmentWithDetails {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  payment_status: string;
  payment_id: string | null;
  can_access: boolean;
  created_at?: string; // Make optional in case column doesn't exist
  user_name: string;
  user_email: string;
  course_title: string;
  course_price: number;
  payment?: {
    id: string;
    amount: number;
    payment_method: string;
    payment_proof_url: string | null;
    phone_number: string | null;
    transaction_reference: string | null;
    status: string;
    created_at: string;
  };
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const supabase = createBrowserClient();

  useEffect(() => {
    loadEnrollments();
  }, [filter]);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      // Get enrollments with user and course info
      let query = supabase
        .from('enrollments')
        .select(`
          id,
          user_id,
          course_id,
          status,
          payment_status,
          payment_id,
          can_access,
          profiles!enrollments_user_id_fkey(full_name, email),
          courses(title, price)
        `)
        .order('id', { ascending: false }); // Use id instead of created_at as fallback

      // Apply filter
      if (filter !== 'all') {
        query = query.eq('payment_status', filter);
      }

      const { data: enrollmentsData, error: enrollError } = await query;

      if (enrollError) {
        console.error('Enrollment query error:', enrollError);
        throw new Error(`Failed to load enrollments: ${enrollError.message}`);
      }

      // Get payment details for enrollments with payments
      const enrollmentsWithPayments = await Promise.all(
        (enrollmentsData || []).map(async (enrollment: any) => {
          let payment = null;
          
          if (enrollment.payment_id) {
            const { data: paymentData } = await supabase
              .from('course_payments')
              .select('*')
              .eq('id', enrollment.payment_id)
              .single();
            
            payment = paymentData;
          }

          return {
            id: enrollment.id,
            user_id: enrollment.user_id,
            course_id: enrollment.course_id,
            status: enrollment.status,
            payment_status: enrollment.payment_status,
            payment_id: enrollment.payment_id,
            can_access: enrollment.can_access,
            created_at: enrollment.created_at || new Date().toISOString(),
            user_name: enrollment.profiles?.full_name || 'N/A',
            user_email: enrollment.profiles?.email || 'N/A',
            course_title: enrollment.courses?.title || 'N/A',
            course_price: enrollment.courses?.price || 0,
            payment,
          };
        })
      );

      setEnrollments(enrollmentsWithPayments);
    } catch (error: any) {
      console.error('Error loading enrollments:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to load enrollments: ${errorMessage}\n\nPlease ensure RLS policies are set up correctly.`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollment: EnrollmentWithDetails) => {
    if (!enrollment.payment_id) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Update payment status
      const { error: paymentError } = await supabase
        .from('course_payments')
        .update({
          status: 'approved',
          approved_by: session.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', enrollment.payment_id);

      if (paymentError) throw paymentError;

      // Update enrollment
      const { error: enrollError } = await supabase
        .from('enrollments')
        .update({
          payment_status: 'approved',
          can_access: true,
        })
        .eq('id', enrollment.id);

      if (enrollError) throw enrollError;

      alert('Payment approved successfully!');
      setShowModal(false);
      setSelectedEnrollment(null);
      loadEnrollments();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      alert(`Failed to approve payment: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (enrollment: EnrollmentWithDetails) => {
    if (!enrollment.payment_id || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('course_payments')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', enrollment.payment_id);

      if (paymentError) throw paymentError;

      // Update enrollment
      const { error: enrollError } = await supabase
        .from('enrollments')
        .update({
          payment_status: 'rejected',
          can_access: false,
        })
        .eq('id', enrollment.id);

      if (enrollError) throw enrollError;

      alert('Payment rejected');
      setShowModal(false);
      setSelectedEnrollment(null);
      setRejectionReason('');
      loadEnrollments();
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      alert(`Failed to reject payment: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (enrollment: EnrollmentWithDetails) => {
    setSelectedEnrollment(enrollment);
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      not_required: 'bg-blue-100 text-blue-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Enrollments & Payments</h1>
        <p className="text-gray-600">Review and approve course enrollment applications</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          {['all', 'pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 font-medium capitalize transition ${
                filter === tab
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
              {tab === 'pending' && enrollments.filter(e => e.payment_status === 'pending').length > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                  {enrollments.filter(e => e.payment_status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Enrollments Table */}
      {enrollments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No enrollments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.user_name}</div>
                        <div className="text-sm text-gray-500">{enrollment.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{enrollment.course_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {enrollment.course_price > 0
                          ? `${enrollment.course_price.toLocaleString()} RWF`
                          : 'Free'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(enrollment.payment_status)}`}>
                        {enrollment.payment_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enrollment.can_access ? (
                        <span className="text-green-600 font-semibold">✓ Granted</span>
                      ) : (
                        <span className="text-red-600">✗ Denied</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {enrollment.created_at 
                        ? new Date(enrollment.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {enrollment.payment_status === 'pending' && enrollment.payment ? (
                        <button
                          onClick={() => openModal(enrollment)}
                          className="text-purple-600 hover:text-purple-900 font-medium"
                        >
                          Review Payment →
                        </button>
                      ) : enrollment.payment ? (
                        <button
                          onClick={() => openModal(enrollment)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="text-gray-400">No payment</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Review Modal */}
      {showModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Payment Review</h2>
                  <p className="text-gray-600 mt-1">{selectedEnrollment.course_title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedEnrollment(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Student Information</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedEnrollment.user_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedEnrollment.user_email}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              {selectedEnrollment.payment && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">{selectedEnrollment.payment.amount.toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">{selectedEnrollment.payment.payment_method}</span>
                    </div>
                    {selectedEnrollment.payment.phone_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone Number:</span>
                        <span className="font-medium">{selectedEnrollment.payment.phone_number}</span>
                      </div>
                    )}
                    {selectedEnrollment.payment.transaction_reference && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction Ref:</span>
                        <span className="font-mono text-xs">{selectedEnrollment.payment.transaction_reference}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span>{new Date(selectedEnrollment.payment.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(selectedEnrollment.payment.status)}`}>
                        {selectedEnrollment.payment.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              {selectedEnrollment.payment?.payment_proof_url && (
                <div>
                  <h3 className="font-semibold mb-3">Payment Proof</h3>
                  <div className="border rounded-lg p-4">
                    <img
                      src={selectedEnrollment.payment.payment_proof_url}
                      alt="Payment Proof"
                      className="max-w-full h-auto rounded"
                    />
                    <a
                      href={selectedEnrollment.payment.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center text-purple-600 hover:text-purple-700 text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}

              {/* Rejection Reason (for rejected payments) */}
              {selectedEnrollment.payment?.status === 'rejected' && selectedEnrollment.payment.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-800">{selectedEnrollment.payment.rejection_reason}</p>
                </div>
              )}

              {/* Rejection Reason Input (for pending) */}
              {selectedEnrollment.payment_status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason if you're rejecting this payment..."
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              )}

              {/* Actions */}
              {selectedEnrollment.payment_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedEnrollment)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : '✓ Approve Payment'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedEnrollment)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : '✗ Reject Payment'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
