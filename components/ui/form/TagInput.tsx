import React, { useState, useRef } from 'react';
import { Icon } from '../Icon';
import type { TagInputProps } from '@/types/ui/form';


export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder = '태그를 입력하고 Enter 또는 쉼표로 구분',
  label,
  required = false,
  disabled = false,
  maxTags,
  className = ''
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  const addTag = () => {
    const tag = inputValue.trim();
    
    if (tag && !tags.includes(tag)) {
      if (!maxTags || tags.length < maxTags) {
        onAddTag(tag);
        setInputValue('');
      }
    }
  };

  const handleBlur = () => {
    // Add tag on blur if there's input
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-color)]">
          {label} {required && '*'}
        </label>
      )}
      
      <div className="w-full min-h-[42px] px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-blue-600 transition-colors"
                  aria-label={`Remove ${tag}`}
                >
                  <Icon name="X" size={14} />
                </button>
              )}
            </span>
          ))}
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={tags.length === 0 ? placeholder : ''}
            disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
            className="flex-1 min-w-[100px] bg-transparent outline-none text-[var(--text-color)] placeholder-gray-400 disabled:cursor-not-allowed"
          />
        </div>
      </div>
      
      {maxTags && (
        <p className="text-xs text-gray-500">
          {tags.length} / {maxTags} 태그
        </p>
      )}
    </div>
  );
}

export default TagInput;