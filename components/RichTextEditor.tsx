'use client';

import { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start typing...',
  minHeight = '200px'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const createList = (type: 'insertUnorderedList' | 'insertOrderedList') => {
    execCommand(type);
  };

  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (rows && cols) {
      const numRows = parseInt(rows);
      const numCols = parseInt(cols);
      
      if (numRows > 0 && numCols > 0 && numRows <= 10 && numCols <= 10) {
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;"><tbody>';
        
        for (let i = 0; i < numRows; i++) {
          tableHTML += '<tr>';
          for (let j = 0; j < numCols; j++) {
            tableHTML += '<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>';
          }
          tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody></table><p><br></p>';
        
        execCommand('insertHTML', tableHTML);
      } else {
        alert('Please enter valid numbers between 1 and 10 for rows and columns');
      }
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b px-3 py-2 flex flex-wrap gap-1">
        {/* Text Style */}
        <div className="flex gap-1 border-r pr-2 mr-1">
          <button
            type="button"
            onClick={() => formatBlock('h1')}
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm font-bold"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => formatBlock('h2')}
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm font-bold"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => formatBlock('h3')}
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm font-bold"
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => formatBlock('p')}
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm"
            title="Paragraph"
          >
            P
          </button>
        </div>

        {/* Text Formatting */}
        <div className="flex gap-1 border-r pr-2 mr-1">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="px-3 py-1 hover:bg-gray-200 rounded font-bold"
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="px-3 py-1 hover:bg-gray-200 rounded italic"
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="px-3 py-1 hover:bg-gray-200 rounded underline"
            title="Underline (Ctrl+U)"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className="px-3 py-1 hover:bg-gray-200 rounded line-through"
            title="Strikethrough"
          >
            S
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r pr-2 mr-1">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="px-2 py-1 hover:bg-gray-200 rounded"
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="px-2 py-1 hover:bg-gray-200 rounded"
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className="px-2 py-1 hover:bg-gray-200 rounded"
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M14 12h6M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r pr-2 mr-1">
          <button
            type="button"
            onClick={() => createList('insertUnorderedList')}
            className="px-2 py-1 hover:bg-gray-200 rounded"
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            •
          </button>
          <button
            type="button"
            onClick={() => createList('insertOrderedList')}
            className="px-2 py-1 hover:bg-gray-200 rounded"
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            1
          </button>
        </div>

        {/* Link */}
        <div className="flex gap-1 border-r pr-2 mr-1">
          <button
            type="button"
            onClick={insertLink}
            className="px-2 py-1 hover:bg-gray-200 rounded"
            title="Insert Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => execCommand('unlink')}
            className="px-2 py-1 hover:bg-gray-200 rounded text-red-600"
            title="Remove Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="flex gap-1 border-r pr-2 mr-1">
          <button
            type="button"
            onClick={insertTable}
            className="px-2 py-1 hover:bg-gray-200 rounded"
            title="Insert Table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Text Color */}
        <div className="flex gap-1 border-r pr-2 mr-1">
          <input
            type="color"
            onChange={(e) => execCommand('foreColor', e.target.value)}
            className="w-8 h-8 cursor-pointer rounded border-0"
            title="Text Color"
          />
        </div>

        {/* Clear Formatting */}
        <div className="flex gap-1 border-l pl-2 ml-1">
          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
            className="px-2 py-1 hover:bg-gray-200 rounded text-xs text-gray-600"
            title="Clear Formatting"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full px-4 py-3 focus:outline-none prose max-w-none rich-text-editor ${
          isFocused ? 'ring-2 ring-blue-500 ring-inset' : ''
        }`}
        style={{ minHeight }}
        suppressContentEditableWarning
      />
      
      {!value && !isFocused && (
        <div className="absolute top-14 left-4 text-gray-400 pointer-events-none">
          {placeholder}
        </div>
      )}

      {/* Add global table styles using style tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
          }
          .rich-text-editor table td,
          .rich-text-editor table th {
            border: 1px solid #ddd;
            padding: 8px;
            min-width: 50px;
          }
          .rich-text-editor table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .rich-text-editor table tr:hover {
            background-color: #f5f5f5;
          }
        `
      }} />
    </div>
  );
}
