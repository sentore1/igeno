'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import { Course } from '@/lib/types';
import EnhancedCourseForm from '@/components/EnhancedCourseForm';

export default function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'resources' | 'quizzes'>('details');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Caregiver Training',
    duration_hours: 10,
    is_published: false,
    youtube_url: '',
    prerequisites: '',
  });
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [learningOutcome, setLearningOutcome] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
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

    loadCourses();
  };

  const loadCourses = async () => {
    let query = supabase.from('courses').select('*');

    if (filter === 'published') {
      query = query.eq('is_published', true);
    } else if (filter === 'unpublished') {
      query = query.eq('is_published', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (data) setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) loadCourses();
  }, [filter]);

  const togglePublished = async (courseId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: !currentStatus })
      .eq('id', courseId);

    if (error) {
      alert('Failed to update course');
      return;
    }

    loadCourses();
  };

  const deleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      alert('Failed to delete course');
      return;
    }

    loadCourses();
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to create a course');
        return;
      }

      // Create the course with new fields
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          ...formData,
          instructor_id: session.user.id,
          learning_outcomes: learningOutcomes,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Add resources if any
      if (resources.length > 0) {
        const resourcesData = resources.map((resource, index) => ({
          course_id: course.id,
          ...resource,
          order_index: index,
        }));

        const { error: resourcesError } = await supabase
          .from('course_resources')
          .insert(resourcesData);

        if (resourcesError) console.error('Resource error:', resourcesError);
      }

      // Add quizzes if any
      if (quizzes.length > 0) {
        const quizzesData = quizzes.map((quiz, index) => ({
          course_id: course.id,
          ...quiz,
          order_index: index,
        }));

        const { error: quizzesError } = await supabase
          .from('course_quizzes')
          .insert(quizzesData);

        if (quizzesError) console.error('Quiz error:', quizzesError);
      }

      alert('Course created successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'Caregiver Training',
        duration_hours: 10,
        is_published: false,
        youtube_url: '',
        prerequisites: '',
      });
      setLearningOutcomes([]);
      setResources([]);
      setQuizzes([]);
      setActiveTab('details');
      loadCourses();
    } catch (err: any) {
      alert(`Failed to create course: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Course Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Course
          </button>
          <Link
            href="/dashboard/admin"
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to Admin Dashboard
          </Link>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
                  <p className="text-sm text-gray-600 mt-1">Add details, resources, videos, PDFs, and quizzes</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6">
              <EnhancedCourseForm
                formData={formData}
                setFormData={setFormData}
                learningOutcomes={learningOutcomes}
                setLearningOutcomes={setLearningOutcomes}
                resources={resources}
                setResources={setResources}
                quizzes={quizzes}
                setQuizzes={setQuizzes}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />

              <div className="mt-8 flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Course
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {['all', 'published', 'unpublished'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'All Courses' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Course Image */}
            <div className="h-40 bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
              <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            {/* Course Info */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-purple-600">{course.category}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  course.is_published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {course.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-2 line-clamp-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{course.duration_hours} hours</span>
                <span>{new Date(course.created_at).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/admin/courses/${course.id}`}
                  className="flex-1 px-4 py-2 text-center bg-purple-100 text-purple-700 rounded-md text-sm font-semibold hover:bg-purple-200"
                >
                  Edit
                </Link>
                <Link
                  href={`/academy/courses/${course.id}`}
                  className="flex-1 px-4 py-2 text-center bg-blue-100 text-blue-700 rounded-md text-sm font-semibold hover:bg-blue-200"
                >
                  View
                </Link>
                <button
                  onClick={() => togglePublished(course.id, course.is_published)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold ${
                    course.is_published
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {course.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => deleteCourse(course.id, course.title)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-semibold hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No courses found</h3>
          <p className="text-gray-600 mb-4">Get started by adding some sample courses</p>
          <button
            onClick={() => alert('To add sample courses:\n\n1. Open Supabase SQL Editor\n2. Run scripts/seed-sample-data.sql\n\nThis will add 10 sample courses to your database.')}
            className="px-6 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
          >
            Add Sample Courses
          </button>
        </div>
      )}

      {/* Summary */}
      {courses.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {courses.filter(c => c.is_published).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-600">
                {courses.filter(c => !c.is_published).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
