'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-client';

interface TimesheetFormProps {
  caregiverId: string;
  onSuccess?: () => void;
}

interface Booking {
  id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  clients: {
    full_name: string;
  } | null;
}

interface ActiveTimesheet {
  id: string;
  check_in_time: string;
  check_in_location: string;
  check_in_notes: string;
  booking_id: string | null;
  status: string;
}

export default function TimesheetForm({ caregiverId, onSuccess }: TimesheetFormProps) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeTimesheet, setActiveTimesheet] = useState<ActiveTimesheet | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check-in form state
  const [checkInData, setCheckInData] = useState({
    booking_id: '',
    check_in_location: '',
    check_in_notes: '',
  });

  // Check-out form state
  const [checkOutData, setCheckOutData] = useState({
    check_out_location: '',
    check_out_notes: '',
    work_description: '',
    tasks_completed: [] as string[],
    client_feedback: '',
  });

  const [newTask, setNewTask] = useState('');

  const supabase = createBrowserClient();

  useEffect(() => {
    loadData();
  }, [caregiverId]);

  const loadData = async () => {
    setLoading(true);

    // Check for active timesheet
    const { data: timesheets } = await supabase
      .from('timesheets')
      .select('*')
      .eq('caregiver_id', caregiverId)
      .eq('status', 'checked-in')
      .order('check_in_time', { ascending: false })
      .limit(1);

    if (timesheets && timesheets.length > 0) {
      setIsCheckedIn(true);
      setActiveTimesheet(timesheets[0]);
    }

    // Load today's bookings
    const today = new Date().toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        service_type,
        scheduled_date,
        scheduled_time,
        clients (
          full_name
        )
      `)
      .eq('caregiver_id', caregiverId)
      .eq('scheduled_date', today)
      .order('scheduled_time');

    if (bookings) {
      setTodayBookings(bookings as any);
    }

    setLoading(false);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkInData),
      });

      const result = await response.json();

      if (!response.ok) {
        alert('Failed to check in: ' + result.error);
        return;
      }

      alert('Successfully checked in!');
      setCheckInData({
        booking_id: '',
        check_in_location: '',
        check_in_notes: '',
      });
      loadData();
      onSuccess?.();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!activeTimesheet) {
      alert('No active timesheet found');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/timesheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timesheet_id: activeTimesheet.id,
          ...checkOutData,
          status: 'submitted',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert('Failed to check out: ' + result.error);
        return;
      }

      alert('Work log submitted successfully!');
      setCheckOutData({
        check_out_location: '',
        check_out_notes: '',
        work_description: '',
        tasks_completed: [],
        client_feedback: '',
      });
      setIsCheckedIn(false);
      setActiveTimesheet(null);
      loadData();
      onSuccess?.();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to submit work log');
    } finally {
      setSubmitting(false);
    }
  };

  const addTask = () => {
    if (newTask.trim()) {
      setCheckOutData({
        ...checkOutData,
        tasks_completed: [...checkOutData.tasks_completed, newTask.trim()],
      });
      setNewTask('');
    }
  };

  const removeTask = (index: number) => {
    setCheckOutData({
      ...checkOutData,
      tasks_completed: checkOutData.tasks_completed.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Check-In Form */}
      {!isCheckedIn && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check In - Start Work</h2>
          </div>
          
          <form onSubmit={handleCheckIn} className="space-y-4">
            {/* Booking Selection */}
            {todayBookings.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Today's Booking (Optional)
                </label>
                <select
                  value={checkInData.booking_id}
                  onChange={(e) => setCheckInData({ ...checkInData, booking_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No specific booking</option>
                  {todayBookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.scheduled_time} - {booking.service_type} ({booking.clients?.full_name || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={checkInData.check_in_location}
                onChange={(e) => setCheckInData({ ...checkInData, check_in_location: e.target.value })}
                placeholder="e.g., Office, Client Home, 123 Main St"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={checkInData.check_in_notes}
                onChange={(e) => setCheckInData({ ...checkInData, check_in_notes: e.target.value })}
                placeholder="Any special notes about starting your shift..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-white py-3 px-4 rounded-md font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ backgroundColor: submitting ? undefined : '#034748' }}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Checking In...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Check In
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Active Shift Info & Check-Out Form */}
      {isCheckedIn && activeTimesheet && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Active Shift Banner */}
          <div className="border-l-4 p-4 mb-6 rounded" style={{ backgroundColor: '#e0f4fb', borderColor: '#1481BA' }}>
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  You are currently checked in
                </p>
                <p className="text-sm text-blue-700">
                  Started at {new Date(activeTimesheet.check_in_time).toLocaleTimeString()} 
                  {' '}at {activeTimesheet.check_in_location}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Check Out - Submit Work Log</h2>
          </div>

          <form onSubmit={handleCheckOut} className="space-y-4">
            {/* Check-out Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Check-Out Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={checkOutData.check_out_location}
                onChange={(e) => setCheckOutData({ ...checkOutData, check_out_location: e.target.value })}
                placeholder="Where are you checking out from?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Work Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Work Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={checkOutData.work_description}
                onChange={(e) => setCheckOutData({ ...checkOutData, work_description: e.target.value })}
                placeholder="Describe the work you completed today..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tasks Completed */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tasks Completed
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                  placeholder="Add a task and press Enter or click Add"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTask}
                  className="px-4 py-2 text-white rounded-md font-semibold"
                  style={{ backgroundColor: '#1481BA' }}
                >
                  Add
                </button>
              </div>
              {checkOutData.tasks_completed.length > 0 && (
                <ul className="space-y-2">
                  {checkOutData.tasks_completed.map((task, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <span className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {task}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Client Feedback */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client Feedback (Optional)
              </label>
              <textarea
                value={checkOutData.client_feedback}
                onChange={(e) => setCheckOutData({ ...checkOutData, client_feedback: e.target.value })}
                placeholder="Any feedback from the client?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Check-out Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={checkOutData.check_out_notes}
                onChange={(e) => setCheckOutData({ ...checkOutData, check_out_notes: e.target.value })}
                placeholder="Any other notes about ending your shift..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-white py-3 px-4 rounded-md font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ backgroundColor: submitting ? undefined : '#0CAADC' }}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check Out & Submit
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
