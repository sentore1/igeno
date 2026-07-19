'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'What is the Care & Igeno Platform?',
    a: 'It is an integrated platform combining a care management system (for booking caregivers, managing clients, and scheduling services) with a full learning management system (Igeno Gate Academy) for professional training and certification — all under one login.',
  },
  {
    q: 'Who is this platform designed for?',
    a: 'The platform serves care organisations, individual caregivers, clients and their families, training providers, and learners seeking professional development in the care sector.',
  },
  {
    q: 'Can I use only the Care module or only the Academy?',
    a: 'Yes. Both divisions are independently accessible. You can sign up and use only the Care services, only the Academy, or both — your account gives you access to whichever modules your role permits.',
  },
  {
    q: 'How does caregiver assignment work?',
    a: 'When a client books a service, the system matches available caregivers based on skills, location, and schedule. Admins can also manually assign caregivers and manage the full booking lifecycle from the dashboard.',
  },
  {
    q: 'Are the Academy certificates recognised?',
    a: 'Certificates issued through Igeno Gate Academy are generated upon successful course completion and assessment. Recognition depends on the specific course and your organisation\'s requirements — contact us for details on accreditation partnerships.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. The platform is built on Supabase with row-level security, encrypted connections, and role-based access controls. We follow industry best practices to keep your data private and protected.',
  },
  {
    q: 'How do I get started?',
    a: 'Simply create a free account using the Sign Up button. You will be guided through selecting your role and accessing the relevant modules. No credit card is required to start.',
  },
];

export default function FaqsSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-gray-50 py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">FAQs</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          <p className="text-gray-500">Everything you need to know about the platform. Can&apos;t find an answer? Contact our support team.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center transition-transform ${open === i ? 'rotate-45 bg-blue-600 border-blue-600' : ''}`}>
                  <svg className={`w-3 h-3 ${open === i ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
