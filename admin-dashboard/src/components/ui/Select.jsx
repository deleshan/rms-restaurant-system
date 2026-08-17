import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/utils/cn'; 
import { useTheme } from '@/hooks/useTheme';

const Select = forwardRef(({
  label,
  error,
  helperText,
  placeholder = 'Select...',
  options = [],               
  value,
  onChange,
  disabled = false,
  required = false,
  fullWidth = true,
  searchable = false,
  multiple = false,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedValues = multiple 
    ? (Array.isArray(value) ? value : []) 
    : value;

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (option) => {
    if (disabled || option.disabled) return;

    if (multiple) {
      const isSelected = selectedValues.includes(option.value);
      const newValues = isSelected
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      onChange?.(newValues);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const removeValue = (e, valToRemove) => {
    e.stopPropagation();
    onChange?.(selectedValues.filter(v => v !== valToRemove));
  };

  const getLabel = (val) => options.find(opt => opt.value === val)?.label || val;

  const hasError = !!error;

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className={cn(
          'block text-xs font-black uppercase tracking-widest transition-colors',
          hasError ? 'text-rose-500' : (isDark ? 'text-slate-400' : 'text-slate-500'),
          disabled && 'opacity-50'
        )}>
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Trigger */}
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'flex items-center justify-between w-full px-4 py-2.5 text-left border rounded-2xl transition-all duration-300',
            'backdrop-blur-md cursor-pointer',
            isDark 
              ? 'bg-slate-900/40 border-white/10 text-white shadow-lg shadow-black/20' 
              : 'bg-white/60 border-slate-200 text-slate-900 shadow-sm',
            isOpen && (isDark ? 'border-brand/50 ring-4 ring-brand/10' : 'border-brand ring-4 ring-brand/5'),
            hasError && 'border-rose-500 ring-rose-500/10',
            disabled && 'cursor-not-allowed opacity-50 grayscale-[0.5]',
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {multiple && Array.isArray(selectedValues) && selectedValues.length > 0 ? (
              selectedValues.map(val => (
                <span key={val} className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider animate-in zoom-in duration-200",
                  isDark ? "bg-brand/20 text-brand border border-brand/30" : "bg-brand/10 text-brand border border-brand/20"
                )}>
                  {getLabel(val)}
                  <X 
                    size={12} 
                    className="cursor-pointer hover:text-rose-500 transition-colors" 
                    onClick={(e) => removeValue(e, val)}
                  />
                </span>
              ))
            ) : (
              <span className={cn(
                'block truncate text-sm font-medium',
                !value && (isDark ? 'text-slate-500' : 'text-slate-400')
              )}>
                {(!multiple && value) ? getLabel(value) : placeholder}
              </span>
            )}
          </div>

          <ChevronDown className={cn(
            'h-5 w-5 text-slate-400 transition-transform duration-300 shrink-0 ml-2',
            isOpen && 'rotate-180'
          )} />
        </div>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className={cn(
            "absolute z-[100] w-full mt-2 rounded-[2rem] border overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-2xl",
            isDark ? "bg-slate-900/90 border-white/10 shadow-black/60" : "bg-white/95 border-slate-200 shadow-slate-200/50"
          )}>
            {searchable && (
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search options..."
                    className={cn(
                      "w-full pl-9 pr-4 py-2 text-xs font-bold rounded-xl border transition-all uppercase tracking-wider",
                      isDark ? "bg-white/5 border-white/10 text-white focus:border-brand" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-brand"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">No matches found</p>
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = multiple
                    ? selectedValues.includes(option.value)
                    : value === option.value;

                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center justify-between transition-all duration-200 mb-1 last:mb-0',
                        option.disabled ? 'opacity-30 cursor-not-allowed' : '',
                        isSelected 
                          ? (isDark ? 'bg-brand/20 text-brand' : 'bg-brand/10 text-brand')
                          : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-600')
                      )}
                      onClick={() => handleSelect(option)}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p className={cn(
          'text-[11px] font-bold uppercase tracking-wider mt-1 px-1',
          error ? 'text-rose-500' : 'text-slate-400'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;