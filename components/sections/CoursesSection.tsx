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

  const careServices = [
    {
      id: 1,
      title: 'Home Care Services',
      category: 'PERSONAL CARE',
      description: 'Professional in-home care for daily living activities',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 2,
      title: 'Medical Care',
      category: 'HEALTH SERVICES',
      description: 'Licensed nurses and medical professionals',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 3,
      title: 'Dementia Care',
      category: 'SPECIALIZED CARE',
      description: 'Expert care for individuals with dementia',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 4,
      title: 'Companionship',
      category: 'SOCIAL SUPPORT',
      description: 'Friendly companions for social engagement',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 5,
      title: 'Respite Care',
      category: 'CAREGIVER SUPPORT',
      description: 'Temporary relief for family caregivers',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 6,
      title: 'Rehabilitation',
      category: 'RECOVERY SERVICES',
      description: 'Physical and occupational therapy',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 7,
      title: 'Meal Preparation',
      category: 'DAILY SUPPORT',
      description: 'Nutritious meals tailored to dietary needs',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 8,
      title: 'Transportation',
      category: 'MOBILITY SERVICES',
      description: 'Safe transportation to appointments',
      icon: (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    }
  ];

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
                {service.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wide leading-tight">{service.category}</p>
                <h3 className="font-semibold text-gray-900 text-xs group-hover:text-indigo-600 transition-colors line-clamp-1 leading-tight mt-0.5">
                  {service.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
