import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { createStaff, updateStaff, type Staff } from '@/lib/api';

const staffSchema = z.object({
    first_name: z.string().min(2, "First Name is required"),
    last_name: z.string().min(2, "Last Name is required"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile number is required"),
    role: z.enum(['TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL', 'OFFICE_STAFF', 'ACCOUNTANT', 'DRIVER', 'CLEANING_STAFF']),
    designation: z.string().min(1, "Designation is required"),
    department: z.string().min(1, "Department is required"),
    joining_date: z.string().min(1, "Joining Date is required"),
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

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            role: 'TEACHER'
        }
    });

    // Populate Form on Edit
    useEffect(() => {
        if (staffToEdit) {
            setValue('first_name', staffToEdit.first_name);
            setValue('last_name', staffToEdit.last_name);
            setValue('email', staffToEdit.email);
            setValue('mobile', staffToEdit.mobile);
            // Ensure role matches enum (backend might return 'Teacher', frontend expects 'TEACHER' if enum is strict? 
            // Backend serializer uses `get_role_display` for read, but `role` (UPPERCASE) for write usually.
            // Let's assume we need to map Display Name back to ID or just fix the serializer to return ID for editing.
            // For now, mapping crude checks:
            setValue('role', (staffToEdit.role.toUpperCase().replace(' ', '_') as any));
            setValue('designation', staffToEdit.designation || "");
            setValue('department', staffToEdit.department || "");
            setValue('joining_date', staffToEdit.joining_date || "");
        } else {
            reset();
        }
    }, [staffToEdit, isOpen, reset, setValue]);

    const onSubmit = async (data: StaffFormValues) => {
        setLoading(true);
        // Fields are now mandatory, so no raw null check needed for these, 
        // but keeping payload consistent is good.
        const payload = { ...data };

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
            }, 2000); // Auto close after 2 seconds
        } catch (error) {
            console.error("Failed to save staff", error);
            alert("Failed to save staff. Check console.");
        } finally {
            setLoading(false);
        }
    };

    // Early return if closed
    if (!isOpen) return null;

    // Show Success Popup
    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                    <p className="text-gray-500 text-center">Staff member has been added successfully.</p>
                </div>
            </div>
        );
    }

    // Main Form Render
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {staffToEdit ? 'Edit Staff Member' : 'Add New Staff'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input {...register('first_name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input {...register('last_name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (Username)</label>
                            <input type="email" {...register('email')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mobile</label>
                            <input {...register('mobile')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select {...register('role')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
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
                            <label className="block text-sm font-medium text-gray-700">Designation</label>
                            <input {...register('designation')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Senior Teacher" />
                            {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <input {...register('department')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Science" />
                            {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                            <input type="date" {...register('joining_date')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.joining_date && <p className="text-red-500 text-xs mt-1">{errors.joining_date.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Staff'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
