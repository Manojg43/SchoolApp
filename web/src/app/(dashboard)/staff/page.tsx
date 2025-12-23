'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth, PermissionGuard } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Briefcase, QrCode, UserPlus, Users, CheckCircle, Clock, Power } from "lucide-react";
import QRCodeDisplay from "@/components/ui/QRCodeDisplay";
import DataTable, { Column } from "@/components/ui/DataTable";
import { getStaff, deleteStaff, toggleStaffActive, type Staff } from "@/lib/api";
import StaffProfileDrawer from "@/components/staff/StaffProfileDrawer";
import SalaryStructureModal from "@/components/finance/SalaryStructureModal";
import Card, { CardContent } from "@/components/ui/modern/Card";
import Animate, { AnimatePage } from "@/components/ui/Animate";

export default function StaffPage() {
    const { t } = useLanguage();
    const { user, hasPermission } = useAuth();
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
    const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');

    // Salary Modal
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [salaryStaff, setSalaryStaff] = useState<Staff | null>(null);

    async function load() {
        setLoading(true);
        try {
            const data = await getStaff();
            setStaffList(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (hasPermission(['is_superuser', 'core.view_coreuser'])) {
            load();
        } else {
            setLoading(false);
        }
    }, [user, hasPermission]);

    const handleAdd = () => {
        setStaffToEdit(null);
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    const handleView = (staff: Staff) => {
        setStaffToEdit(staff);
        setDrawerMode('view');
        setIsDrawerOpen(true);
    };

    const handleEdit = (staff: Staff) => {
        setStaffToEdit(staff);
        setDrawerMode('edit');
        setIsDrawerOpen(true);
    };

    const handleDelete = async (staff: Staff) => {
        if (!confirm(`Are you sure you want to delete ${staff.first_name}?`)) return;
        try {
            await deleteStaff(staff.id);
            load();
        } catch (e) {
            console.error(e);
            alert("Failed to delete staff.");
        }
    };

    const handleSuccess = () => {
        load();
    };

    const handleSalaryClick = (staff: Staff, e: React.MouseEvent) => {
        e.stopPropagation();
        setSalaryStaff(staff);
        setIsSalaryModalOpen(true);
    };

    const handleToggleActive = async (staff: Staff) => {
        try {
            const result = await toggleStaffActive(staff.id);
            if (result.success) {
                // Update staff in local state
                setStaffList(prev => prev.map(s =>
                    s.id === staff.id ? { ...s, is_active: result.is_active } : s
                ));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to toggle staff status.");
        }
    };

    const columns: Column<Staff>[] = [
        {
            header: "Staff Member",
            accessorKey: (row) => (
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleView(row)}>
                    <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm group-hover:bg-secondary group-hover:text-white transition-colors">
                        {row.first_name[0]}{row.last_name[0]}
                    </div>
                    <div>
                        <div className="font-medium text-text-main group-hover:text-primary transition-colors">{row.first_name} {row.last_name}</div>
                        <div className="text-xs text-text-muted">{row.designation || 'Staff'}</div>
                    </div>
                </div>
            )
        },
        { header: "Department", accessorKey: "department", className: "w-32" },
        { header: "Mobile", accessorKey: "mobile", className: "w-32 font-mono text-xs" },
        {
            header: "Role",
            accessorKey: (row) => (
                <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-xs font-semibold text-text-main">
                    {row.role}
                </span>
            )
        },
        {
            header: "Status",
            accessorKey: (row) => (
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 inline-flex text-xs font-bold rounded-full ${row.is_active ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {hasPermission('is_superuser') && (
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
                    )}
                </div>
            )
        },
        {
            header: "Actions",
            accessorKey: (row) => (
                <div className="flex gap-2">
                    {hasPermission('core.can_manage_payroll') && (
                        <button
                            onClick={(e) => handleSalaryClick(row, e)}
                            className="bg-success/10 text-success hover:bg-success/20 px-2 py-1 rounded text-xs font-bold transition-colors"
                        >
                            Payroll
                        </button>
                    )}
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
            <div className="max-w-[1600px] mx-auto p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Staff Management</h1>
                        <p className="text-text-muted mt-1">Manage employees, track attendance, and handle payroll.</p>
                    </div>
                    {hasPermission('core.add_coreuser') && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark font-medium shadow-lg shadow-primary/20 transition-all"
                        >
                            <UserPlus size={18} /> Add New Staff
                        </button>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        index={0}
                        title="Total Staff"
                        value={staffList.length}
                        icon={<Users className="h-6 w-6 text-primary" />}
                        colorClass="bg-primary/10"
                    />
                    <StatCard
                        index={1}
                        title="Present Today"
                        value="-" // Needs realtime data
                        icon={<CheckCircle className="h-6 w-6 text-success" />}
                        colorClass="bg-success/10"
                    />
                    <StatCard
                        index={2}
                        title="Pending Leaves"
                        value="0"
                        icon={<Clock className="h-6 w-6 text-warning" />}
                        colorClass="bg-warning/10"
                    />
                </div>

                {/* Main Content */}
                <Animate animation="fade" delay={0.2}>
                    <Card className="overflow-hidden border-border">
                        <div className="px-6 py-4 border-b border-border bg-surface/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-text-main">All Staff Members</h2>
                            <div className="flex gap-3">
                                <a href="/staff/leaves" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">Manage Leaves</a>
                                {hasPermission('core.can_manage_payroll') && (
                                    <a href="/finance/payroll" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">Payroll Dashboard</a>
                                )}
                            </div>
                        </div>

                        {hasPermission('core.view_coreuser') ? (
                            <DataTable
                                columns={columns}
                                data={staffList}
                                isLoading={loading}
                                onEdit={hasPermission('core.change_coreuser') ? handleEdit : undefined}
                                onDelete={hasPermission('core.delete_coreuser') ? handleDelete : undefined}
                                onView={handleView}
                            />
                        ) : (
                            <div className="p-12 text-center text-text-muted">
                                <p>You do not have permission to view the staff list.</p>
                            </div>
                        )}
                    </Card>
                </Animate>

                <StaffProfileDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    onSuccess={handleSuccess}
                    staff={staffToEdit}
                    mode={drawerMode}
                />

                <SalaryStructureModal
                    isOpen={isSalaryModalOpen}
                    onClose={() => setIsSalaryModalOpen(false)}
                    staff={salaryStaff}
                />
            </div>
        </AnimatePage>
    );
}
