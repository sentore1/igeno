'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import QuizBuilder from '@/components/QuizBuilder';
import RichTextEditor from '@/components/RichTextEditor';

export default function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [courseResources, setCourseResources] = useState<any[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  
  // Form states
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddCourseQuiz, setShowAddCourseQuiz] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState(30);
  
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdmin();
    fetch('/api/categories')
      .then(r => r.json())
      .then(json => { if (json.categories) setCategories(json.categories); })
      .catch(() => {});
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

    // Load enrollments with profile info
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('*, profiles(full_name, email, phone)')
      .eq('course_id', id)
      .order('enrolled_at', { ascending: false });
    if (enrollData) setEnrollments(enrollData);

    // Load quiz attempts
    const { data: attemptsData } = await supabase
      .from('quiz_attempts')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    if (attemptsData) setQuizAttempts(attemptsData);

    // Load announcements (use course description updates as announcements if no table)
    const { data: announcementsData } = await supabase
      .from('course_announcements')
      .select('*')
      .eq('course_id', id)
      .order('created_at', { ascending: false });
    if (announcementsData) setAnnouncements(announcementsData);

    setLoading(false);
  };

  const postAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) return;
    setPostingAnnouncement(true);
    const { error } = await supabase.from('course_announcements').insert({
      course_id: id,
      title: newAnnouncement.title,
      message: newAnnouncement.message,
    });
    if (error) alert(`Error: ${error.message}`);
    else {
      setNewAnnouncement({ title: '', message: '' });
      loadCourse();
    }
    setPostingAnnouncement(false);
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

    const { error } = await supabase.from('lessons').insert({
      course_id: id,
      title: newLessonTitle,
      content: newLessonContent,
      video_url: newLessonVideoUrl || null,
      duration_minutes: newLessonDuration,
      order_index: lessons.length + 1,
    });

    if (error) {
      alert(`Failed to add lesson: ${error.message}`);
    } else {
      alert('Lesson added successfully!');
      // Reset form
      setNewLessonTitle('');
      setNewLessonContent('');
      setNewLessonVideoUrl('');
      setNewLessonDuration(30);
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
      <div className="border-b mb-6 overflow-x-auto">
        <nav className="flex min-w-max">
          {[
            { key: 'overview',     label: '1. Overview' },
            { key: 'lessons',      label: '2. Lessons',     count: lessons.length },
            { key: 'resources',    label: '3. Resources',   count: courseResources.length },
            { key: 'assessments',  label: '4. Assessments', count: courseQuizzes.length },
            { key: 'learners',     label: '5. Learners',    count: enrollments.length },
            { key: 'progress',     label: '6. Progress' },
            { key: 'announcements',label: '7. Announcements', count: announcements.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}{count !== undefined ? ` (${count})` : ''}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Introduction</label>
              <textarea
                rows={3}
                value={course.introduction || ''}
                onChange={(e) => setCourse({ ...course, introduction: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
                placeholder="Write a brief introduction that welcomes students and gives an overview..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This introduction will be shown to students before they enroll
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (with Rich Formatting)</label>
              <RichTextEditor
                value={course.description}
                onChange={(value) => setCourse({ ...course, description: value })}
                placeholder="Write a detailed description with formatting..."
                minHeight="250px"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the toolbar to format your course description with headings, bold, italic, lists, links, and more
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={course.category}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="">Select a category…</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  {/* Keep the current value selectable even if it was removed from categories */}
                  {course.category && !categories.find(c => c.name === course.category) && (
                    <option value={course.category}>{course.category} (legacy)</option>
                  )}
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
                    <div 
                      className="text-gray-600 mb-3 prose max-w-none" 
                      dangerouslySetInnerHTML={{ __html: lesson.content }}
                    />
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

      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Assessments</h2>
              <p className="text-sm text-gray-600 mt-1">Knowledge quizzes and practical assessments</p>
            </div>
            <button
              onClick={() => setShowAddCourseQuiz(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Assessment
            </button>
          </div>
          {courseQuizzes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p>No assessments added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseQuizzes.map((quiz) => (
                <div key={quiz.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{quiz.title}</h3>
                      {quiz.description && <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        <span>{quiz.questions?.length || 0} questions</span>
                        <span>•</span>
                        <span>{quiz.passing_score}% to pass</span>
                        <span>•</span>
                        <span>{quiz.time_limit_minutes} min</span>
                        <span>•</span>
                        <span>{quiz.max_attempts} attempts</span>
                        {quiz.is_required && <span className="text-red-600 font-semibold">• Required</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => { if (confirm('Delete this assessment?')) supabase.from('course_quizzes').delete().eq('id', quiz.id).then(() => loadCourse()); }}
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

      {/* Learners Tab */}
      {activeTab === 'learners' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Learners</h2>
            <p className="text-sm text-gray-600 mt-1">Enrolled learners, participation, and learner information</p>
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p>No learners enrolled yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 pr-4">Learner</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Progress</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Payment</th>
                    <th className="pb-3">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {enrollments.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-4 font-medium">{e.profiles?.full_name || '—'}</td>
                      <td className="py-3 pr-4 text-gray-600">{e.profiles?.email || '—'}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${e.progress || 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{e.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          e.status === 'completed' ? 'bg-green-100 text-green-700' :
                          e.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{e.status}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          e.payment_status === 'completed' || e.payment_status === 'not_required' ? 'bg-green-100 text-green-700' :
                          e.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{e.payment_status || '—'}</span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">
                        {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Enrolled', value: enrollments.length },
              { label: 'Completed', value: enrollments.filter(e => e.status === 'completed').length },
              { label: 'In Progress', value: enrollments.filter(e => e.status === 'active' && (e.progress || 0) > 0).length },
              { label: 'Avg. Progress', value: enrollments.length ? `${Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length)}%` : '0%' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg shadow-md p-5 text-center">
                <p className="text-3xl font-bold text-purple-600">{value}</p>
                <p className="text-sm text-gray-600 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Learner progress table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Lesson Completion per Learner</h2>
            {enrollments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No learners enrolled yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4">Learner</th>
                      <th className="pb-3 pr-4">Progress</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {enrollments.map((e) => (
                      <tr key={e.id}>
                        <td className="py-3 pr-4 font-medium">{e.profiles?.full_name || '—'}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${e.progress || 0}%` }} />
                            </div>
                            <span className="text-xs font-semibold">{e.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            e.status === 'completed' ? 'bg-green-100 text-green-700' :
                            e.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{e.status}</span>
                        </td>
                        <td className="py-3 text-gray-500 text-xs">
                          {e.completed_at ? new Date(e.completed_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quiz scores */}
          {quizAttempts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Assessment Scores</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4">Learner</th>
                      <th className="pb-3 pr-4">Score</th>
                      <th className="pb-3 pr-4">Result</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quizAttempts.map((a) => (
                      <tr key={a.id}>
                        <td className="py-3 pr-4 font-medium">{a.profiles?.full_name || '—'}</td>
                        <td className="py-3 pr-4 font-semibold">{a.score}%</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>{a.passed ? 'Passed' : 'Failed'}</span>
                        </td>
                        <td className="py-3 text-gray-500 text-xs">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Post Announcement</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Announcement title..."
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
              <textarea
                rows={4}
                placeholder="Write your announcement, reminder, or important update..."
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                className="w-full px-4 py-2 border rounded-md"
              />
              <button
                onClick={postAnnouncement}
                disabled={postingAnnouncement || !newAnnouncement.title.trim() || !newAnnouncement.message.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {postingAnnouncement ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Past Announcements</h2>
            {announcements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No announcements posted yet</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{a.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this announcement?')) supabase.from('course_announcements').delete().eq('id', a.id).then(() => loadCourse()); }}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                <input 
                  type="text" 
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  required 
                  className="w-full px-4 py-2 border rounded-md" 
                  placeholder="e.g., Introduction to Patient Care" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                <RichTextEditor
                  value={newLessonContent}
                  onChange={setNewLessonContent}
                  placeholder="Write your lesson content here. Use the toolbar to format text, add headings, lists, and more..."
                  minHeight="300px"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the toolbar above to format your lesson content with headings, bold, italic, lists, and more.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL (optional)</label>
                <input 
                  type="url" 
                  value={newLessonVideoUrl}
                  onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md" 
                  placeholder="https://youtube.com/watch?v=..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                <input 
                  type="number" 
                  value={newLessonDuration}
                  onChange={(e) => setNewLessonDuration(parseInt(e.target.value))}
                  required 
                  min={1} 
                  className="w-full px-4 py-2 border rounded-md" 
                />
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
