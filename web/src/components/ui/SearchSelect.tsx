'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
    subtitle?: string;
    avatar?: string;
}

interface SearchSelectProps {
    options: Option[];
    value?: string | number;
    onChange: (value: string | number, option: Option) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    error?: string;
}

export default function SearchSelect({
    options,
    value,
    onChange,
    placeholder = 'Search...',
    label,
    disabled = false,
    error,
}: SearchSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const filtered = options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase()) ||
            opt.subtitle?.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredOptions(filtered);
    }, [search, options]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (option: Option) => {
        onChange(option.value, option);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            {/* Selected Value / Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-4 py-3 
                    border rounded-lg transition-all
                    ${error ? 'border-red-500' : 'border-gray-300'}
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-primary'}
                    ${isOpen ? 'ring-2 ring-primary/20' : ''}
                `}
            >
                <div className="flex items-center gap-2 flex-1 text-left">
                    {selectedOption?.avatar && (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {selectedOption.avatar}
                        </div>
                    )}
                    <div>
                        <div className="text-sm font-medium">
                            {selectedOption?.label || placeholder}
                        </div>
                        {selectedOption?.subtitle && (
                            <div className="text-xs text-gray-500">{selectedOption.subtitle}</div>
                        )}
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded - lg shadow-xl max-h-64 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Type to search..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                autoFocus
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                >
                                    <X size={14} className="text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        w-full flex items-center gap-2 px-4 py-3 text-left
                                        transition-colors hover:bg-primary/5
                                        ${option.value === value ? 'bg-primary/10' : ''}
                                    `}
                                >
                                    {option.avatar && (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {option.avatar}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-medium">{option.label}</div>
                                        {option.subtitle && (
                                            <div className="text-xs text-gray-500">{option.subtitle}</div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
