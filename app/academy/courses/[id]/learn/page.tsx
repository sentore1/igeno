'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [courseResources, setCourseResources] = useState<any[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [lessonQuizzes, setLessonQuizzes] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => { init(); }, [id]);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/signin'); return; }

    const { data: enroll } = await supabase
      .from('enrollments').select('*')
      .eq('user_id', session.user.id).eq('course_id', id).single();

    if (!enroll) { router.push(`/academy/courses/${id}`); return; }
    setEnrollment(enroll);

    const [courseRes, lessonsRes, courseResourcesRes, courseQuizzesRes] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('lessons').select('*').eq('course_id', id).order('order_index', { ascending: true }),
      supabase.from('course_resources').select('*').eq('course_id', id).order('order_index', { ascending: true }),
      supabase.from('course_quizzes').select('*').eq('course_id', id).order('order_index', { ascending: true }),
    ]);

    if (courseRes.data) setCourse(courseRes.data);
    if (lessonsRes.data) {
      setLessons(lessonsRes.data);
      if (lessonsRes.data.length > 0) setActiveLesson(lessonsRes.data[0]);
    }
    if (courseResourcesRes.data) setCourseResources(courseResourcesRes.data);
    if (courseQuizzesRes.data) setCourseQuizzes(courseQuizzesRes.data);

    const { data: announcementsData } = await supabase
      .from('course_announcements')
      .select('*')
      .eq('course_id', id)
      .order('created_at', { ascending: false });
    if (announcementsData) setAnnouncements(announcementsData);

    setLoading(false);
  };

  useEffect(() => {
    if (!activeLesson) return;
    Promise.all([
      supabase.from('resources').select('*').eq('lesson_id', activeLesson.id),
      // TODO: Add .order('order_index', { ascending: true }) after running scripts/add-order-index-to-quizzes.sql
      supabase.from('quizzes').select('*').eq('lesson_id', activeLesson.id)
    ]).then(([resourcesRes, quizzesRes]) => {
      setResources(resourcesRes.data || []);
      setLessonQuizzes(quizzesRes.data || []);
    });
  }, [activeLesson]);

  const updateProgress = async (lessonIndex: number) => {
    if (!enrollment || lessons.length === 0) return;
    const newProgress = Math.round(((lessonIndex + 1) / lessons.length) * 100);
    if (newProgress <= (enrollment.progress || 0)) return;
    await supabase.from('enrollments').update({ progress: newProgress }).eq('id', enrollment.id);
    setEnrollment({ ...enrollment, progress: newProgress });
  };

  const getYoutubeEmbed = (url: string) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    setQuizAnswers({ ...quizAnswers, [questionIndex]: answer });
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    const questions = activeQuiz.questions || [];

    questions.forEach((q: any, index: number) => {
      if (quizAnswers[index] === q.correct_answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    // Save quiz attempt
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('quiz_attempts').insert({
        quiz_id: activeQuiz.id,
        user_id: session.user.id,
        score: score,
        answers: quizAnswers,
        passed: score >= (activeQuiz.passing_score || 70),
      });
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setActiveQuiz(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  const activeIdx = lessons.findIndex(l => l.id === activeLesson?.id);
  const progressPct = enrollment?.progress || 0;

  return (
    <div className="fixed inset-0 top-16 flex bg-white z-10">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-30
        w-72 bg-gray-900 text-white flex flex-col overflow-hidden shrink-0
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-700">
          <Link href={`/academy/courses/${id}`} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-2">
            ← Back to course
          </Link>
          <h2 className="font-bold text-sm line-clamp-2">{course?.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {announcements.length > 0 && (
            <div className="border-b border-gray-700">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-yellow-400 uppercase tracking-wide">📢 Announcements</p>
              {announcements.map((a) => (
                <div key={a.id} className="px-4 py-2 border-b border-gray-800">
                  <p className="text-xs font-semibold text-white">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
          {lessons.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No lessons available yet.</p>
          ) : (
            lessons.map((lesson, i) => {
              const lessonProgress = Math.round(((i + 1) / lessons.length) * 100);
              const done = progressPct >= lessonProgress;
              const active = activeLesson?.id === lesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-800 flex items-start gap-3 transition ${active ? 'bg-purple-700' : 'hover:bg-gray-800'}`}
                >
                  <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-500 text-gray-500'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Lesson {i + 1}</p>
                    <p className="text-sm font-medium truncate">{lesson.title}</p>
                    <p className="text-xs text-gray-400">{lesson.duration_minutes} min</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 w-full lg:w-auto">
        {!activeLesson ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center p-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-xl font-semibold mb-2">No lessons yet</p>
              <p className="text-sm">The instructor hasn't added lessons to this course yet.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {/* Mobile: toggle sidebar */}
            <button
              className="lg:hidden mb-4 flex items-center gap-2 text-sm text-purple-600 font-semibold"
              onClick={() => setSidebarOpen(true)}
            >
              ☰ Lessons
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-3">
              <div>
                <p className="text-sm text-purple-600 font-semibold mb-1">
                  Lesson {activeIdx + 1} of {lessons.length}
                </p>
                <h1 className="text-2xl font-bold text-gray-900">{activeLesson.title}</h1>
                {activeLesson.duration_minutes > 0 && (
                  <p className="text-sm text-gray-500 mt-1">{activeLesson.duration_minutes} min</p>
                )}
              </div>
              <button
                onClick={() => updateProgress(activeIdx)}
                className="shrink-0 self-start px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
              >
                Mark Complete ✓
              </button>
            </div>

            {/* Video */}
            {activeLesson.video_url && getYoutubeEmbed(activeLesson.video_url) && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-md" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={getYoutubeEmbed(activeLesson.video_url)!}
                  className="w-full h-full"
                  allowFullScreen
                  title={activeLesson.title}
                />
              </div>
            )}

            {/* Content */}
            {activeLesson.content && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div 
                  className="prose max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
              </div>
            )}

            {/* Lesson Resources */}
            {resources.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold mb-4 text-gray-900">Lesson Resources</h3>
                <ul className="space-y-3">
                  {resources.map((r: any) => (
                    <li key={r.id}>
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-600 hover:underline text-sm font-medium">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {r.title}
                        <span className="text-gray-400 font-normal">({r.file_type})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lesson Quizzes (specific to this lesson) */}
            {lessonQuizzes.length > 0 && !activeQuiz && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold mb-4 text-gray-900">Lesson Quizzes</h3>
                <p className="text-sm text-gray-600 mb-4">Test your knowledge of this lesson</p>
                <div className="space-y-3">
                  {lessonQuizzes.map((quiz: any) => (
                    <div key={quiz.id} className="border rounded-lg p-4 hover:border-purple-300 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                          {quiz.description && (
                            <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{quiz.questions?.length || 0} questions</span>
                            <span>•</span>
                            <span>{quiz.passing_score}% to pass</span>
                            {quiz.time_limit_minutes && (
                              <>
                                <span>•</span>
                                <span>{quiz.time_limit_minutes} min limit</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveQuiz(quiz);
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(null);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 shrink-0"
                        >
                          Take Quiz
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Resources (available for all lessons) */}
            {courseResources.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold mb-4 text-gray-900">Course Resources</h3>
                <p className="text-sm text-gray-600 mb-4">These resources are available for the entire course</p>
                <ul className="space-y-3">
                  {courseResources.map((r: any) => (
                    <li key={r.id}>
                      <a href={r.resource_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-600 hover:underline text-sm font-medium">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {r.title}
                        <span className="text-gray-400 font-normal">({r.resource_type})</span>
                      </a>
                      {r.description && (
                        <p className="text-xs text-gray-500 mt-1 ml-6">{r.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Course Quizzes (available for all lessons) */}
            {courseQuizzes.length > 0 && !activeQuiz && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold mb-4 text-gray-900">Course Quizzes</h3>
                <p className="text-sm text-gray-600 mb-4">Test your knowledge with these assessments</p>
                <div className="space-y-3">
                  {courseQuizzes.map((quiz: any) => (
                    <div key={quiz.id} className="border rounded-lg p-4 hover:border-purple-300 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                          {quiz.description && (
                            <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{quiz.questions?.length || 0} questions</span>
                            <span>•</span>
                            <span>{quiz.passing_score}% to pass</span>
                            {quiz.time_limit_minutes && (
                              <>
                                <span>•</span>
                                <span>{quiz.time_limit_minutes} min limit</span>
                              </>
                            )}
                            {quiz.is_required && (
                              <>
                                <span>•</span>
                                <span className="text-red-600 font-semibold">Required</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveQuiz(quiz);
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(null);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 shrink-0"
                        >
                          Take Quiz
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Quiz Display */}
            {activeQuiz && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{activeQuiz.title}</h3>
                    {activeQuiz.description && (
                      <p className="text-sm text-gray-600 mt-1">{activeQuiz.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span>{activeQuiz.questions?.length || 0} questions</span>
                      <span>•</span>
                      <span>Passing score: {activeQuiz.passing_score}%</span>
                    </div>
                  </div>
                  <button
                    onClick={resetQuiz}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    ← Back to course
                  </button>
                </div>

                {!quizSubmitted ? (
                  <div className="space-y-6">
                    {activeQuiz.questions?.map((question: any, qIndex: number) => (
                      <div key={qIndex} className="border-b pb-6 last:border-b-0">
                        <p className="font-semibold text-gray-900 mb-3">
                          {qIndex + 1}. {question.question}
                        </p>
                        <div className="space-y-2">
                          {question.options?.map((option: string, oIndex: number) => (
                            <label
                              key={oIndex}
                              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                value={option}
                                checked={quizAnswers[qIndex] === option}
                                onChange={() => handleQuizAnswer(qIndex, option)}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={submitQuiz}
                      disabled={Object.keys(quizAnswers).length < (activeQuiz.questions?.length || 0)}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Quiz
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                      quizScore! >= (activeQuiz.passing_score || 70) ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {quizScore! >= (activeQuiz.passing_score || 70) ? (
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <h4 className="text-2xl font-bold mb-2">
                      {quizScore! >= (activeQuiz.passing_score || 70) ? 'Congratulations! 🎉' : 'Keep Trying!'}
                    </h4>
                    <p className="text-lg text-gray-600 mb-4">
                      Your score: <span className="font-bold">{quizScore}%</span>
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      {quizScore! >= (activeQuiz.passing_score || 70)
                        ? `You passed! (${activeQuiz.passing_score}% required)`
                        : `You need ${activeQuiz.passing_score}% to pass. Try again!`}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={resetQuiz}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                      >
                        Back to Course
                      </button>
                      {quizScore! < (activeQuiz.passing_score || 70) && (
                        <button
                          onClick={() => {
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(null);
                          }}
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                        >
                          Retake Quiz
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prev / Next */}
            <div className="flex justify-between pt-2 gap-2">
              <button
                onClick={() => activeIdx > 0 && setActiveLesson(lessons[activeIdx - 1])}
                disabled={activeIdx === 0}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={async () => {
                  if (activeIdx < lessons.length - 1) {
                    updateProgress(activeIdx);
                    setActiveLesson(lessons[activeIdx + 1]);
                  } else {
                    // Last lesson - complete the course
                    await updateProgress(activeIdx);
                    await supabase.from('enrollments').update({ 
                      completed: true,
                      completed_at: new Date().toISOString()
                    }).eq('id', enrollment.id);
                    router.push(`/academy/courses/${id}`);
                  }
                }}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
              >
                {activeIdx === lessons.length - 1 ? 'Submit Course' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
