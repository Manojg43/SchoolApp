"use client";

import React from 'react';
import { Search, Filter, Plus, FileDown } from 'lucide-react';

interface FilterBarProps {
    onSearch: (query: string) => void;
    onFilterChange?: (key: string, value: string) => void;
    onAdd?: () => void;
    onExport?: () => void;
    filters?: { key: string; label: string; options: { label: string; value: string }[] }[];
    searchPlaceholder?: string;
}

export default function FilterBar({
    onSearch,
    onFilterChange,
    onAdd,
    onExport,
    filters = [],
    searchPlaceholder = "Search records..."
}: FilterBarProps) {
    return (
        <div className="sticky top-16 z-20 bg-white border-b px-6 py-4 flex flex-col md:flex-row gap-4 items-end md:items-center shadow-sm">
            {/* Search - Full Width on Mobile, Flexible on Desktop */}
            <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder={searchPlaceholder}
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {filters.map((filter) => (
                    <select
                        key={filter.key}
                        className="block w-32 pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    >
                        <option value="">{filter.label}</option>
                        {filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ))}

                {/* Advanced Filter Toggle (Visual only for now) */}
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                    <Filter className="h-4 w-4 mr-2" />
                    More
                </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {onExport && (
                    <button
                        onClick={onExport}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                    </button>
                )}

                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New
                    </button>
                )}
            </div>
        </div>
    );
}
