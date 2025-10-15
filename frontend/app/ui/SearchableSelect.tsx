'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchableSelectProps {
  options: Array<{ id: string | bigint; name: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- Select --',
  label,
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Get selected option name
  const selectedOption = options.find((opt) => String(opt.id) === value);
  const displayValue = selectedOption ? selectedOption.name : '';

  // Filter options based on search term (fuzzy search)
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening dropdown
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(String(filteredOptions[highlightedIndex].id));
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(0);
    } else {
      setSearchTerm('');
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Selected value / trigger */}
      <div
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`
          relative w-full rounded-md border px-4 py-3 text-left
          focus:outline-none focus:ring-1 transition-colors
          ${
            disabled
              ? 'bg-gray-100 cursor-not-allowed border-gray-300'
              : 'bg-white cursor-pointer border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
          }
        `}
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {value && !disabled && (
            <XMarkIcon
              className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer pointer-events-auto mr-1"
              onClick={handleClear}
            />
          )}
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="輸入關鍵字搜尋..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            className="max-h-60 overflow-auto py-1"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500 text-center">
                無符合的選項
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = String(option.id) === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={String(option.id)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(String(option.id))}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      px-4 py-2 cursor-pointer text-sm transition-colors
                      ${isSelected ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'}
                      ${isHighlighted && !isSelected ? 'bg-gray-100' : ''}
                      ${!isSelected && !isHighlighted ? 'hover:bg-gray-50' : ''}
                    `}
                  >
                    {option.name}
                    {isSelected && (
                      <span className="ml-2 text-blue-600">✓</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
