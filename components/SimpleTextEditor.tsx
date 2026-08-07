'use client';

import { useState } from 'react';

interface SimpleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SimpleTextEditor({ value, onChange, placeholder }: SimpleTextEditorProps) {
  const [text, setText] = useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onChange(newText);
  };

  return (
    <div className="border border-gray-300 rounded-lg">
      <div className="bg-gray-50 border-b px-3 py-2">
        <p className="text-xs text-gray-600">
          Plain text editor - formatting will be preserved as line breaks and spacing
        </p>
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        rows={10}
        className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
      />
    </div>
  );
}
