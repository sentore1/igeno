import Link from 'next/link';
import { createClient } from '@/lib/supabase';

// Server component — params is a Promise in Next.js 15+
export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = await createClient();

  const { data: cert, error } = await supabase
    .from('certificate_codes')
    .select('code, holder_name, course_title, issued_date, is_active')
    .eq('code', code.toLowerCase())
    .maybeSingle();

  const valid   = !error && cert !== null && cert.is_active;
  const revoked = !error && cert !== null && !cert.is_active;

  // Solid colours — no gradients
  const bannerBg = valid   ? '#5B21B6' :   // deep purple-800
                   revoked ? '#C2410C' :   // orange-700
                             '#B91C1C';    // red-700

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
         style={{ backgroundColor: '#F3F0FF' }}>

      {/* Brand bar */}
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ backgroundColor: '#5B21B6' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="font-bold text-lg group-hover:opacity-80 transition"
              style={{ color: '#3B0764' }}>
          iGenoGate
        </span>
      </Link>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
           style={{ border: '1px solid #DDD6FE' }}>

        {/* Status banner — solid colour, no gradient */}
        <div className="px-8 py-6" style={{ backgroundColor: bannerBg }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                 style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
              {valid ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest"
                 style={{ color: 'rgba(255,255,255,0.75)' }}>
                Certificate Verification
              </p>
              <p className="text-white text-2xl font-bold mt-0.5">
                {valid ? 'Valid Certificate' : revoked ? 'Certificate Revoked' : 'Not Found'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          {valid && cert ? (
            <div className="space-y-5">
              <Row label="Certificate Code">
                <span className="font-mono font-bold text-gray-900 px-2 py-1 rounded text-sm"
                      style={{ backgroundColor: '#EDE9FE' }}>
                  {cert.code}
                </span>
              </Row>
              <Row label="Issued To">
                <span className="font-semibold text-gray-900">{cert.holder_name}</span>
              </Row>
              <Row label="Course / Certification">
                <span className="text-gray-800">{cert.course_title}</span>
              </Row>
              <Row label="Issue Date">
                <span className="text-gray-800">
                  {new Date(cert.issued_date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </Row>

              <div className="pt-4 border-t" style={{ borderColor: '#EDE9FE' }}>
                <div className="flex items-center gap-2" style={{ color: '#6D28D9' }}>
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-semibold">
                    This certificate has been verified as authentic by iGenoGate.
                  </p>
                </div>
              </div>
            </div>
          ) : revoked ? (
            <div className="space-y-4">
              <Row label="Certificate Code">
                <span className="font-mono font-bold text-gray-900 px-2 py-1 rounded text-sm"
                      style={{ backgroundColor: '#EDE9FE' }}>
                  {cert!.code}
                </span>
              </Row>
              <div className="rounded-lg p-4"
                   style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                <p className="text-sm font-medium text-orange-800">
                  This certificate has been revoked and is no longer valid.
                  Please contact iGenoGate if you believe this is an error.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg p-4"
                   style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                <p className="text-sm font-medium text-red-800">
                  No certificate was found for code{' '}
                  <span className="font-mono font-bold">"{code}"</span>.
                  Please check the code and try again.
                </p>
              </div>
              <p className="text-xs text-gray-500">
                If you received a verification link, make sure you are using the exact link provided.
                Certificate codes are case-insensitive.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 flex items-center justify-between"
             style={{ backgroundColor: '#F5F3FF', borderTop: '1px solid #DDD6FE' }}>
          <p className="text-xs" style={{ color: '#7C3AED' }}>
            Verified on {new Date().toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
          <Link href="/" className="text-xs font-semibold transition hover:opacity-70"
                style={{ color: '#5B21B6' }}>
            iGenoGate.com →
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-center max-w-sm" style={{ color: '#7C3AED' }}>
        This page is provided by iGenoGate to allow employers and institutions to verify
        the authenticity of certificates issued by our platform.
      </p>
    </div>
  );
}

/* Label / value row helper */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <p className="text-xs font-semibold uppercase tracking-wider sm:w-40 shrink-0 pt-0.5"
         style={{ color: '#8B5CF6' }}>
        {label}
      </p>
      <div className="flex-1">{children}</div>
    </div>
  );
}
