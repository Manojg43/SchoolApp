'use client';

import React, { useEffect, useState } from "react";
import { getStudents, type Student } from "@/lib/api";
import { Download, Award, FileText } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";

export default function CertificatesPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getStudents();
                setStudents(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const columns: Column<Student>[] = [
        { header: "ID", accessorKey: "enrollment_number", className: "w-20 font-mono text-xs" },
        {
            header: "Student",
            accessorKey: (row) => (
                <div>
                    <div className="font-semibold">{row.first_name} {row.last_name}</div>
                    <div className="text-xs text-gray-500">Class: {row.class_name || 'N/A'}</div>
                </div>
            )
        },
        {
            header: "Actions",
            accessorKey: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(`https://schoolapp-6vwg.onrender.com/api/certificates/generate/${row.id}/bonafide/`, '_blank')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                        <Award className="w-3 h-3" /> Bonafide
                    </button>
                    <button
                        onClick={() => window.open(`https://schoolapp-6vwg.onrender.com/api/certificates/generate/${row.id}/character/`, '_blank')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-100 transition-colors"
                    >
                        <FileText className="w-3 h-3" /> Character
                    </button>
                    <button
                        onClick={() => window.open(`https://schoolapp-6vwg.onrender.com/api/certificates/generate/${row.id}/leaving/`, '_blank')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md text-xs font-medium hover:bg-orange-100 transition-colors"
                    >
                        <Download className="w-3 h-3" /> Leaving
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
                    <p className="text-gray-500 text-sm mt-1">Generate and print official documents</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={students}
                    isLoading={loading}
                />
            </div>
        </div>
    );
}
