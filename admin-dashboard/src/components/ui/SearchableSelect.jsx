import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * A typeahead dropdown. Same value/onChange/options contract as your
 * existing Select, so it drops in as a direct replacement.
 * options: [{ value, label }]
 */
const SearchableSelect = ({ value, onChange, options, placeholder = '— Select —', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filteredOptions = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            'w-full h-10 px-3 flex items-center justify-between bg-white border border-slate-200 rounded-xl text-sm font-bold text-left focus:outline-none focus:ring-2 focus:ring-indigo-300',
            !selected?.value && 'text-slate-400 font-medium',
            className
          )}
        >
          <span className="truncate">{selected?.value ? selected.label : placeholder}</span>
          <ChevronDown size={15} className="text-slate-400 shrink-0 ml-2" />
        </button>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setIsOpen(false); setQuery(''); }
              if (e.key === 'Enter' && filteredOptions.length > 0) {
                handleSelect(filteredOptions[0]);
              }
            }}
            placeholder="Type to search…"
            className={cn(
              'w-full h-10 pl-8 pr-8 bg-white border-2 border-indigo-300 rounded-xl text-sm font-bold focus:outline-none',
              className
            )}
          />
          <button
            type="button"
            onClick={() => { setIsOpen(false); setQuery(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
          >
            <X size={13} className="text-slate-400" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
          {filteredOptions.length === 0 ? (
            <p className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">No matches</p>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value || 'empty'}
                type="button"
                onClick={() => handleSelect(opt)}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-indigo-50 transition-colors',
                  opt.value === value && 'bg-indigo-50 text-indigo-700'
                )}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;