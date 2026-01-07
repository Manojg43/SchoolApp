import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, KeyRound } from 'lucide-react';
import LoadingButton from '@/components/ui/LoadingButton';
import { toast } from '@/lib/toast';
import { createStaff, updateStaff, generateResetCode, type Staff, type StaffPayload } from '@/lib/api';

const staffSchema = z.object({
    first_name: z.string().min(2, "First Name is required"),
    last_name: z.string().min(2, "Last Name is required"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile number is required"),
    role: z.enum(['TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'OFFICE_STAFF', 'ACCOUNTANT', 'DRIVER', 'CLEANING_STAFF']),
    designation: z.string().min(1, "Designation is required"),
    department: z.string().min(1, "Department is required"),
    joining_date: z.string().min(1, "Joining Date is required"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
    can_mark_manual_attendance: z.boolean().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    staffToEdit?: Staff | null;
}

export default function StaffFormModal({ isOpen, onClose, onSuccess, staffToEdit }: StaffFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [resetCode, setResetCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            role: 'TEACHER',
            can_mark_manual_attendance: false
        }
    });

    // Populate Form on Edit
    useEffect(() => {
        setResetCode(null);
        if (staffToEdit) {
            setValue('first_name', staffToEdit.first_name);
            setValue('last_name', staffToEdit.last_name);
            setValue('email', staffToEdit.email);
            setValue('mobile', staffToEdit.mobile);
            setValue('role', (staffToEdit.role.toUpperCase().replace(' ', '_') as "TEACHER" | "SCHOOL_ADMIN" | "PRINCIPAL" | "OFFICE_STAFF" | "ACCOUNTANT" | "DRIVER" | "CLEANING_STAFF"));
            setValue('designation', staffToEdit.designation || "");
            setValue('department', staffToEdit.department || "");
            setValue('joining_date', staffToEdit.joining_date || "");
            setValue('can_mark_manual_attendance', staffToEdit.can_mark_manual_attendance || false);
        } else {
            reset();
        }
    }, [staffToEdit, isOpen, reset, setValue]);

    const onInvalid = (errors: Record<string, unknown>) => {

        const firstError = Object.values(errors)[0] as { message?: string };
        setError(firstError?.message || "Please check the form for errors.");
    };

    const handleGenerateCode = async () => {
        if (!staffToEdit) return;
        try {
            const res = await generateResetCode(staffToEdit.id);
            setResetCode(res.code);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to generate code";
            setError(message);
        }
    };

    const onSubmit = async (data: StaffFormValues) => {
        setLoading(true);
        setError(null);
        const payload: StaffPayload = { ...data };


        try {
            if (staffToEdit) {
                await updateStaff(staffToEdit.id, payload);
            } else {
                await createStaff(payload);
            }
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onSuccess();
                onClose();
            }, 2000);
        } catch (err: unknown) {
            // Error type is unknown, but commonly Error object or API response

            const message = err instanceof Error ? err.message : "Failed to save staff. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Early return if closed
    if (!isOpen) return null;

    // Show Success Popup
    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-surface p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-scale-in border border-border">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-text-main mb-2">Success!</h3>
                    <p className="text-text-muted text-center">Staff member has been updated successfully.</p>
                </div>
            </div>
        );
    }

    // Main Form Render
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border animate-scale-in">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-semibold text-text-main">
                        {staffToEdit ? 'Edit Staff Member' : 'Add New Staff'}
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-md flex items-center gap-2">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">First Name</label>
                                <input {...register('first_name')} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                {errors.first_name && <p className="text-error text-xs mt-1">{errors.first_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Last Name</label>
                                <input {...register('last_name')} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                {errors.last_name && <p className="text-error text-xs mt-1">{errors.last_name.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Email (Username)</label>
                                <input type="email" {...register('email')} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Mobile</label>
                                <input {...register('mobile')} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                {errors.mobile && <p className="text-error text-xs mt-1">{errors.mobile.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Role</label>
                                <select {...register('role')} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="TEACHER">Teacher</option>
                                    <option value="SCHOOL_ADMIN">School Admin</option>
                                    <option value="PRINCIPAL">Principal</option>
                                    <option value="OFFICE_STAFF">Office Staff</option>
                                    <option value="ACCOUNTANT">Accountant</option>
                                    <option value="DRIVER">Driver</option>
                                    <option value="CLEANING_STAFF">Cleaning Staff</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Designation</label>
                                <input {...register('designation')} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Senior Teacher" />
                                {errors.designation && <p className="text-error text-xs mt-1">{errors.designation.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Department</label>
                                <input {...register('department')} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Science" />
                                {errors.department && <p className="text-error text-xs mt-1">{errors.department.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Joining Date</label>
                                <input type="date" {...register('joining_date')} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                {errors.joining_date && <p className="text-error text-xs mt-1">{errors.joining_date.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Password Support</label>
                                <div className="mt-1">
                                    <input type="password" {...register('password')} className="block w-full rounded-md border border-border bg-background px-3 py-2 text-text-main shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Set/Change Password" />
                                </div>
                            </div>
                            {staffToEdit && (
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary">Mobile App Reset</label>
                                    <div className="mt-1 flex gap-2 items-center">
                                        <button type="button" onClick={handleGenerateCode} className="px-3 py-2 bg-secondary/10 text-secondary rounded-md text-sm font-bold flex items-center gap-2 hover:bg-secondary/20 transition-colors">
                                            <KeyRound size={16} />
                                            Generate Code
                                        </button>
                                        {resetCode && (
                                            <div className="px-3 py-2 bg-text-main text-black rounded-md font-mono font-bold tracking-widest animate-scale-in">
                                                {resetCode}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="can_mark_manual_attendance"
                                {...register('can_mark_manual_attendance')}
                                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                            />
                            <label htmlFor="can_mark_manual_attendance" className="text-sm font-medium text-text-secondary">
                                Allow Manual GPS Attendance (Without QR)
                            </label>
                            <p className="text-xs text-text-muted">Use for staff with broken cameras or persistent scanning issues.</p>
                        </div>

                        <div className="flex justify-end pt-4 space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-border rounded-md text-text-secondary hover:bg-background text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <LoadingButton
                                type="submit"
                                loading={loading}
                                className="px-4 py-2 text-sm font-medium shadow-sm"
                            >
                                Save Staff
                            </LoadingButton>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
