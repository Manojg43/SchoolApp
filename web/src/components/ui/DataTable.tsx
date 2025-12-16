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
}

export default function DataTable<T extends { id: number | string }>({
    columns,
    data,
    onRowClick,
    onEdit,
    onDelete,
    onView,
    isLoading
}: DataTableProps<T>) {

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading data...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-gray-500">No records found.</div>;
    }

    return (
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
                            className="hover:bg-blue-50/50 transition-colors cursor-pointer"
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

                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                {onView && (
                                    <button onClick={() => onView(row)} className="text-secondary hover:text-blue-800 p-1 rounded-full hover:bg-blue-100">
                                        <Eye className="h-4 w-4" />
                                    </button>
                                )}
                                {onEdit && (
                                    <button onClick={() => onEdit(row)} className="text-secondary hover:text-blue-800 p-1 rounded-full hover:bg-blue-100">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button onClick={() => onDelete(row)} className="text-error hover:text-red-800 p-1 rounded-full hover:bg-red-100">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
