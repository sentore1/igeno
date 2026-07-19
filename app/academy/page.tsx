'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import { Course } from '@/lib/types';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Video Lessons',
    desc: 'High-quality video content',
    icon: (
      <svg className="size-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Resources',
    desc: 'Downloadable materials',
    icon: (
      <svg className="size-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Assessments',
    desc: 'Quizzes and tests',
    icon: (
      <svg className="size-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Certificates',
    desc: 'Professional certification',
    icon: (
      <svg className="size-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

const categories = ['Caregiver Training', 'Nursing Skills', 'Health & Safety', 'Communication', 'Career Development', 'Specialized Care'];

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    const loadCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (data) setCourses(data);
      setLoading(false);
    };
    loadCourses();
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="py-20 md:py-36">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h1 className="mx-auto max-w-2xl text-balance text-4xl font-bold md:text-5xl">
              Igeno Gate Academy
            </h1>
            <p className="mx-auto my-6 max-w-xl text-balance text-xl text-purple-600">
              Professional development and learning for healthcare professionals
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                render={<Link href="/academy/courses" />}
                nativeButton={false}
              >
                Browse Courses
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                render={<Link href="/dashboard" />}
                nativeButton={false}
              >
                My Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold">What We Offer</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-purple-100">
                  {f.icon}
                </div>
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="border-t bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold">Featured Courses</h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="size-10 animate-spin rounded-full border-b-2 border-purple-600" />
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {courses.slice(0, 6).map((course) => (
                <div key={course.id} className="overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md">
                  <div className="h-36 bg-gradient-to-r from-purple-400 to-purple-600" />
                  <div className="p-5">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-600">{course.category}</p>
                    <h3 className="mb-1 font-semibold">{course.title}</h3>
                    <p className="mb-4 line-clamp-2 text-sm text-gray-500">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{course.duration_hours}h</span>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        render={<Link href={`/academy/courses/${course.id}`} />}
                        nativeButton={false}
                      >
                        View Course
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No courses available yet. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold">Course Categories</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/academy/courses?category=${encodeURIComponent(cat)}`}
                className="rounded-xl border p-5 text-center font-semibold text-purple-600 transition-shadow hover:shadow-md hover:bg-purple-50"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-purple-600">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white">Start Learning Today</h2>
          <p className="my-4 text-purple-100">Join thousands of healthcare professionals advancing their careers</p>
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100"
            render={<Link href="/academy/courses" />}
            nativeButton={false}
          >
            Explore All Courses
          </Button>
        </div>
      </section>
    </main>
  );
}
