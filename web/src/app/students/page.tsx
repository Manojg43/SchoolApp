'use client';

import React, { useEffect, useState } from "react";
import { getStudents, deleteStudent, getClasses, type Student, type ClassItem } from "@/lib/api"; // Added imports
import { Download, Plus, Edit, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import FilterBar from "@/components/ui/FilterBar";
import DataTable, { Column } from "@/components/ui/DataTable";
import KPICard from "@/components/ui/KPICard";
import StudentFormModal from "@/components/students/StudentFormModal"; // Import Modal

export default function StudentList() {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();
    console.log("Rendering StudentList Page [Force Update]");
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]); // State for Classes
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

    async function loadData() {
        setLoading(true);
        try {
            const [sData, cData] = await Promise.all([getStudents(), getClasses()]);
            // Ensure sData is an array before setting
            if (Array.isArray(sData)) {
                setStudents(sData);
            } else {
                console.error("Invalid student data received:", sData);
                // alert("Failed to load students: Invalid data format."); // Optional, maybe too noisy
            }
            if (Array.isArray(cData)) {
                setClasses(cData);
            }
        } catch (e: unknown) {
            console.error(e);
            const msg = e instanceof Error ? e.message : 'Unknown Error';
            alert(`Failed to load data: ${msg}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Handlers
    const handleAdd = () => {
        setStudentToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (student: Student) => {
        setStudentToEdit(student);
        setIsModalOpen(true);
    };

    const handleDelete = async (student: Student) => {
        if (!confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) return;
        try {
            await deleteStudent(student.id);
            setStudents(prev => prev.filter(s => s.id !== student.id)); // Optimistic update
        } catch (e) {
            console.error(e);
            alert("Failed to delete student.");
        }
    };

    const handleSuccess = () => {
        loadData(); // Refresh list after save
    };

    // Derived Data
    const filtered = students.filter(s => {
        const matchesSearch =
            s.first_name.toLowerCase().includes(search.toLowerCase()) ||
            s.last_name.toLowerCase().includes(search.toLowerCase()) ||
            s.enrollment_number.includes(search);

        // Class Filter Logic
        // Note: s.class_name is string from Serializer. API response might differ if we use IDs.
        // Let's assume classFilter is the ID (string), and student has current_class (ID) or class_name.
        // Safe check: match ID or Name if filter is name.
        // Actually, API returns `current_class` (ID) and `class_name` (Str). 
        // FilterBar returns `val` which is ID from options.
        // Type safe access to current_class (might be number or missing in old data, use unknown cast safety)
        const matchesClass = classFilter ? String((s as unknown as { current_class: number }).current_class) === classFilter : true;

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
        { header: "Class", accessorKey: "class_name", className: "w-24" }, // Added Class Column
        { header: "Gender", accessorKey: "gender", className: "w-20" },
        { header: "DOB", accessorKey: "date_of_birth", className: "w-32" },
        {
            header: "Status",
            accessorKey: (row) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
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
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Student Directory</h2>
                    {/* Permission Guard for Add Button could go here or inside FilterBar */}
                </div>

                <FilterBar
                    onSearch={setSearch}
                    onFilterChange={(key, val) => setClassFilter(val)}
                    filters={[
                        {
                            key: 'class',
                            label: 'All Classes',
                            options: classes.map(c => ({ label: c.name, value: String(c.id) }))
                        }
                    ]}
                    onAdd={hasPermission('students.add_student') ? handleAdd : undefined}
                />

                <DataTable
                    columns={columns}
                    data={filtered}
                    isLoading={loading}
                    onEdit={hasPermission('students.change_student') ? handleEdit : undefined}
                    onDelete={hasPermission('students.delete_student') ? handleDelete : undefined}
                    onView={(row) => window.open(`https://schoolapp-6vwg.onrender.com/api/certificates/generate/${row.id}/bonafide/`, '_blank')}
                />
            </div>

            <StudentFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                studentToEdit={studentToEdit}
            />
        </div>
    );
}
