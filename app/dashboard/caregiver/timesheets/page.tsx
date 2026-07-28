'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import TimesheetForm from '@/components/TimesheetForm';

interface CaregiverProfile {
  id: string;
  user_id: string;
  full_name: string;
}

interface TimesheetEntry {
  id: string;
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
  bookings: {
    service_type: string;
    scheduled_date: string;
    clients: {
      full_name: string;
    } | null;
  } | null;
  reviewed_at: string | null;
  admin_notes: string | null;
}

export default function CaregiverTimesheetsPage() {
  const [caregiver, setCaregiver] = useState<CaregiverProfile | null>(null);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (caregiver) {
      loadTimesheets();
    }
  }, [caregiver, filterStatus]);

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

    if (profile?.role !== 'caregiver') {
      router.push('/dashboard');
      return;
    }

    const { data: caregiverProfile } = await supabase
      .from('caregivers')
      .select('id, user_id, full_name')
      .eq('user_id', session.user.id)
      .single();

    if (caregiverProfile) {
      setCaregiver(caregiverProfile);
    } else {
      alert('Caregiver profile not found');
      setLoading(false);
    }
  };

  const loadTimesheets = async () => {
    if (!caregiver) return;

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

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'checked-in': { backgroundColor: '#1481BA', color: '#fff' },
      'checked-out': { backgroundColor: '#034748', color: '#fff' },
      'submitted': { backgroundColor: '#11B5E4', color: '#fff' },
      'approved': { backgroundColor: '#0CAADC', color: '#fff' },
      'rejected': { backgroundColor: '#001021', color: '#fff' },
    };

    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={styles[status] || { backgroundColor: '#e5e7eb', color: '#374151' }}>
        {status.toUpperCase().replace('-', ' ')}
      </span>
    );
  };

  const formatDuration = (hours: number | null) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading && !caregiver) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/dashboard/caregiver" 
                className="text-blue-600 hover:text-blue-800 flex items-center mb-2"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Work Log & Timesheets</h1>
              <p className="text-gray-600 mt-1">Track your work hours and submit time logs</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Caregiver</p>
              <p className="text-lg font-semibold text-gray-900">{caregiver.full_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Timesheet Form */}
          <div className="lg:col-span-2">
            <TimesheetForm 
              caregiverId={caregiver.id} 
              onSuccess={loadTimesheets}
            />
          </div>

          {/* Right Column - Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">This Month</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Hours</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatDuration(
                      timesheets
                        .filter(t => ['submitted', 'approved'].includes(t.status) && t.total_hours)
                        .reduce((sum, t) => sum + (t.total_hours || 0), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Submitted</span>
                  <span className="text-xl font-bold text-purple-600">
                    {timesheets.filter(t => t.status === 'submitted').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="text-xl font-bold text-green-600">
                    {timesheets.filter(t => t.status === 'approved').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: '#1481BA' }}>
              <h3 className="text-lg font-bold mb-3 text-white">Tips</h3>
              <ul className="text-sm space-y-2 text-white">
                {['Check in when you start your shift', 'Fill in detailed work descriptions', 'List all tasks you completed', 'Submit before leaving work'].map((tip) => (
                  <li key={tip} className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Timesheet History */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Timesheet History</h2>
              
              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="checked-in">Checked In</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : timesheets.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">No timesheets found</p>
                <p className="text-sm text-gray-500 mt-2">Check in above to create your first timesheet entry</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timesheets.map((timesheet) => (
                  <div key={timesheet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {new Date(timesheet.check_in_time).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </h3>
                          {getStatusBadge(timesheet.status)}
                        </div>
                        {timesheet.bookings && (
                          <p className="text-sm text-gray-600">
                            {timesheet.bookings.service_type} - {timesheet.bookings.clients?.full_name || 'Unknown Client'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatDuration(timesheet.total_hours)}
                        </p>
                        <p className="text-xs text-gray-500">Total Hours</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Check In</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(timesheet.check_in_time).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-600">{timesheet.check_in_location}</p>
                      </div>
                      {timesheet.check_out_time && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check Out</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(timesheet.check_out_time).toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-gray-600">{timesheet.check_out_location}</p>
                        </div>
                      )}
                    </div>

                    {timesheet.work_description && (
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <p className="text-xs text-gray-500 mb-1">Work Description</p>
                        <p className="text-sm text-gray-700">{timesheet.work_description}</p>
                      </div>
                    )}

                    {timesheet.tasks_completed && timesheet.tasks_completed.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Tasks Completed</p>
                        <div className="flex flex-wrap gap-2">
                          {timesheet.tasks_completed.map((task, idx) => (
                            <span key={idx} className="px-2 py-1 text-white text-xs rounded-full" style={{ backgroundColor: '#1481BA' }}>
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {timesheet.admin_notes && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                        <p className="text-xs text-gray-500 mb-1">Admin Feedback</p>
                        <p className="text-sm text-gray-700">{timesheet.admin_notes}</p>
                        {timesheet.reviewed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Reviewed on {new Date(timesheet.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
