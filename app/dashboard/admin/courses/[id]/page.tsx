'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import QuizBuilder from '@/components/QuizBuilder';

export default function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [courseResources, setCourseResources] = useState<any[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddCourseQuiz, setShowAddCourseQuiz] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  
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

    if (profile?.role !== 'admin' && profile?.role !== 'trainer') {
      router.push('/dashboard');
      return;
    }

    loadCourse();
  };

  const loadCourse = async () => {
    const [courseRes, lessonsRes, resourcesRes, quizzesRes] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('lessons').select(`
        *,
        resources(*),
        quizzes(*)
      `).eq('course_id', id).order('order_index', { ascending: true }),
      supabase.from('course_resources').select('*').eq('course_id', id).order('order_index', { ascending: true }),
      supabase.from('course_quizzes').select('*').eq('course_id', id).order('order_index', { ascending: true })
    ]);

    if (courseRes.data) setCourse(courseRes.data);
    if (lessonsRes.data) setLessons(lessonsRes.data);
    if (resourcesRes.data) setCourseResources(resourcesRes.data);
    if (quizzesRes.data) setCourseQuizzes(quizzesRes.data);
    setLoading(false);
  };

  const updateCourse = async (updates: any) => {
    setSaving(true);
    const { error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id);

    if (error) {
      alert(`Failed to update course: ${error.message}`);
    } else {
      alert('Course updated successfully!');
      loadCourse();
    }
    setSaving(false);
  };

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const { error } = await supabase.from('lessons').insert({
      course_id: id,
      title: formData.get('title'),
      content: formData.get('content'),
      video_url: formData.get('video_url') || null,
      duration_minutes: parseInt(formData.get('duration_minutes') as string) || 0,
      order_index: lessons.length + 1,
    });

    if (error) {
      alert(`Failed to add lesson: ${error.message}`);
    } else {
      alert('Lesson added successfully!');
      form.reset();
      setShowAddLesson(false);
      loadCourse();
    }
  };

  const deleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(`Delete lesson "${title}"?`)) return;

    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) {
      alert(`Failed to delete lesson: ${error.message}`);
    } else {
      loadCourse();
    }
  };

  const addResource = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const { error } = await supabase.from('resources').insert({
      lesson_id: selectedLesson,
      title: formData.get('title'),
      file_url: formData.get('file_url'),
      file_type: formData.get('file_type'),
    });

    if (error) {
      alert(`Failed to add resource: ${error.message}`);
    } else {
      alert('Resource added successfully!');
      form.reset();
      setShowAddResource(false);
      loadCourse(); // Reload to show the new resource
    }
  };

  const addQuiz = async (questions: any[], title: string, passingScore: number) => {
    // Transform questions to match the expected format
    const formattedQuestions = questions.map(q => ({
      question: q.question,
      options: q.options,
      correct_answer: q.options[q.correct] // Store the actual answer text
    }));

    const { error } = await supabase.from('quizzes').insert({
      lesson_id: selectedLesson,
      title: title,
      questions: formattedQuestions,
      passing_score: passingScore,
    });

    if (error) {
      alert(`Failed to add quiz: ${error.message}`);
      console.error('Quiz error:', error);
    } else {
      alert('Quiz added successfully!');
      setShowAddQuiz(false);
      loadCourse(); // Reload to show updated data
    }
  };

  const addCourseQuiz = async (questions: any[], title: string, passingScore: number) => {
    // Transform questions to match the expected format
    const formattedQuestions = questions.map(q => ({
      question: q.question,
      options: q.options,
      correct_answer: q.options[q.correct] // Store the actual answer text
    }));

    const { error } = await supabase.from('course_quizzes').insert({
      course_id: id,
      title: title,
      description: '',
      questions: formattedQuestions,
      passing_score: passingScore,
      time_limit_minutes: 30,
      max_attempts: 3,
      is_required: false,
      order_index: courseQuizzes.length
    });

    if (error) {
      alert(`Failed to add quiz: ${error.message}`);
      console.error('Course quiz error:', error);
    } else {
      alert('Quiz added successfully!');
      setShowAddCourseQuiz(false);
      loadCourse();
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
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <Link href="/dashboard/admin/courses" className="text-purple-600 hover:underline">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-gray-600">{course.category}</p>
        </div>
        <Link
          href="/dashboard/admin/courses"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Back to Courses
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {['overview', 'resources', 'quizzes', 'lessons', 'students'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
              {tab === 'resources' && ` (${courseResources.length})`}
              {tab === 'quizzes' && ` (${courseQuizzes.length})`}
              {tab === 'lessons' && ` (${lessons.length})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Course Overview</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={4}
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={course.category}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="Caregiver Training">Caregiver Training</option>
                  <option value="Nursing Skills">Nursing Skills</option>
                  <option value="Health & Safety">Health & Safety</option>
                  <option value="Communication">Communication</option>
                  <option value="Career Development">Career Development</option>
                  <option value="Specialized Care">Specialized Care</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                <input
                  type="number"
                  value={course.duration_hours}
                  onChange={(e) => setCourse({ ...course, duration_hours: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL (optional)</label>
              <input
                type="url"
                value={course.youtube_url || ''}
                onChange={(e) => setCourse({ ...course, youtube_url: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites (optional)</label>
              <textarea
                rows={2}
                value={course.prerequisites || ''}
                onChange={(e) => setCourse({ ...course, prerequisites: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={course.is_published}
                onChange={(e) => setCourse({ ...course, is_published: e.target.checked })}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                Published (visible to students)
              </label>
            </div>
            <button
              onClick={() => updateCourse(course)}
              disabled={saving}
              className="px-6 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Course Resources</h2>
              <p className="text-sm text-gray-600 mt-1">PDFs, videos, and documents for the entire course</p>
            </div>
            <button
              onClick={() => {
                const title = prompt('Resource Title:');
                if (!title) return;
                const url = prompt('Resource URL:');
                if (!url) return;
                const type = prompt('Resource Type (pdf, video, link, document, other):') || 'pdf';
                
                supabase.from('course_resources').insert({
                  course_id: id,
                  title,
                  resource_url: url,
                  resource_type: type,
                  order_index: courseResources.length
                }).then(({ error }) => {
                  if (error) alert(`Error: ${error.message}`);
                  else loadCourse();
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Resource
            </button>
          </div>

          {courseResources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No resources added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseResources.map((resource) => (
                <div key={resource.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{resource.title}</h3>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{resource.resource_type}</span>
                      <a href={resource.resource_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Resource →
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this resource?')) {
                        supabase.from('course_resources').delete().eq('id', resource.id).then(() => loadCourse());
                      }
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Course Quizzes</h2>
              <p className="text-sm text-gray-600 mt-1">Assessments for the entire course</p>
            </div>
            <button
              onClick={() => setShowAddCourseQuiz(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Quiz
            </button>
          </div>

          {courseQuizzes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p>No quizzes added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseQuizzes.map((quiz) => (
                <div key={quiz.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <p className="text-sm text-gray-600">{quiz.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span>{quiz.questions?.length || 0} questions</span>
                        <span>•</span>
                        <span>{quiz.passing_score}% to pass</span>
                        <span>•</span>
                        <span>{quiz.time_limit_minutes} min limit</span>
                        <span>•</span>
                        <span>{quiz.max_attempts} attempts</span>
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
                        if (confirm('Delete this quiz?')) {
                          supabase.from('course_quizzes').delete().eq('id', quiz.id).then(() => loadCourse());
                        }
                      }}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lessons Tab */}
      {activeTab === 'lessons' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Course Lessons</h2>
            <button
              onClick={() => setShowAddLesson(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Lesson
            </button>
          </div>

          {/* Lessons List */}
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Lesson {index + 1}
                      </span>
                      <h3 className="text-lg font-bold">{lesson.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{lesson.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {lesson.video_url && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Video
                        </span>
                      )}
                      <span>{lesson.duration_minutes} minutes</span>
                      {lesson.resources?.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                          {lesson.resources.length} Resource{lesson.resources.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {lesson.quizzes?.length > 0 && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                          {lesson.quizzes.length} Quiz{lesson.quizzes.length !== 1 ? 'zes' : ''}
                        </span>
                      )}
                    </div>

                    {/* Lesson Resources */}
                    {lesson.resources && lesson.resources.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Resources:</h4>
                        <div className="space-y-2">
                          {lesson.resources.map((resource: any) => (
                            <div key={resource.id} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-medium">{resource.title}</span>
                                <span className="text-xs text-gray-500">({resource.file_type})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={resource.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View
                                </a>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this resource?')) {
                                      supabase.from('resources').delete().eq('id', resource.id).then(() => loadCourse());
                                    }
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lesson Quizzes */}
                    {lesson.quizzes && lesson.quizzes.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Quizzes:</h4>
                        <div className="space-y-2">
                          {lesson.quizzes.map((quiz: any) => (
                            <div key={quiz.id} className="flex items-center justify-between bg-green-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <span className="text-sm font-medium">{quiz.title}</span>
                                <span className="text-xs text-gray-500">({quiz.questions?.length || 0} questions, {quiz.passing_score}% to pass)</span>
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this quiz?')) {
                                    supabase.from('quizzes').delete().eq('id', quiz.id).then(() => loadCourse());
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedLesson(lesson.id);
                        setShowAddResource(true);
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Add Resource
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLesson(lesson.id);
                        setShowAddQuiz(true);
                      }}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                    >
                      Add Quiz
                    </button>
                    <button
                      onClick={() => deleteLesson(lesson.id, lesson.title)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {lessons.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No lessons yet</h3>
              <p className="text-gray-600 mb-4">Start building your course by adding lessons</p>
              <button
                onClick={() => setShowAddLesson(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
              >
                Add First Lesson
              </button>
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Enrolled Students</h2>
          <p className="text-gray-600">Student management coming soon...</p>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Add New Lesson</h2>
                <button onClick={() => setShowAddLesson(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={addLesson} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Title *</label>
                <input type="text" name="title" required className="w-full px-4 py-2 border rounded-md" placeholder="e.g., Introduction to Patient Care" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                <textarea name="content" rows={6} required className="w-full px-4 py-2 border rounded-md" placeholder="Lesson description and content..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL (optional)</label>
                <input type="url" name="video_url" className="w-full px-4 py-2 border rounded-md" placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                <input type="number" name="duration_minutes" required defaultValue={30} min={1} className="w-full px-4 py-2 border rounded-md" />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700">
                  Add Lesson
                </button>
                <button type="button" onClick={() => setShowAddLesson(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Add Resource</h2>
                <button onClick={() => setShowAddResource(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={addResource} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Title *</label>
                <input type="text" name="title" required className="w-full px-4 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File URL *</label>
                <input type="url" name="file_url" required className="w-full px-4 py-2 border rounded-md" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Type *</label>
                <select name="file_type" required className="w-full px-4 py-2 border rounded-md">
                  <option value="PDF">PDF</option>
                  <option value="Document">Document</option>
                  <option value="Video">Video</option>
                  <option value="Image">Image</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">
                  Add Resource
                </button>
                <button type="button" onClick={() => setShowAddResource(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Quiz Modal */}
      {showAddQuiz && (
        <QuizBuilder
          onSubmit={addQuiz}
          onCancel={() => setShowAddQuiz(false)}
        />
      )}

      {/* Add Course Quiz Modal */}
      {showAddCourseQuiz && (
        <QuizBuilder
          onSubmit={addCourseQuiz}
          onCancel={() => setShowAddCourseQuiz(false)}
        />
      )}
    </div>
  );
}
