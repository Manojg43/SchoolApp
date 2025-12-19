'use client';

import React, { useEffect, useState } from "react";
import { getStudents, deleteStudent, getClasses, type Student, type ClassItem } from "@/lib/api";
import { Download, Plus, Edit, Trash2, GraduationCap, Users, UserPlus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import FilterBar from "@/components/ui/FilterBar";
import DataTable, { Column } from "@/components/ui/DataTable";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/modern/Card";
import Animate, { AnimatePage } from "@/components/ui/Animate";
import StudentProfileDrawer from "@/components/students/StudentProfileDrawer";

export default function StudentList() {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("");

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');

    async function loadData() {
        setLoading(true);
        try {
            const [sData, cData] = await Promise.all([getStudents(), getClasses()]);
            if (Array.isArray(sData)) setStudents(sData);
            if (Array.isArray(cData)) setClasses(cData);
        } catch (e: unknown) {
            console.error(e);
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
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    const handleView = (student: Student) => {
        setStudentToEdit(student);
        setDrawerMode('view');
        setIsDrawerOpen(true);
    };

    const handleEdit = (student: Student) => {
        setStudentToEdit(student);
        setDrawerMode('edit');
        setIsDrawerOpen(true);
    };

    const handleDelete = async (student: Student) => {
        if (!confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) return;
        try {
            await deleteStudent(student.id);
            setStudents(prev => prev.filter(s => s.id !== student.id));
        } catch (e) {
            console.error(e);
            alert("Failed to delete student.");
        }
    };

    const handleSuccess = () => {
        loadData();
    };

    // Derived Data
    const filtered = students.filter(s => {
        const matchesSearch =
            s.first_name.toLowerCase().includes(search.toLowerCase()) ||
            s.last_name.toLowerCase().includes(search.toLowerCase()) ||
            s.enrollment_number.includes(search);

        const matchesClass = classFilter ? String((s as any).current_class) === classFilter : true;
        return matchesSearch && matchesClass;
    });

    const columns: Column<Student>[] = [
        { header: "ID", accessorKey: "enrollment_number", className: "w-24 font-mono text-xs text-text-muted" },
        {
            header: "Student",
            accessorKey: (row) => (
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleView(row)}
                >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        {row.first_name[0]}{row.last_name[0]}
                    </div>
                    <div>
                        <div className="font-medium text-text-main group-hover:text-primary transition-colors">{row.first_name} {row.last_name}</div>
                        <div className="text-xs text-text-muted">{row.father_name}</div>
                    </div>
                </div>
            )
        },
        { header: "Class", accessorKey: "class_name", className: "w-32" },
        {
            header: "Status",
            accessorKey: (row) => (
                <span className={`px-2 py-0.5 inline-flex text-xs font-bold rounded-full ${row.is_active ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            )
        },
    ];

    const StatCard = ({ title, value, icon, colorClass, index }: any) => (
        <Animate animation="slideUp" delay={index * 0.1}>
            <Card className="h-full border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
                <CardContent className="flex items-center justify-between p-4">
                    <div>
                        <p className="text-sm font-medium text-text-muted uppercase tracking-wider">{title}</p>
                        <p className="text-2xl font-bold text-text-main mt-1">{value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${colorClass}`}>
                        {icon}
                    </div>
                </CardContent>
            </Card>
        </Animate>
    );

    return (
        <AnimatePage>
            <div className="space-y-6 max-w-[1600px] mx-auto p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Students Directory</h1>
                        <p className="text-text-muted mt-1">Manage admissions, profiles, and academic records.</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark font-medium shadow-lg shadow-primary/20 transition-all"
                    >
                        <UserPlus size={18} /> Add New Student
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        index={0}
                        title="Total Students"
                        value={students.length}
                        icon={<GraduationCap className="h-6 w-6 text-primary" />}
                        colorClass="bg-primary/10"
                    />
                    <StatCard
                        index={1}
                        title="Active Students"
                        value={students.filter(s => s.is_active).length}
                        icon={<Users className="h-6 w-6 text-success" />}
                        colorClass="bg-success/10"
                    />
                    <StatCard
                        index={2}
                        title="New Admissions"
                        value={5}
                        icon={<UserPlus className="h-6 w-6 text-secondary" />}
                        colorClass="bg-secondary/10"
                    />
                </div>

                {/* Main Content */}
                <Animate animation="fade" delay={0.2}>
                    <Card className="overflow-hidden border-border">
                        <div className="px-6 py-4 border-b border-border bg-surface/50">
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
                            />
                        </div>

                        <DataTable
                            columns={columns}
                            data={filtered}
                            isLoading={loading}
                            onEdit={hasPermission('students.change_student') ? handleEdit : undefined}
                            onDelete={hasPermission('students.delete_student') ? handleDelete : undefined}
                            onView={handleView}
                        />
                    </Card>
                </Animate>

                <StudentProfileDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    onSuccess={handleSuccess}
                    student={studentToEdit}
                    mode={drawerMode}
                />
            </div>
        </AnimatePage>
    );
}
