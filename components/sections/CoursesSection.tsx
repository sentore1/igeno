'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import { Course } from '@/lib/types';

type TabType = 'courses' | 'care-services';

export default function CoursesSection() {
  const [activeTab, setActiveTab] = useState<TabType>('care-services');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (data) setCourses(data);
        setLoading(false);
      });
  }, []);

  const [careServices, setCareServices] = useState<{ id: string; name: string; description: string | null }[]>([]);

  useEffect(() => {
    supabase
      .from('service_types')
      .select('id, name, description')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => { if (data) setCareServices(data); });
  }, []);

  return (
    <section className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('care-services')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'care-services' 
                ? 'text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={activeTab === 'care-services' ? { backgroundColor: '#6469D1' } : {}}
          >
            Care Services
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'courses' 
                ? 'text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={activeTab === 'courses' ? { backgroundColor: '#1992A3' } : {}}
          >
            Available Courses
          </button>
        </div>
        <Link 
          href={activeTab === 'courses' ? '/academy/courses' : '/care'} 
          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
        >
          View all →
        </Link>
      </div>

      {loading && activeTab === 'courses' ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : activeTab === 'courses' && courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No courses published yet.</div>
      ) : activeTab === 'courses' ? (
        <div className="grid grid-cols-2 gap-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/academy/courses/${course.id}`}
              className="group rounded-lg bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] transition-all p-3 flex items-start gap-2 min-h-[80px]"
            >
              <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1992A3' }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wide leading-tight">{course.category}</p>
                <h3 className="font-semibold text-gray-900 text-xs group-hover:text-indigo-600 transition-colors line-clamp-1 leading-tight mt-0.5">
                  {course.title}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{course.duration_hours}h</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {careServices.map((service) => (
            <Link
              key={service.id}
              href="/care/booking"
              className="group rounded-lg bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] transition-all p-3 flex items-start gap-2 min-h-[80px]"
            >
              <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6469D1' }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-xs group-hover:text-indigo-600 transition-colors leading-tight mt-0.5">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">
                    {service.description.split(' ').slice(0, 12).join(' ')}{service.description.split(' ').length > 12 ? '…' : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
