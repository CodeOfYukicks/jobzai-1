/**
 * NoteWidget Component
 * A beautiful paper-style note widget where users can write quick notes
 * 1x1 widget for the Hub dashboard
 */

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { StickyNote } from 'lucide-react';

const STORAGE_KEY = 'hubNoteContent';

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  
  .paper {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 156px;
    background: #fffef0;
    background-image: linear-gradient(#fffef0 1.4rem, #e8e4d4 1.45rem);
    background-size: 100% 1.5rem;
    border-radius: 8px;
    cursor: text;
    padding: 0.3rem 12px 12px 12px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .paper::before,
  .paper::after {
    position: absolute;
    content: "";
    bottom: 8px;
    width: 40%;
    height: 10px;
    box-shadow: 0 5px 14px rgba(0, 0, 0, 0.4);
    z-index: -1;
    transition: all 0.3s ease;
  }
  
  .paper::before {
    left: 12px;
    transform: skew(-5deg) rotate(-5deg);
  }
  
  .paper::after {
    right: 12px;
    transform: skew(5deg) rotate(5deg);
  }
  
  .paper:hover::before,
  .paper:hover::after {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  }
  
  .paper:hover {
    transform: translateY(-2px);
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 4px;
    margin-bottom: 2px;
    border-bottom: 1px dashed #d4d0c0;
  }
  
  .header-icon {
    color: #b8a88a;
  }
  
  .header-title {
    font-size: 11px;
    font-weight: 600;
    color: #8a7e6a;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  .note-textarea {
    width: 100%;
    height: calc(100% - 28px);
    min-height: 110px;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-family: 'Caveat', 'Patrick Hand', 'Segoe Script', cursive;
    font-size: 18px;
    line-height: 1.5rem;
    color: #2c2416;
    padding: 0;
    margin: 0;
    
    /* Align text with lines */
    background-attachment: local;
    
    &::placeholder {
      color: #b8a88a;
      font-style: italic;
    }
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #d4d0c0;
      border-radius: 4px;
    }
  }
  
  .char-count {
    position: absolute;
    bottom: 6px;
    right: 10px;
    font-size: 9px;
    color: #b8a88a;
    font-family: 'Inter', system-ui, sans-serif;
  }
`;

export default function NoteWidget() {
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxChars = 200;

  // Load saved note on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setNote(saved);
      }
    } catch (e) {
      console.error('Error loading note:', e);
    }
  }, []);

  // Save note with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, note);
      } catch (e) {
        console.error('Error saving note:', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [note]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setNote(value);
    }
  };

  const handlePaperClick = () => {
    textareaRef.current?.focus();
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-2xl h-full min-h-[180px]">
      <StyledWrapper>
        <div className="paper" onClick={handlePaperClick}>
          <div className="header">
            <StickyNote className="header-icon w-3 h-3" />
            <span className="header-title">Quick Note</span>
          </div>
          <textarea
            ref={textareaRef}
            className="note-textarea"
            value={note}
            onChange={handleChange}
            placeholder="Write something..."
            spellCheck={false}
          />
          <span className="char-count">{note.length}/{maxChars}</span>
        </div>
      </StyledWrapper>
    </div>
  );
}

