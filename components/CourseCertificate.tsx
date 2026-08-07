'use client';

import { useRef } from 'react';

interface CourseCertificateProps {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
  finalScore?: number;
}

export default function CourseCertificate({
  studentName,
  courseTitle,
  completionDate,
  certificateNumber,
  finalScore,
}: CourseCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    // In a real implementation, you would use a library like html2canvas or jsPDF
    // to convert the certificate to PDF. For now, we'll just show a message.
    alert('Certificate download feature coming soon! Use browser print for now.');
    window.print();
  };

  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="bg-white border-8 border-double border-purple-600 p-12 max-w-4xl mx-auto"
        style={{ aspectRatio: '1.414/1' }}
      >
        <div className="border-4 border-purple-400 h-full flex flex-col items-center justify-center p-8 text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="text-4xl font-serif text-purple-900 mb-2">
              Certificate of Completion
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-purple-400 to-purple-600 mx-auto"></div>
          </div>

          {/* Body */}
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <p className="text-lg text-gray-700">This is to certify that</p>
            
            <div className="my-4">
              <p className="text-4xl font-bold text-purple-900 mb-2">
                {studentName}
              </p>
              <div className="h-0.5 w-64 bg-gray-400 mx-auto"></div>
            </div>

            <p className="text-lg text-gray-700">has successfully completed</p>

            <p className="text-2xl font-semibold text-gray-800 px-4">
              {courseTitle}
            </p>

            {finalScore && finalScore > 0 && (
              <p className="text-md text-gray-600">
                with a final score of <span className="font-bold">{finalScore.toFixed(1)}%</span>
              </p>
            )}

            <p className="text-md text-gray-600 mt-6">
              Completed on {formattedDate}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-between items-end w-full">
            <div className="text-left">
              <div className="h-0.5 w-32 bg-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">Instructor Signature</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Official Seal</p>
            </div>
            
            <div className="text-right">
              <div className="h-0.5 w-32 bg-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">Date</p>
            </div>
          </div>

          {/* Certificate Number */}
          <div className="mt-6">
            <p className="text-xs text-gray-500">
              Certificate No: {certificateNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center max-w-4xl mx-auto">
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Certificate
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Certificate
        </button>
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${certificateRef.current ? '' : ''}
          .certificate-container,
          .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
