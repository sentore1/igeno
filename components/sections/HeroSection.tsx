import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-12 pt-24 pb-16">
      <div className="max-w-2xl">
        <span className="inline-block text-sm font-medium text-teal-600 mb-6 tracking-wide uppercase">
          Welcome to Healthy Life Environment
        </span>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-tight mb-8">
          Igeno Gate Rwanda
        </h1>

        <p className="text-lg text-gray-600 mb-10 max-w-xl">
          Quality healthcare services and professional development — empowering healthy communities across Rwanda.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-8 py-4 text-base font-semibold text-white transition-all shadow-lg hover:shadow-xl"
          >
            Book Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/care"
            className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-indigo-600 hover:bg-gray-50 px-8 py-4 text-base font-semibold text-gray-700 transition-all"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
