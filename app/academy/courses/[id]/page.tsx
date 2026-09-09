'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import { Course } from '@/lib/types';
import CoursePaymentModal from '@/components/CoursePaymentModal';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const { id } = use(params);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    loadCourse();
    checkAuth();
  }, [id]);

  useEffect(() => {
    if (course) {
      document.title = `${course.title} - Care iGeno Academy`;
    }
  }, [course]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      checkEnrollment(session.user.id);
    }
  };

  const loadCourse = async () => {
    const [courseRes, lessonsRes] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('lessons').select('*').eq('course_id', id).order('order_index', { ascending: true })
    ]);

    if (courseRes.data) setCourse(courseRes.data);
    if (lessonsRes.data) setLessons(lessonsRes.data);
    
    // Load resources and quizzes for all lessons
    if (lessonsRes.data && lessonsRes.data.length > 0) {
      const lessonIds = lessonsRes.data.map((l: any) => l.id);
      const [resourcesRes, quizzesRes] = await Promise.all([
        supabase.from('resources').select('*').in('lesson_id', lessonIds),
        supabase.from('quizzes').select('*').in('lesson_id', lessonIds)
      ]);
      if (resourcesRes.data) setResources(resourcesRes.data);
      if (quizzesRes.data) setQuizzes(quizzesRes.data);
    }
    
    setLoading(false);
  };

  const checkEnrollment = async (userId: string) => {
    const { data } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', id)
      .single();

    if (data) {
      setEnrolled(true);
      setEnrollmentStatus(data);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Check if course requires payment
    if (course?.requires_payment && course?.price && course.price > 0) {
      // Show payment modal for paid courses
      setShowPaymentModal(true);
      return;
    }

    // For free courses, enroll directly
    setEnrolling(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: id,
          status: 'active',
          progress: 0,
          payment_status: 'not_required',
          can_access: true,
        });

      if (error) throw error;

      setEnrolled(true);
      alert('Successfully enrolled in course!');
      await checkEnrollment(user.id);
    } catch (err: any) {
      alert(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handlePaymentSubmitted = async () => {
    // Refresh enrollment status after payment submission
    if (user) {
      await checkEnrollment(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <Link href="/academy/courses" className="text-purple-600 hover:underline">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600 flex flex-wrap gap-1 items-center">
        <Link href="/" className="hover:text-gray-900">Home</Link>
        <span>&gt;</span>
        <Link href="/academy" className="hover:text-gray-900">Academy</Link>
        <span>&gt;</span>
        <Link href="/academy/courses" className="hover:text-gray-900">Courses</Link>
        <span>&gt;</span>
        <span className="text-gray-900 truncate max-w-[200px] sm:max-w-none">{course.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Course Header */}
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              {course.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
            {(course as any).introduction && (
              <p className="text-gray-600 text-base leading-relaxed">{(course as any).introduction}</p>
            )}
          </div>

          {/* Course Image */}
          <div className="mb-8">
            <div className="w-full rounded-lg overflow-hidden shadow-lg" style={{ maxHeight: '500px' }}>
              {course.featured_image_url ? (
                <img
                  src={course.featured_image_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: '16/9' }}
                />
              ) : (
                <div className="w-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                  <svg className="w-24 h-24 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            {course.price && course.price > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-purple-100 text-purple-900 px-4 py-2 rounded-full font-bold text-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {course.price.toLocaleString()} RWF
              </div>
            )}
          </div>

          {/* What You'll Learn */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">What's Included</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Course enrollment tracking</span>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Progress tracking</span>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dashboard access</span>
              </div>
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Admin-managed content</span>
              </div>
            </div>
            

          </div>

          {/* Course Description */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">Course Description</h2>
            <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: course.description }} />
            {lessons.length === 0 && (
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#694EAC' }}>
                <h3 className="text-sm font-semibold text-white mb-2">Course Content</h3>
                <p className="text-sm text-white">
                  Lessons are being added to this course. Once you enroll, you'll be notified when new content becomes available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            {/* Course Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold">{course.duration_hours} hours</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Category</span>
                <span className="font-semibold">{course.category}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold text-blue-600">Enrollment Open</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Progress Tracking</span>
                <span className="font-semibold text-green-600">✓ Available</span>
              </div>
            </div>

            <div className="border-t pt-6">
              {enrolled ? (
                <div>
                  {enrollmentStatus?.payment_status === 'pending' ? (
                    <div className="text-center">
                      <div className="mb-3 p-4 rounded-lg" style={{ backgroundColor: '#EAB308' }}>
                        <svg className="w-12 h-12 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-semibold text-white mb-1">Payment Pending</p>
                        <p className="text-sm text-white">
                          Your payment is being reviewed by admin. You'll get access once approved.
                        </p>
                      </div>
                      <button
                        disabled
                        className="w-full px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed mb-2"
                      >
                        Awaiting Payment Approval
                      </button>
                      <button
                        onClick={async () => {
                          if (!user) return;
                          setRefreshing(true);
                          await checkEnrollment(user.id);
                          setRefreshing(false);
                        }}
                        disabled={refreshing}
                        className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <svg
                          className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {refreshing ? 'Checking…' : 'Check Approval Status'}
                      </button>
                    </div>
                  ) : enrollmentStatus?.payment_status === 'rejected' ? (
                    <div className="text-center">
                      <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <svg className="w-12 h-12 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <p className="font-semibold text-red-900 mb-1">Payment Rejected</p>
                        <p className="text-sm text-red-700">
                          Your payment was not approved. Please try enrolling again.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                      >
                        Submit Payment Again
                      </button>
                    </div>
                  ) : enrollmentStatus?.completed_at ? (
                    /* ── Course completed ── */
                    <div>
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="font-semibold text-green-900 mb-0.5">Course Completed!</p>
                        <p className="text-xs text-green-700">
                          {new Date(enrollmentStatus.completed_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <Link
                        href={`/academy/certificates/${id}`}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 text-white text-center rounded-lg font-semibold mb-3"
                        style={{ backgroundColor: '#1992A3' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#147a8a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1992A3'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        View Certificate
                      </Link>
                      <Link
                        href={`/academy/courses/${id}/learn`}
                        className="block w-full px-6 py-3 text-center rounded-lg font-semibold text-purple-700 border border-purple-300 hover:bg-purple-50 text-sm"
                      >
                        Review Course
                      </Link>
                    </div>
                  ) : (
                    /* ── Enrolled, not yet completed ── */
                    <div>
                      <Link
                        href={`/academy/courses/${id}/learn`}
                        className="block w-full px-6 py-3 text-white text-center rounded-lg font-semibold mb-3"
                        style={{ backgroundColor: '#1992A3' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#147a8a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1992A3'}
                      >
                        {enrollmentStatus?.progress > 0 ? `Continue Learning (${enrollmentStatus.progress}%)` : 'Start Learning →'}
                      </Link>
                      <p className="text-sm text-center text-green-600 font-semibold">
                        ✓ You're enrolled in this course
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
            </div>

            {/* Included in Course */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-4">This course includes:</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}</span>
                </li>
                {lessons.some((l: any) => l.video_url) && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Video content</span>
                  </li>
                )}
                {resources.length > 0 && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{resources.length} downloadable {resources.length === 1 ? 'resource' : 'resources'}</span>
                  </li>
                )}
                {quizzes.length > 0 && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{quizzes.length} practice {quizzes.length === 1 ? 'quiz' : 'quizzes'}</span>
                  </li>
                )}
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Certificate of completion</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Progress tracking</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{course.duration_hours} hours estimated</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && course && (
        <CoursePaymentModal
          courseId={id}
          courseTitle={course.title}
          coursePrice={course.price || 0}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSubmitted={handlePaymentSubmitted}
        />
      )}
    </div>
  );
}
