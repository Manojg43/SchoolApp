'use client';

import React, { useEffect, useState } from "react";
import { getStudents, type Student } from "@/lib/api";
import { Download, Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext"; // Added useAuth
import FilterBar from "@/components/ui/FilterBar";
import DataTable, { Column } from "@/components/ui/DataTable";
import KPICard from "@/components/ui/KPICard";

export default function StudentList() {
    const { t } = useLanguage();
    const { hasPermission } = useAuth(); // Destructure hasPermission
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("");

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

    // Derived Data
    const filtered = students.filter(s => {
        const matchesSearch =
            s.first_name.toLowerCase().includes(search.toLowerCase()) ||
            s.last_name.toLowerCase().includes(search.toLowerCase()) ||
            s.enrollment_number.includes(search);

        // Mock Class Filter logic (Since API returns flat list currently)
        // In real app, we'd filter by s.current_class_id
        const matchesClass = classFilter ? true : true;

        return matchesSearch && matchesClass;
    });

    const columns: Column<Student>[] = [
        { header: "ID", accessorKey: "enrollment_number", className: "w-24 font-mono text-xs" },
        {
            header: "Student Name",
            accessorKey: (row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.first_name} {row.last_name}</div>
                    <div className="text-xs text-gray-500">{row.father_name}</div>
                </div>
            )
        },
        { header: "Gender", accessorKey: "gender", className: "w-20" },
        { header: "DOB", accessorKey: "date_of_birth", className: "w-32" },
        {
            header: "Status",
            accessorKey: (row) => (
                <span className={`px - 2 inline - flex text - xs leading - 5 font - semibold rounded - full ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} `}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
    ];

    // Mock KPI Data
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.is_active).length;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard label="Total Students" value={totalStudents} trend={{ value: 12, isPositive: true }} />
                <KPICard label="Active Students" value={activeStudents} color="success" />
                <KPICard label="New Admissions" value={5} color="primary" />
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Student Directory</h2>
                </div>

                <FilterBar
                    onSearch={setSearch}
                    onFilterChange={(key, val) => setClassFilter(val)}
                    filters={[
                        {
                            key: 'class',
                            label: 'All Classes',
                            options: [
                                { label: 'Class 1', value: '1' },
                                { label: 'Class 2', value: '2' },
                            ]
                        }
                    ]}
                    onAdd={() => alert("Add Student Modal Placeholder")}
                />

                <DataTable
                    columns={columns}
                    data={filtered}
                    isLoading={loading}
                    onEdit={hasPermission(['is_superuser', 'can_access_student_records']) ? (row) => alert(`Edit ${row.first_name}`) : undefined}
                    onDelete={hasPermission(['is_superuser', 'can_access_student_records']) ? (row) => {
                        if (confirm("Are you sure?")) alert(`Delete ${row.first_name}`); // Placeholder
                    } : undefined}
                    onView={(row) => window.open(`http://127.0.0.1:8000/api/certificates/generate/${row.id}/bonafide/`, '_blank')}
                />
            </div >
        </div >
    );
}
