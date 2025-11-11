
import React, { useState, useEffect } from 'react';

const MarkdownEditor: React.FC = () => {
  const [text, setText] = useState('');

  useEffect(() => {
    const savedText = localStorage.getItem('markdown-editor-text');
    if (savedText) {
      setText(savedText);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    localStorage.setItem('markdown-editor-text', newText);
  };

  return (
    <div className="h-full w-full bg-zinc-800 text-white">
      <textarea
        value={text}
        onChange={handleChange}
        className="h-full w-full p-4 bg-transparent resize-none focus:outline-none font-mono"
        placeholder="Start typing your notes..."
      />
    </div>
  );
};

export default MarkdownEditor;
