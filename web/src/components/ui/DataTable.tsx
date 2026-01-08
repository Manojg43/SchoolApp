"use client";

import React from 'react';
import { Edit2, Eye, Trash2, MoreVertical } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | ((row: T) => React.ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onView?: (row: T) => void;
    isLoading?: boolean;
    pagination?: {
        currentPage: number;
        hasNext: boolean;
        hasPrevious: boolean;
        onNext: () => void;
        onPrevious: () => void;
    };
}

export default function DataTable<T extends { id: number | string }>({
    columns,
    data,
    onRowClick,
    onEdit,
    onDelete,
    onView,
    isLoading,
    pagination
}: DataTableProps<T>) {
    const [openMenuId, setOpenMenuId] = React.useState<number | string | null>(null);

    React.useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleMenu = (e: React.MouseEvent, id: number | string) => {
        e.stopPropagation();
        setOpenMenuId(prev => prev === id ? null : id);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading data...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-gray-500">No records found.</div>;
    }

    return (
        <React.Fragment>
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left">
                                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                            </th>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row)}
                                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                                </td>

                                {columns.map((col, idx) => (
                                    <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {typeof col.accessorKey === 'function'
                                            ? col.accessorKey(row)
                                            : (row[col.accessorKey] as React.ReactNode)}
                                    </td>
                                ))}

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                    <div className="relative inline-block text-left">
                                        <button
                                            onClick={(e) => toggleMenu(e, row.id)}
                                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </button>

                                        {openMenuId === row.id && (
                                            <div className="absolute right-0 z-20 mt-1 w-32 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in duration-75">
                                                {onView && (
                                                    <button
                                                        onClick={() => onView(row)}
                                                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4 text-gray-500" /> View
                                                    </button>
                                                )}
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(row)}
                                                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <Edit2 className="mr-2 h-4 w-4 text-secondary" /> Edit
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(row)}
                                                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {
                pagination && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-0">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Page <span className="font-medium">{pagination.currentPage}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={pagination.onPrevious}
                                        disabled={!pagination.hasPrevious}
                                        className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${!pagination.hasPrevious ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={pagination.onNext}
                                        disabled={!pagination.hasNext}
                                        className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${!pagination.hasNext ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )
            }
        </React.Fragment >
    );
}
