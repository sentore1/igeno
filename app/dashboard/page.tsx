'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import { User, Booking, Enrollment } from '@/lib/types';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Debug: Check Supabase configuration
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session check:', { hasSession: !!session, error: sessionError });

      if (sessionError) {
        console.error('Session error:', sessionError);
        router.push('/auth/signin');
        return;
      }

      if (!session) {
        console.log('No session found, redirecting to signin');
        router.push('/auth/signin');
        return;
      }

      console.log('User ID:', session.user.id);
      console.log('User email:', session.user.email);

      // Load profile
      const { data: profile, error: profileError, status, statusText } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile error details:', {
          error: profileError,
          message: profileError?.message,
          details: profileError?.details,
          hint: profileError?.hint,
          code: profileError?.code,
          status,
          statusText,
          userId: session.user.id
        });
        
        // Check if it's a "not found" error
        if (profileError.code === 'PGRST116' || status === 406 || !profile) {
          console.error('Profile not found for user:', session.user.id);
          
          // Try to create profile automatically
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
              role: session.user.user_metadata?.role || 'client',
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Failed to create profile:', createError);
            alert(`Profile not found and could not be created.\n\nPlease run the SQL fix script in Supabase:\nscripts/fix-missing-profiles.sql\n\nOr contact support.`);
            await supabase.auth.signOut();
            router.push('/auth/signin');
            return;
          }
          
          console.log('Profile created successfully:', newProfile);
          setUser(newProfile);
          setLoading(false);
          return;
        }
        
        alert(`Error loading profile: ${profileError?.message || 'Unknown error'}\nCode: ${profileError?.code}\nCheck console for details.`);
        setLoading(false);
        return;
      }

      if (!profile) {
        console.error('No profile found for user:', session.user.id);
        alert('Profile not found. You may need to sign up again or contact support.');
        setLoading(false);
        return;
      }

      console.log('Profile loaded:', profile);
      setUser(profile);

      // Redirect caregivers to their dedicated dashboard
      if (profile.role === 'caregiver') {
        router.push('/dashboard/caregiver');
        return;
      }

      // Load bookings if client/caregiver/nurse
      if (['client', 'caregiver', 'nurse'].includes(profile.role)) {
        loadBookings(session.user.id, profile.role);
      }

      // Load enrollments for all roles
      loadEnrollments(session.user.id);
      loadAvailableCourses();

      setLoading(false);
    } catch (error) {
      console.error('Dashboard load error:', error);
      alert('Error loading dashboard. Please check console.');
      setLoading(false);
    }
  };

  const loadBookings = async (userId: string, role: string) => {
    let query = supabase.from('bookings').select('*');

    if (role === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (client) {
        query = query.eq('client_id', client.id);
      }
    } else if (role === 'caregiver') {
      const { data: caregiver } = await supabase
        .from('caregivers')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (caregiver) {
        query = query.eq('caregiver_id', caregiver.id);
      }
    }

    const { data } = await query.order('scheduled_date', { ascending: true }).limit(5);
    if (data) setBookings(data);
  };

  const loadEnrollments = async (userId: string) => {
    const { data } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });
    if (data) setEnrollments(data as any);
  };

  const loadAvailableCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (data) setAvailableCourses(data);
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name}!</h1>
        <p className="text-gray-600 mt-2">Role: <span className="font-semibold capitalize">{user.role}</span></p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {['client', 'caregiver', 'nurse'].includes(user.role) && (
          <Link
            href="/care/booking"
            className="p-6 rounded-lg shadow-md hover:shadow-xl transition text-center"
            style={{ backgroundColor: '#694EAB' }}
          >
            <div className="text-white mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">Book Service</h3>
          </Link>
        )}
        
        <Link
          href="/academy/courses"
          className="p-6 rounded-lg shadow-md hover:shadow-xl transition text-center"
          style={{ backgroundColor: '#1992A3' }}
        >
          <div className="text-white mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-semibold text-white">Browse Courses</h3>
        </Link>

        <Link
          href="/care"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-center group"
        >
          <div className="text-green-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Care Services</h3>
          <div className="flex items-center justify-center gap-1 text-sm text-green-600 group-hover:gap-2 transition-all">
            <span>Learn More</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link
          href="/academy"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-center group"
        >
          <div className="text-orange-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Academy</h3>
          <div className="flex items-center justify-center gap-1 text-sm text-orange-600 group-hover:gap-2 transition-all">
            <span>Learn More</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        {['client', 'caregiver', 'nurse'].includes(user.role) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{booking.service_type}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
                        </p>
                        <p className="text-sm text-gray-600">{booking.duration} minutes</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No bookings yet</p>
            )}
          </div>
        )}

        {/* My Courses */}
        {enrollments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Courses</h2>
              <Link href="/academy/courses" className="text-sm text-purple-600 hover:underline">Browse more</Link>
            </div>
            <div className="space-y-4">
              {enrollments.map((enrollment: any) => (
                <Link
                  key={enrollment.id}
                  href={`/academy/courses/${enrollment.course_id}/learn`}
                  className="block border-l-4 border-purple-500 pl-4 py-2 hover:bg-purple-50 rounded-r-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold hover:text-purple-700">{enrollment.courses?.title}</h3>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold">{enrollment.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${enrollment.progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(enrollment.status)}`}>
                      {enrollment.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Available Courses */}
      {availableCourses.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Available Courses</h2>
            <Link href="/academy/courses" className="text-sm text-purple-600 hover:underline">View all</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCourses.map((course: any) => {
              const enrolled = enrollments.some((e: any) => e.course_id === course.id);
              return (
                <div key={course.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                  <div className="h-24 bg-gradient-to-r from-purple-400 to-purple-600" />
                  <div className="p-4">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">{course.category}</p>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-gray-500 mb-3">{course.duration_hours}h</p>
                    {enrolled ? (
                      <Link
                        href={`/academy/courses/${course.id}/learn`}
                        className="block w-full text-center px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                      >
                        Continue Learning
                      </Link>
                    ) : (
                      <Link
                        href={`/academy/courses/${course.id}`}
                        className="block w-full text-center px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
                      >
                        Enroll Now
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Section */}
      {user.role === 'admin' && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Admin Quick Access</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/dashboard/admin" className="p-4 border-2 border-blue-600 rounded-lg hover:bg-blue-50 text-center">
              <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="font-semibold">Admin Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">Full admin panel</p>
            </Link>
            <Link href="/dashboard/admin/users" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-gray-600 mt-1">User management</p>
            </Link>
            <Link href="/dashboard/admin/bookings" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-semibold">Manage Bookings</h3>
              <p className="text-sm text-gray-600 mt-1">Booking management</p>
            </Link>
            <Link href="/dashboard/admin/courses" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="font-semibold">Manage Courses</h3>
              <p className="text-sm text-gray-600 mt-1">Course management</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
