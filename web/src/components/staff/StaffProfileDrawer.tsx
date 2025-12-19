import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, Edit2, Save, Trash2, Phone, Mail, Briefcase, Settings, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createStaff, updateStaff, type Staff, type StaffPayload } from '@/lib/api';

const staffSchema = z.object({
    first_name: z.string().min(2, "First Name is required"),
    last_name: z.string().min(2, "Last Name is required"),
    email: z.string().email("Invalid email"),
    mobile: z.string().min(10, "Mobile number is required"),
    role: z.enum(['ADMIN', 'TEACHER', 'DRIVER', 'ACCOUNTANT', 'CLERK', 'STAFF']),
    designation: z.string().optional(),
    department: z.string().optional(),
    joining_date: z.string().optional(),
    can_mark_manual_attendance: z.boolean().default(false),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    staff: Staff | null;
    mode?: 'view' | 'edit' | 'create';
}

export default function StaffProfileDrawer({ isOpen, onClose, onSuccess, staff, mode = 'view' }: StaffProfileDrawerProps) {
    const [activeMode, setActiveMode] = useState<'view' | 'edit' | 'create'>(mode);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveMode(staff ? (mode === 'create' ? 'create' : mode) : 'create');
        }
    }, [isOpen, staff, mode]);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            role: 'STAFF',
            can_mark_manual_attendance: false,
            first_name: '', last_name: '', email: '', mobile: '', designation: '', department: ''
        }
    });

    useEffect(() => {
        if (staff && isOpen) {
            setValue('first_name', staff.first_name);
            setValue('last_name', staff.last_name);
            setValue('email', staff.email);
            setValue('mobile', staff.mobile);
            setValue('role', staff.role as any); // Role enum might mismatch case, ensure API consistency
            setValue('designation', staff.designation || '');
            setValue('department', staff.department || '');
            setValue('joining_date', staff.joining_date || '');
            setValue('can_mark_manual_attendance', staff.can_mark_manual_attendance || false);
        } else if (isOpen && activeMode === 'create') {
            reset();
        }
    }, [staff, isOpen, activeMode, reset, setValue]);

    const onSubmit = async (data: StaffFormValues) => {
        setLoading(true);
        try {
            const payload: StaffPayload = {
                ...data,
                user_id: staff?.user_id || 'NEW', // Logic handle by backend usually, or we ignore user_id in create
            };

            if (staff && activeMode === 'edit') {
                await updateStaff(staff.id, payload);
            } else {
                await createStaff(payload);
            }
            onSuccess();
            onClose();
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const ViewProfile = () => {
        if (!staff) return null;
        return (
            <div className="space-y-6 pt-2">
                <div className="flex flex-col items-center justify-center space-y-3 pb-6 border-b border-border">
                    <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-3xl border-4 border-surface shadow-sm">
                        {staff.first_name[0]}{staff.last_name[0]}
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-text-main">{staff.first_name} {staff.last_name}</h3>
                        <p className="text-sm text-text-muted">{staff.role} • {staff.designation || 'No Designation'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Contact Details</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors">
                            <Mail className="text-primary w-5 h-5" />
                            <div>
                                <div className="text-xs text-text-muted">Email</div>
                                <div className="text-sm font-medium">{staff.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors">
                            <Phone className="text-success w-5 h-5" />
                            <div>
                                <div className="text-xs text-text-muted">Mobile</div>
                                <div className="text-sm font-medium">{staff.mobile}</div>
                            </div>
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mt-6">Work Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                                <Briefcase size={14} /> Department
                            </div>
                            <div className="font-semibold text-text-main">{staff.department || 'N/A'}</div>
                        </div>
                        <div className="p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                                <Settings size={14} /> Permissions
                            </div>
                            <div className="font-semibold text-text-main text-xs">
                                {staff.can_mark_manual_attendance ? 'Can Mark Attendance' : 'Standard Access'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        onClick={() => setActiveMode('edit')}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Edit2 size={18} /> Edit Staff Profile
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
                            <h2 className="text-xl font-bold text-text-main">
                                {activeMode === 'create' ? 'Add New Staff' : (activeMode === 'edit' ? 'Edit Profile' : 'Staff Profile')}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors text-text-muted hover:text-text-main">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {activeMode === 'view' ? (
                                <ViewProfile />
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">First Name</label>
                                            <input {...register('first_name')} className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                                            {errors.first_name && <p className="text-error text-xs">{errors.first_name.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Last Name</label>
                                            <input {...register('last_name')} className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                                            {errors.last_name && <p className="text-error text-xs">{errors.last_name.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-text-muted uppercase">Email Address</label>
                                        <input {...register('email')} className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                                        {errors.email && <p className="text-error text-xs">{errors.email.message}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-text-muted uppercase">Mobile Number</label>
                                        <input {...register('mobile')} className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                                        {errors.mobile && <p className="text-error text-xs">{errors.mobile.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Role</label>
                                            <select {...register('role')} className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20">
                                                <option value="TEACHER">Teacher</option>
                                                <option value="ADMIN">Admin</option>
                                                <option value="ACCOUNTANT">Accountant</option>
                                                <option value="CLERK">Clerk</option>
                                                <option value="DRIVER">Driver</option>
                                                <option value="STAFF">Staff (Other)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Department</label>
                                            <input {...register('department')} className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Science" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-text-muted uppercase">Designation</label>
                                        <input {...register('designation')} className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Senior Teacher" />
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg">
                                        <input type="checkbox" {...register('can_mark_manual_attendance')} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                                        <div>
                                            <label className="text-sm font-medium text-text-main block">Can Manual Mark Attendance?</label>
                                            <p className="text-xs text-text-muted">Allow this user to manually override attendance logs.</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        {activeMode === 'edit' && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveMode('view')}
                                                className="flex-1 py-3 bg-surface text-text-main border border-border rounded-xl font-medium hover:bg-background transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
