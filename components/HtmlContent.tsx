'use client';

import { useEffect, useRef } from 'react';

interface HtmlContentProps {
  html: string;
  className?: string;
}

export default function HtmlContent({ html, className = '' }: HtmlContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && html) {
      // Decode HTML entities using textarea trick
      const textarea = document.createElement('textarea');
      textarea.innerHTML = html;
      const decodedHtml = textarea.value;
      
      // Set the decoded HTML
      contentRef.current.innerHTML = decodedHtml;
    }
  }, [html]);

  return <div ref={contentRef} className={className} />;
}
