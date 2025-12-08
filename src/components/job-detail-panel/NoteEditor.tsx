import { useState, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

interface NoteEditorProps {
  onSave: (content: string) => void;
  placeholder?: string;
}

export const NoteEditor = ({ onSave, placeholder = "Take a note..." }: NoteEditorProps) => {
  const [content, setContent] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: 'bold' | 'italic' | 'underline' | 'bullet' | 'numbered' | 'link') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        newText = content.substring(0, start) + `**${selectedText || 'bold text'}**` + content.substring(end);
        cursorOffset = selectedText ? 2 : 11; // Position cursor after **
        setIsBold(!isBold);
        break;
      case 'italic':
        newText = content.substring(0, start) + `*${selectedText || 'italic text'}*` + content.substring(end);
        cursorOffset = selectedText ? 1 : 12;
        setIsItalic(!isItalic);
        break;
      case 'underline':
        newText = content.substring(0, start) + `<u>${selectedText || 'underlined text'}</u>` + content.substring(end);
        cursorOffset = selectedText ? 3 : 18;
        setIsUnderline(!isUnderline);
        break;
      case 'bullet':
        const bulletText = selectedText || 'List item';
        newText = content.substring(0, start) + `\n• ${bulletText}` + content.substring(end);
        cursorOffset = bulletText.length + 3;
        break;
      case 'numbered':
        const numberedText = selectedText || 'List item';
        newText = content.substring(0, start) + `\n1. ${numberedText}` + content.substring(end);
        cursorOffset = numberedText.length + 4;
        break;
      case 'link':
        const linkText = selectedText || 'link text';
        newText = content.substring(0, start) + `[${linkText}](url)` + content.substring(end);
        cursorOffset = linkText.length + 3;
        break;
      default:
        return;
    }

    setContent(newText);
    
    // Set cursor position after format is applied
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPosition = start + cursorOffset;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
      setContent('');
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="border border-gray-200 dark:border-[#3d3c3e] rounded-xl overflow-hidden bg-white dark:bg-[#2b2a2c]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325]/50">
        <button
          onClick={() => applyFormat('bold')}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d3c3e] transition-colors ${
            isBold ? 'bg-gray-200 dark:bg-[#3d3c3e]' : ''
          }`}
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Bold className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
        
        <button
          onClick={() => applyFormat('italic')}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d3c3e] transition-colors ${
            isItalic ? 'bg-gray-200 dark:bg-[#3d3c3e]' : ''
          }`}
          title="Italic (Ctrl+I)"
          type="button"
        >
          <Italic className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
        
        <button
          onClick={() => applyFormat('underline')}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d3c3e] transition-colors ${
            isUnderline ? 'bg-gray-200 dark:bg-[#3d3c3e]' : ''
          }`}
          title="Underline (Ctrl+U)"
          type="button"
        >
          <Underline className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-[#4a494b] mx-1" />

        <button
          onClick={() => applyFormat('bullet')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d3c3e] transition-colors"
          title="Bullet List"
          type="button"
        >
          <List className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
        
        <button
          onClick={() => applyFormat('numbered')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d3c3e] transition-colors"
          title="Numbered List"
          type="button"
        >
          <ListOrdered className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-[#4a494b] mx-1" />

        <button
          onClick={() => applyFormat('link')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d3c3e] transition-colors"
          title="Insert Link"
          type="button"
        >
          <LinkIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full min-h-[200px] p-4 bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none"
      />

      {/* Footer with Save Button */}
      <div className="flex items-center justify-end p-3 border-t border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325]/50">
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
};


