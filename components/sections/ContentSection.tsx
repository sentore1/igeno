import Link from 'next/link';

export default function ContentSection() {
  return (
    <section className="bg-gray-950 text-white py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Block 1 — Care */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-28">
          <div>
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">Care Division</p>
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Professional care management,{' '}
              <span className="text-blue-400">simplified</span>
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              From client onboarding to caregiver scheduling, our Care module handles every step of the care delivery workflow. Reduce admin overhead and focus on what matters — quality care.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Client registration & detailed profiles',
                'Caregiver matching & assignment',
                'Service booking & calendar management',
                'Progress notes & care reports',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/care"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Explore Care Services
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600/10 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Today&apos;s Schedule</span>
                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">Live</span>
              </div>
              {[
                { time: '09:00', client: 'Margaret T.', caregiver: 'Sarah K.', type: 'Home Visit' },
                { time: '11:30', client: 'Robert M.', caregiver: 'James O.', type: 'Therapy' },
                { time: '14:00', client: 'Linda P.', caregiver: 'Anna R.', type: 'Check-in' },
              ].map((row) => (
                <div key={row.time} className="flex items-center gap-4 rounded-xl bg-white/5 px-4 py-3">
                  <span className="text-xs text-blue-300 w-10 flex-shrink-0">{row.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{row.client}</p>
                    <p className="text-xs text-gray-500">{row.caregiver}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">{row.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Block 2 — Academy */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual card first on large screens */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-purple-600/10 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">My Courses</span>
                <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">3 Active</span>
              </div>
              {[
                { title: 'Dementia Care Fundamentals', progress: 72 },
                { title: 'First Aid & Emergency Response', progress: 45 },
                { title: 'Professional Communication', progress: 90 },
              ].map((course) => (
                <div key={course.title} className="rounded-xl bg-white/5 px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-white">{course.title}</p>
                    <span className="text-xs text-purple-300">{course.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-4">Academy Division</p>
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Upskill your team with{' '}
              <span className="text-purple-400">certified training</span>
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Igeno Gate Academy delivers structured learning paths for care professionals. Track progress, issue certificates, and ensure your workforce stays compliant and competent.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Video lessons & downloadable resources',
                'Quizzes, assessments & progress tracking',
                'Professional certificates on completion',
                'Admin oversight of all learner activity',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/academy"
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Explore Academy
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
