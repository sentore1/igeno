'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

interface TimesheetEntry {
  id: string;
  caregiver_id: string;
  check_in_time: string;
  check_in_location: string;
  check_in_notes: string | null;
  check_out_time: string | null;
  check_out_location: string | null;
  check_out_notes: string | null;
  total_hours: number | null;
  work_description: string | null;
  tasks_completed: string[] | null;
  client_feedback: string | null;
  status: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  caregivers: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    specialization: string | null;
  } | null;
  bookings: {
    service_type: string;
    scheduled_date: string;
    clients: {
      full_name: string;
    } | null;
  } | null;
}

export default function AdminTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetEntry | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    loadTimesheets();
  }, [filterStatus]);

  const checkAuth = async () => {
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
  };

  const loadTimesheets = async () => {
    setLoading(true);
    
    let url = '/api/timesheets';
    if (filterStatus !== 'all') {
      url += `?status=${filterStatus}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data.timesheets) {
      setTimesheets(data.timesheets);
    }

    setLoading(false);
  };

  const handleReview = async (timesheetId: string, newStatus: 'approved' | 'rejected') => {
    if (!reviewNotes.trim() && newStatus === 'rejected') {
      alert('Please provide a reason for rejection');
      return;
    }

    setReviewing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('timesheets')
        .update({
          status: newStatus,
          admin_notes: reviewNotes.trim() || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', timesheetId);

      if (error) {
        alert('Failed to update timesheet: ' + error.message);
        return;
      }

      alert(`Timesheet ${newStatus} successfully!`);
      setSelectedTimesheet(null);
      setReviewNotes('');
      loadTimesheets();
    } catch (error) {
      console.error('Error reviewing timesheet:', error);
      alert('Failed to review timesheet');
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'checked-in': 'bg-blue-100 text-blue-800',
      'checked-out': 'bg-yellow-100 text-yellow-800',
      'submitted': 'bg-purple-100 text-purple-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase().replace('-', ' ')}
      </span>
    );
  };

  const handleDownloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const element = document.getElementById('timesheet-pdf-content');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`timesheet-${selectedTimesheet?.caregivers?.full_name?.replace(/\s+/g, '-') ?? 'report'}.pdf`);
  };

  const formatDuration = (hours: number | null) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const stats = {
    pending: timesheets.filter(t => t.status === 'submitted').length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    rejected: timesheets.filter(t => t.status === 'rejected').length,
    totalHours: timesheets
      .filter(t => t.status === 'approved' && t.total_hours)
      .reduce((sum, t) => sum + (t.total_hours || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/dashboard/admin" 
                className="flex items-center mb-2"
                style={{ color: '#1992A3' }}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Admin Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Timesheet Management</h1>
              <p className="text-gray-600 mt-1">Review and approve caregiver work logs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: '#694EAC' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#694EAC' }}>Pending Review</p>
                <p className="text-3xl font-bold" style={{ color: '#694EAC' }}>{stats.pending}</p>
              </div>
              <div className="p-2 rounded-2xl shadow-md" style={{ backgroundColor: '#694EAC' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="p-2 rounded-2xl shadow-md bg-green-500">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="p-2 rounded-2xl shadow-md bg-red-500">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: '#1992A3' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#1992A3' }}>Total Hours</p>
                <p className="text-3xl font-bold" style={{ color: '#1992A3' }}>{formatDuration(stats.totalHours)}</p>
              </div>
              <div className="p-2 rounded-2xl shadow-md" style={{ backgroundColor: '#1992A3' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Timesheets Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Timesheets</h2>
            
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="submitted">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="checked-in">Checked In</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#1992A3' }}></div>
            </div>
          ) : timesheets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600">No timesheets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timesheets.map((timesheet) => (
                <div 
                  key={timesheet.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTimesheet(timesheet)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {timesheet.caregivers?.full_name || 'Unknown Caregiver'}
                        </h3>
                        {getStatusBadge(timesheet.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {timesheet.caregivers?.specialization && `${timesheet.caregivers.specialization} • `}
                        {timesheet.caregivers?.email}
                      </p>
                      {timesheet.bookings && (
                        <p className="text-sm text-gray-600 mt-1">
                          {timesheet.bookings.service_type} - {timesheet.bookings.clients?.full_name || 'Unknown Client'}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold" style={{ color: '#1992A3' }}>
                        {formatDuration(timesheet.total_hours)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(timesheet.check_in_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="text-sm">
                      <p className="text-gray-500">Check In: {new Date(timesheet.check_in_time).toLocaleTimeString()}</p>
                      <p className="text-gray-600">{timesheet.check_in_location}</p>
                    </div>
                    {timesheet.check_out_time && (
                      <div className="text-sm">
                        <p className="text-gray-500">Check Out: {new Date(timesheet.check_out_time).toLocaleTimeString()}</p>
                        <p className="text-gray-600">{timesheet.check_out_location}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedTimesheet && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTimesheet(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Timesheet Details</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm font-semibold"
                  style={{ backgroundColor: '#1992A3' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedTimesheet(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div id="timesheet-pdf-content" className="p-6 space-y-6">
              {/* PDF Logo Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <img src="/logo.png" alt="IgenoGate" style={{ height: '48px' }} />
                <div className="text-right">
                  <p className="font-bold text-gray-900">Timesheet Report</p>
                  <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
                </div>
              </div>
              {/* Caregiver Info */}
              <div className="rounded-lg p-4" style={{ backgroundColor: '#e6f6f8' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#009292' }}>Caregiver Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedTimesheet.caregivers?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="font-semibold text-gray-900">{selectedTimesheet.caregivers?.specialization || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedTimesheet.caregivers?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedTimesheet.caregivers?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Time Details */}
              <div className="rounded-lg p-4" style={{ backgroundColor: '#f0ecf9' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#694EAC' }}>Time Details</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Check In</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedTimesheet.check_in_time).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedTimesheet.check_in_location}</p>
                  </div>
                  {selectedTimesheet.check_out_time && (
                    <div>
                      <p className="text-sm text-gray-600">Check Out</p>
                      <p className="font-semibold text-gray-900">{new Date(selectedTimesheet.check_out_time).toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedTimesheet.check_out_location}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Total Duration</p>
                    <p className="text-2xl font-bold" style={{ color: '#694EAC' }}>{formatDuration(selectedTimesheet.total_hours)}</p>
                  </div>
                </div>
              </div>

              {/* Work Details */}
              {selectedTimesheet.work_description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Work Description</h3>
                  <p className="text-gray-700">{selectedTimesheet.work_description}</p>
                </div>
              )}

              {/* Tasks Completed */}
              {selectedTimesheet.tasks_completed && selectedTimesheet.tasks_completed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tasks Completed</h3>
                  <div className="grid md:grid-cols-2 gap-2">
                    {selectedTimesheet.tasks_completed.map((task, idx) => (
                      <div key={idx} className="flex items-center bg-green-50 p-2 rounded">
                        <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Feedback */}
              {selectedTimesheet.client_feedback && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Feedback</h3>
                  <p className="text-gray-700">{selectedTimesheet.client_feedback}</p>
                </div>
              )}

              {/* Review Section */}
              {selectedTimesheet.status === 'submitted' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Review</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Review Notes (Required for rejection)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add your comments here..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleReview(selectedTimesheet.id, 'approved')}
                      disabled={reviewing}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(selectedTimesheet.id, 'rejected')}
                      disabled={reviewing}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 font-semibold disabled:bg-gray-400 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Previous Review */}
              {selectedTimesheet.admin_notes && (
                <div className="bg-gray-100 border-l-4 border-gray-400 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Feedback</h3>
                  <p className="text-gray-700">{selectedTimesheet.admin_notes}</p>
                  {selectedTimesheet.reviewed_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Reviewed on {new Date(selectedTimesheet.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
