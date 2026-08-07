'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalCourses: 0,
    totalEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

    setIsAdmin(true);
    loadStats();
  };

  const loadStats = async () => {
    // Load statistics
    const [users, bookings, courses, enrollments] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      totalUsers: users.count || 0,
      totalBookings: bookings.count || 0,
      totalCourses: courses.count || 0,
      totalEnrollments: enrollments.count || 0,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
            <div className="p-3 rounded-full" style={{backgroundColor: '#1992A3'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalBookings}</p>
            </div>
            <div className="p-3 rounded-full" style={{backgroundColor: '#4170A7'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalCourses}</p>
            </div>
            <div className="p-3 rounded-full" style={{backgroundColor: '#694EAB'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Enrollments</p>
              <p className="text-3xl font-bold text-orange-600">{stats.totalEnrollments}</p>
            </div>
            <div className="p-3 rounded-full" style={{backgroundColor: '#352756'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Link
          href="/dashboard/admin/users"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#1992A3'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">User Management</h3>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </Link>

        {/* Booking Management */}
        <Link
          href="/dashboard/admin/bookings"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#4170A7'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Booking Management</h3>
          <p className="text-gray-600">View and manage all service bookings</p>
        </Link>

        {/* Course Management */}
        <Link
          href="/dashboard/admin/courses"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#694EAB'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Course Management</h3>
          <p className="text-gray-600">Create and manage courses</p>
        </Link>

        {/* Caregiver Management */}
        <Link
          href="/dashboard/admin/caregivers"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#448089'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Caregiver Management</h3>
          <p className="text-gray-600">Manage caregiver profiles and assignments</p>
        </Link>

        {/* Reports */}
        <Link
          href="/dashboard/admin/reports"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#352756'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Reports & Analytics</h3>
          <p className="text-gray-600">View platform statistics and reports</p>
        </Link>

        {/* Service Types Management */}
        <Link
          href="/dashboard/admin/services"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition border-2 border-blue-200"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#4170A7'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Service Types</h3>
          <p className="text-gray-600">Manage booking service types and pricing</p>
          <div className="mt-2 inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">NEW</div>
        </Link>

        {/* Payment Settings */}
        <Link
          href="/dashboard/admin/payment-settings"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition border-2 border-green-200"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#1992A3'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Payment Settings</h3>
          <p className="text-gray-600">Configure Mobile Money (MoMo) payments</p>
          <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">NEW</div>
        </Link>

        {/* Timesheet Management */}
        <Link
          href="/dashboard/admin/timesheets"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition border-2 border-purple-200"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#694EAB'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Timesheet Management</h3>
          <p className="text-gray-600">Review caregiver work logs and hours</p>
          <div className="mt-2 inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">NEW</div>
        </Link>

        {/* Enrollments & Payments */}
        <Link
          href="/dashboard/admin/enrollments"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition border-2 border-yellow-200"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#F59E0B'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Enrollments & Payments</h3>
          <p className="text-gray-600">Review and approve course payments</p>
          <div className="mt-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">NEW</div>
        </Link>

        {/* Settings */}
        <Link
          href="/dashboard/admin/settings"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg" style={{backgroundColor: '#6E6E6F'}}>
              <svg className="w-8 h-8" style={{color: '#fff'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">System Settings</h3>
          <p className="text-gray-600">Configure platform settings</p>
        </Link>
      </div>
    </div>
  );
}
