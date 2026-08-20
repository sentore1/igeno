'use client';

import { useRef, useState } from 'react';

interface LessonModule {
  title: string;
  category?: string;
}

interface CourseCertificateProps {
  studentName: string;
  courseTitle: string;
  courseDescription?: string;
  certificateTitle?: string;
  certificateSubtitle?: string;
  completionDate: string;       // ISO string
  enrollmentDate?: string;      // ISO string — course start date
  certificateNumber: string;
  lessons: LessonModule[];
  finalScore?: number;
}

/** Format a date as e.g. "5th January 2026" */
function formatOrdinalDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? 'st'
      : day === 2 || day === 22
      ? 'nd'
      : day === 3 || day === 23
      ? 'rd'
      : 'th';
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

/** Group flat lesson list into categories (uses lesson.category if present, else one group) */
function groupLessons(lessons: LessonModule[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const l of lessons) {
    const cat = l.category || 'Course Modules';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(l.title);
  }
  return groups;
}

export default function CourseCertificate({
  studentName,
  courseTitle,
  courseDescription,
  certificateTitle,
  certificateSubtitle,
  completionDate,
  enrollmentDate,
  certificateNumber,
  lessons,
  finalScore,
}: CourseCertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const formattedCompletion = formatOrdinalDate(completionDate);
  const formattedEnrollment = enrollmentDate ? formatOrdinalDate(enrollmentDate) : null;
  const grouped = groupLessons(lessons);
  const groupEntries = Object.entries(grouped);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const canvas = await html2canvas(certRef.current, {
        scale: 3,           // high resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      // A4 landscape: 297 x 210 mm
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
      pdf.save(`Certificate-${studentName.replace(/\s+/g, '_')}-${courseTitle.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Download failed:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Load Google script font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Roboto:wght@700&display=swap');
        @media print {
          body > *:not(#cert-print-root) { display: none !important; }
          #cert-print-root { display: block !important; }
        }
      `}</style>

      {/* ── Certificate card ── */}
      <div
        ref={certRef}
        className="relative w-full bg-white overflow-hidden select-none"
        style={{ aspectRatio: '1400/990', maxWidth: '900px', margin: '0 auto' }}
      >
        {/* Background template image */}
        <img
          src="/certificate template.png"
          alt=""
          className="absolute inset-0 w-full h-full object-fill"
          crossOrigin="anonymous"
        />

        {/* ── Overlay content ── */}
        <div className="absolute inset-0" style={{ fontFamily: 'Georgia, serif' }}>

          {/* Certificate title overlay — two lines */}
          {certificateTitle && (
            <div
              className="absolute text-center w-full"
              style={{
                top: '6%',
                padding: '0 35%',
                lineHeight: 1.15,
              }}
            >
              {certificateTitle.split(' ').map((word, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 'clamp(14px, 2.8vw, 32px)',
                    fontFamily: '"Roboto", sans-serif',
                    fontWeight: '700',
                    color: '#0d0d0d',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {word}
                </div>
              ))}
            </div>
          )}

          {/* Date range row — sits just below "This is to certify that" */}
          <div
            className="absolute text-center w-full"
            style={{ top: '20%', fontSize: 'clamp(8px, 1.3vw, 14px)', color: '#1a1a1a' }}
          >
            {formattedEnrollment
              ? `from ${formattedEnrollment} to ${formattedCompletion}`
              : `Completed on ${formattedCompletion}`}
          </div>

          {/* "This certificate certifies that" — above the name */}
          <div
            className="absolute text-center w-full"
            style={{
              top: '24%',
              fontSize: 'clamp(7px, 1vw, 12px)',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: '#333',
              letterSpacing: '0.03em',
            }}
          >
            This certificate certifies that
          </div>

          {/* Student name — script font, moved below the dashed line */}
          <div
            className="absolute text-center w-full"
            style={{
              top: '28%',
              fontSize: 'clamp(22px, 5vw, 58px)',
              fontFamily: '"Great Vibes", cursive',
              fontWeight: '400',
              color: '#0d0d0d',
              letterSpacing: '0.02em',
              lineHeight: 1.1,
            }}
          >
            {studentName}
          </div>

          {/* Course title — short subtitle below the name */}
          <div
            className="absolute text-center w-full"
            style={{
              top: '37%',
              fontSize: 'clamp(7px, 1.1vw, 13px)',
              fontFamily: 'Arial, sans-serif',
              fontWeight: '600',
              color: '#1992A3',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '0 8%',
              lineHeight: 1.3,
            }}
          >
            {courseTitle}
          </div>

          {/* Certificate subtitle — below the student name */}
          {certificateSubtitle && (
            <div
              className="absolute text-center w-full"
              style={{
                top: '40%',
                fontSize: 'clamp(8px, 1.2vw, 14px)',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: '#333',
                padding: '0 15%',
                lineHeight: 1.3,
              }}
            >
              {certificateSubtitle}
            </div>
          )}


          {/* ── Module grid ── */}
          <div
            className="absolute"
            style={{
              top: '45%',
              left: '4%',
              right: '4%',
              bottom: '22%',
              display: 'grid',
              gridTemplateColumns: groupEntries.length === 1 ? '1fr' : '1fr 1fr',
              gap: 'clamp(4px, 0.8%, 10px)',
              alignContent: 'start',
            }}
          >
            {groupEntries.map(([category, items], idx) => (
              <div
                key={idx}
                style={{
                  border: '1.5px solid #1992A3',
                  borderRadius: '6px',
                  padding: 'clamp(4px, 1%, 10px)',
                  background: 'rgba(255,255,255,0.85)',
                }}
              >
                {/* Category header */}
                <div
                  style={{
                    background: 'rgba(25,146,163,0.12)',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    marginBottom: '4px',
                    fontSize: 'clamp(6px, 0.9vw, 10px)',
                    fontWeight: '700',
                    color: '#0e7a88',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {category}
                </div>
                {/* Lesson list */}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {items.map((title, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '4px',
                        fontSize: 'clamp(5px, 0.85vw, 10px)',
                        color: '#1a1a1a',
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: 1.4,
                        padding: '1px 0',
                      }}
                    >
                      <span style={{ color: '#1992A3', fontSize: '0.9em', marginTop: '1px', flexShrink: 0 }}>✔</span>
                      <span>{title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Final score (optional) */}
          {finalScore !== undefined && finalScore > 0 && (
            <div
              className="absolute"
              style={{
                bottom: '19%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 'clamp(6px, 0.9vw, 11px)',
                color: '#555',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              Final Score: <strong>{finalScore.toFixed(1)}%</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-3 justify-center" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#1992A3' }}
        >
          {downloading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating PDF…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Certificate (PDF)
            </>
          )}
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>
    </div>
  );
}
