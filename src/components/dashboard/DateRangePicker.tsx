// src/components/dashboard/DateRangePicker.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

interface DateRangePickerProps {
  value: string;
  onChange: (range: string, customStart?: Date, customEnd?: Date) => void;
  customStart?: Date | null;
  customEnd?: Date | null;
}

export const DateRangePicker = ({ value, onChange, customStart, customEnd }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  
  // Initialize temp dates from props when in custom mode
  const getInitialStartDate = () => {
    if (value === 'custom' && customStart) {
      return customStart.toISOString().split('T')[0];
    }
    return '';
  };
  
  const getInitialEndDate = () => {
    if (value === 'custom' && customEnd) {
      return customEnd.toISOString().split('T')[0];
    }
    return '';
  };
  
  const [tempStartDate, setTempStartDate] = useState(getInitialStartDate);
  const [tempEndDate, setTempEndDate] = useState(getInitialEndDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7', label: 'Last 7 Days' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const getDisplayLabel = () => {
    if (value === 'custom' && customStart && customEnd) {
      return `${customStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${customEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return options.find(opt => opt.value === value)?.label || 'Last 30 Days';
  };

  const handleSelectOption = (optionValue: string) => {
    if (optionValue === 'custom') {
      setShowCustom(true);
      // Initialize with current custom dates if available, otherwise use today
      if (customStart && customEnd) {
        setTempStartDate(customStart.toISOString().split('T')[0]);
        setTempEndDate(customEnd.toISOString().split('T')[0]);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setTempStartDate(today);
        setTempEndDate(today);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setShowCustom(false);
    }
  };

  const handleApplyCustom = () => {
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);
      
      if (start <= end) {
        onChange('custom', start, end);
        setIsOpen(false);
        setShowCustom(false);
      } else {
        alert('Start date must be before end date');
      }
    }
  };

  const handleCancelCustom = () => {
    setShowCustom(false);
    // Reset to current custom dates if they exist
    if (value === 'custom' && customStart && customEnd) {
      setTempStartDate(customStart.toISOString().split('T')[0]);
      setTempEndDate(customEnd.toISOString().split('T')[0]);
    } else {
      setTempStartDate('');
      setTempEndDate('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 transition-colors bg-white hover:bg-gray-50"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-gray-700">{getDisplayLabel()}</span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50">
          {!showCustom ? (
            <div className="p-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    value === option.value && option.value !== 'custom'
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                  {value === option.value && option.value !== 'custom' && (
                    <span className="ml-2 text-amber-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Custom Date Range</h3>
                <button
                  onClick={handleCancelCustom}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCancelCustom}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCustom}
                  disabled={!tempStartDate || !tempEndDate}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};