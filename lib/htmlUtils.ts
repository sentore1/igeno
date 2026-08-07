/**
 * Decode HTML entities in a string
 * Converts &lt; to <, &gt; to >, &amp; to &, etc.
 */
export function decodeHtmlEntities(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: use a simple regex approach
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
  
  // Client-side: use textarea for proper decoding
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
}

/**
 * Check if a string contains HTML entities
 */
export function hasHtmlEntities(str: string): boolean {
  return /&[a-z]+;|&#\d+;/i.test(str);
}
