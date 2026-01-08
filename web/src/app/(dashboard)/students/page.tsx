'use client';

import React, { useEffect, useState } from "react";
import { getStudents, deleteStudent, getClasses, getSections, getAcademicYears, toggleStudentActive, type Student, type ClassItem, type SectionItem as Section, type AcademicYear } from "@/lib/api";
import { GraduationCap, Users, UserPlus, Power, RefreshCw, Filter } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import DataTable, { Column } from "@/components/ui/DataTable";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/modern/Card";
import Animate, { AnimatePage } from "@/components/ui/Animate";
import { PageTabs } from "@/components/ui/PageTabs";
import StudentProfileDrawer from "@/components/students/StudentProfileDrawer";

export default function StudentList() {
    const { hasPermission } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("");
    const [sectionFilter, setSectionFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("all"); // all, active, inactive

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');

    const tabs = [
        { label: 'Directory', href: '/students' },
        { label: 'Attendance', href: '/students/attendance' },
    ];

    async function loadData() {
        setLoading(true);
        try {
            const [sData, cData, secData, yearData] = await Promise.all([
                getStudents(),
                getClasses(),
                getSections(),
                getAcademicYears()
            ]);
            if (Array.isArray(sData)) setStudents(sData);
            if (Array.isArray(cData)) setClasses(cData);
            if (Array.isArray(secData)) setSections(secData);
            if (Array.isArray(yearData)) setAcademicYears(yearData);
        } catch (e: unknown) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Get filtered sections based on selected class
    const filteredSections = classFilter
        ? sections.filter(s => s.parent_class === Number(classFilter))
        : sections;

    // Clear section when class changes
    useEffect(() => {
        setSectionFilter("");
    }, [classFilter]);

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
        toast.confirm({
            title: `Delete ${student.first_name} ${student.last_name}?`,
            description: 'This action cannot be undone. All student records will be permanently removed.',
            confirmText: 'Delete',
            onConfirm: async () => {
                const loadingToast = toast.loading('Deleting student...');
                try {
                    await deleteStudent(student.id);
                    setStudents(prev => prev.filter(s => s.id !== student.id));
                    toast.success('Student deleted successfully',
                        `${student.first_name} ${student.last_name} has been removed`
                    );
                } catch (e) {
                    console.error(e);
                    toast.error('Failed to delete student',
                        'Please try again or contact support'
                    );
                } finally {
                    toast.dismiss(loadingToast);
                }
            },
        });
    };

    const handleSuccess = () => {
        loadData();
    };

    const handleToggleActive = async (student: Student) => {
        const loadingToast = toast.loading(
            student.is_active ? 'Deactivating student...' : 'Activating student...'
        );
        try {
            const result = await toggleStudentActive(student.id);
            if (result.success) {
                setStudents(prev => prev.map(s =>
                    s.id === student.id ? { ...s, is_active: result.is_active } : s
                ));
                toast.success(result.message,
                    `${student.first_name} ${student.last_name}`
                );
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to toggle student status',
                'Please try again'
            );
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setClassFilter("");
        setSectionFilter("");
        setYearFilter("");
        setActiveFilter("all");
    };

    const hasActiveFilters = search || classFilter || sectionFilter || yearFilter || activeFilter !== "all";

    // Derived Data - Filter students
    const filtered = students.filter(s => {
        // Search filter
        const matchesSearch = search === "" ||
            s.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.last_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.enrollment_number?.includes(search);

        // Class filter
        const matchesClass = !classFilter || String((s as any).current_class) === classFilter;

        // Section filter
        const matchesSection = !sectionFilter || String((s as any).section) === sectionFilter;

        // Year filter
        const matchesYear = !yearFilter || String((s as any).academic_year) === yearFilter;

        // Active filter
        const matchesActive = activeFilter === "all" ||
            (activeFilter === "active" && s.is_active) ||
            (activeFilter === "inactive" && !s.is_active);

        return matchesSearch && matchesClass && matchesSection && matchesYear && matchesActive;
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
        { header: "Class", accessorKey: "class_name", className: "w-24" },
        { header: "Section", accessorKey: "section_name", className: "w-20" },
        {
            header: "Status",
            accessorKey: (row) => (
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 inline-flex text-xs font-bold rounded-full ${row.is_active ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(row);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${row.is_active
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                        title={row.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                        <Power size={14} />
                    </button>
                </div>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark tracking-tight">Students</h1>
                        <p className="text-text-muted mt-1">Manage admissions, profiles, and academic records.</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 font-medium transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        <UserPlus size={18} /> Add New Student
                    </button>
                </div>

                <PageTabs tabs={tabs} />

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
                        title="Filtered Results"
                        value={filtered.length}
                        icon={<Filter className="h-6 w-6 text-secondary" />}
                        colorClass="bg-secondary/10"
                    />
                </div>

                {/* Main Content */}
                <Animate animation="fade" delay={0.2}>
                    <Card className="overflow-hidden border-border">
                        {/* Filter Bar */}
                        <div className="px-6 py-4 border-b border-border bg-surface/50">
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search by name or enrollment ID..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>

                                {/* Class Filter */}
                                <select
                                    value={classFilter}
                                    onChange={(e) => setClassFilter(e.target.value)}
                                    className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[140px]"
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                {/* Section Filter */}
                                <select
                                    value={sectionFilter}
                                    onChange={(e) => setSectionFilter(e.target.value)}
                                    className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[130px]"
                                    disabled={!classFilter}
                                >
                                    <option value="">All Sections</option>
                                    {filteredSections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>

                                {/* Academic Year Filter */}
                                <select
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[150px]"
                                >
                                    <option value="">All Years</option>
                                    {academicYears.map(y => (
                                        <option key={y.id} value={y.id}>
                                            {y.name} {y.is_active ? '(Current)' : ''}
                                        </option>
                                    ))}
                                </select>

                                {/* Status Filter */}
                                <select
                                    value={activeFilter}
                                    onChange={(e) => setActiveFilter(e.target.value)}
                                    className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[120px]"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-main hover:bg-surface rounded-lg transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Active Filters Display */}
                            {hasActiveFilters && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                                    <span className="text-sm text-text-muted">Active filters:</span>
                                    {classFilter && (
                                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                            Class: {classes.find(c => c.id === Number(classFilter))?.name}
                                        </span>
                                    )}
                                    {sectionFilter && (
                                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                            Section: {sections.find(s => s.id === Number(sectionFilter))?.name}
                                        </span>
                                    )}
                                    {yearFilter && (
                                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                            Year: {academicYears.find(y => y.id === Number(yearFilter))?.name}
                                        </span>
                                    )}
                                    {activeFilter !== "all" && (
                                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                            Status: {activeFilter}
                                        </span>
                                    )}
                                    {search && (
                                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                            Search: "{search}"
                                        </span>
                                    )}
                                </div>
                            )}
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
