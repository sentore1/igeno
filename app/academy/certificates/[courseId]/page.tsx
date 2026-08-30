'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import CourseCertificate from '@/components/CourseCertificate';

export default function CertificatePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data for certificate
  const [studentName, setStudentName] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateSubtitle, setCertificateSubtitle] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [lessons, setLessons] = useState<{ title: string; category?: string }[]>([]);
  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadCertificateData();
  }, [courseId]);

  const loadCertificateData = async () => {
    try {
      // 1. Auth check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      const userId = session.user.id;

      // 2. Fetch in parallel: profile, course, enrollment, lessons
      const [profileRes, courseRes, enrollmentRes, lessonsRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', userId).single(),
        supabase.from('courses').select('title, category, description, certificate_title, certificate_subtitle').eq('id', courseId).single(),
        supabase
          .from('enrollments')
          .select('completed_at, created_at, can_access, payment_status, progress')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single(),
        supabase
          .from('lessons')
          .select('title, category')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true }),
      ]);

      // 3. Guard: must be enrolled and completed
      if (!enrollmentRes.data) {
        setError("You are not enrolled in this course.");
        setLoading(false);
        return;
      }
      if (!enrollmentRes.data.completed_at) {
        setError("You haven't completed this course yet.");
        setLoading(false);
        return;
      }

      // 4. Guard: all lessons must be completed (progress = 100)
      if ((enrollmentRes.data.progress ?? 0) < 100) {
        setError("You haven't finished all lessons yet. Complete every lesson before accessing your certificate.");
        setLoading(false);
        return;
      }

      // 5. Guard: all required quizzes must be passed
      const [requiredQuizzesRes, lessonQuizzesRes, passedAttemptsRes] = await Promise.all([
        supabase
          .from('course_quizzes')
          .select('id, title')
          .eq('course_id', courseId)
          .eq('is_required', true),
        supabase
          .from('quizzes')
          .select('id, title, lesson_id')
          .in('lesson_id', (lessonsRes.data || []).map((l: any) => l.id)),
        supabase
          .from('quiz_attempts')
          .select('quiz_id')
          .eq('user_id', userId)
          .eq('passed', true),
      ]);

      const passedIds = new Set((passedAttemptsRes.data || []).map((a: any) => a.quiz_id));

      const failedRequiredCourse = (requiredQuizzesRes.data || []).filter(
        (q: any) => !passedIds.has(q.id)
      );
      const failedLessonQuizzes = (lessonQuizzesRes.data || []).filter(
        (q: any) => !passedIds.has(q.id)
      );

      if (failedRequiredCourse.length > 0 || failedLessonQuizzes.length > 0) {
        const total = failedRequiredCourse.length + failedLessonQuizzes.length;
        setError(
          `You have ${total} quiz${total > 1 ? 'zes' : ''} that ${total > 1 ? 'have' : 'has'} not been passed yet. ` +
          `Please go back and pass all required quizzes before accessing your certificate.`
        );
        setLoading(false);
        return;
      }

      // 6. Populate state
      setStudentName(profileRes.data?.full_name || session.user.email || 'Student');
      setCourseTitle(courseRes.data?.title || 'Course');
      setCourseDescription(courseRes.data?.description || '');
      setCertificateTitle(courseRes.data?.certificate_title || '');
      setCertificateSubtitle(courseRes.data?.certificate_subtitle || '');
      setCompletionDate(enrollmentRes.data.completed_at);
      setEnrollmentDate(enrollmentRes.data.created_at || enrollmentRes.data.completed_at);
      setLessons(
        (lessonsRes.data || []).map((l: any) => ({
          title: l.title,
          category: l.category || courseRes.data?.category || undefined,
        }))
      );

      // 7. Check/create certificate record
      await upsertCertificate(
        userId,
        courseId,
        profileRes.data?.full_name || '',
        courseRes.data?.title || '',
        enrollmentRes.data.completed_at,
      );

    } catch (err: any) {
      console.error('Certificate load error:', err);
      setError('Failed to load certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Insert or retrieve the certificate row so we have a stable certificate number.
   */
  const upsertCertificate = async (
    userId: string,
    cId: string,
    name: string,
    title: string,
    completedAt: string,
  ) => {
    // Try to get existing record
    const { data: existing } = await supabase
      .from('certificates')
      .select('certificate_number, final_score')
      .eq('user_id', userId)
      .eq('course_id', cId)
      .single();

    if (existing) {
      setCertificateNumber(existing.certificate_number || generateCertNum());
      if (existing.final_score) setFinalScore(existing.final_score);
      return;
    }

    // Calculate average quiz score from quiz_attempts for this user
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('user_id', userId);

    let avgScore: number | undefined;
    if (attempts && attempts.length > 0) {
      avgScore = Math.round(attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / attempts.length);
      setFinalScore(avgScore);
    }

    const certNum = generateCertNum();
    setCertificateNumber(certNum);

    // Insert new certificate row
    await supabase.from('certificates').insert({
      user_id: userId,
      course_id: cId,
      student_name: name,
      course_title: title,
      completion_date: completedAt.split('T')[0],
      certificate_number: certNum,
      final_score: avgScore ?? null,
      issued_at: new Date().toISOString(),
    });
  };

  /** Matches the pattern in the template: IG + 7 digits + 3 uppercase letters */
  const generateCertNum = () => {
    const digits = Math.floor(1000000 + Math.random() * 9000000);
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    return `IG${digits}${letters}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Preparing your certificate…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Certificate Not Available Yet</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/academy/courses/${courseId}/learn`}
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              Continue Learning →
            </Link>
            <Link
              href={`/academy/courses/${courseId}`}
              className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" id="cert-print-root">
      {/* Page header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link
          href={`/academy/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Course
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Certificate</h1>
            <p className="text-gray-500 mt-1">{courseTitle}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold w-fit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Course Completed
          </div>
        </div>
      </div>

      {/* Certificate component */}
      <CourseCertificate
        studentName={studentName}
        courseTitle={courseTitle}
        courseDescription={courseDescription}
        certificateTitle={certificateTitle}
        certificateSubtitle={certificateSubtitle}
        completionDate={completionDate}
        enrollmentDate={enrollmentDate}
        certificateNumber={certificateNumber}
        lessons={lessons}
        finalScore={finalScore}
      />

      {/* Certificate details summary */}
      <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-sm p-6 grid sm:grid-cols-3 gap-6 text-center print:hidden">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Certificate ID</p>
          <p className="font-mono font-bold text-gray-900 text-sm">{certificateNumber}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Issued To</p>
          <p className="font-semibold text-gray-900">{studentName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Completed On</p>
          <p className="font-semibold text-gray-900">
            {new Date(completionDate).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
