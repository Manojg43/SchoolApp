"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import FormModal from "@/components/ui/FormModal";

import { createStaff, updateStaff, Staff, StaffPayload } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SalaryStructureModal from "@/components/finance/SalaryStructureModal";

const staffSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    role: z.string().min(1, "Role is required"),
    designation: z.string().optional(),
    department: z.string().optional(),
    joining_date: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    staff: Staff | null;
    mode: 'view' | 'edit' | 'create';
}

export default function StaffProfileDrawer({ isOpen, onClose, onSuccess, staff, mode }: StaffProfileDrawerProps) {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

    const form = useForm<StaffFormValues>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            mobile: "",
            role: "TEACHER",
            designation: "",
            department: "",
            joining_date: new Date().toISOString().split('T')[0],
            password: "",
        },
    });

    useEffect(() => {
        if (staff) {
            form.reset({
                first_name: staff.first_name,
                last_name: staff.last_name,
                email: staff.email,
                mobile: staff.mobile,
                role: staff.role,
                designation: staff.designation || "",
                department: staff.department || "",
                joining_date: staff.joining_date || "",
                password: "", // Don't fill password
            });
        } else {
            form.reset({
                first_name: "",
                last_name: "",
                email: "",
                mobile: "",
                role: "TEACHER",
                designation: "",
                department: "",
                joining_date: new Date().toISOString().split('T')[0],
                password: "",
            });
        }
    }, [staff, mode, form]);

    const onSubmit = async (values: StaffFormValues) => {
        try {
            const payload: StaffPayload = {
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                mobile: values.mobile,
                role: values.role,
                profile: {
                    designation: values.designation || "",
                    department: values.department || "",
                    joining_date: values.joining_date,
                },
                // Only include password if provided
                ...(values.password ? { password: values.password } : {}),
            };

            if (isEdit && staff) {
                await updateStaff(staff.id, payload);
                toast.success("Staff updated successfully");
            } else {
                await createStaff(payload);
                toast.success("Staff created successfully");
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(isEdit ? "Failed to update staff" : "Failed to create staff");
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? 'Add New Staff' : mode === 'edit' ? 'Edit Staff' : 'Staff Details'}
            size="md"
        >
            <div className="py-2">
                <p className="text-sm text-gray-500 mb-6">
                    {mode === 'create'
                        ? "Enter the details to onboarding a new staff member."
                        : "View or modify staff information."}
                </p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="first_name" className="text-sm font-medium">First Name</label>
                            <input
                                id="first_name"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                {...form.register("first_name")}
                                disabled={isView}
                            />
                            {form.formState.errors.first_name && <p className="text-red-500 text-xs">{form.formState.errors.first_name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="last_name" className="text-sm font-medium">Last Name</label>
                            <input
                                id="last_name"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                {...form.register("last_name")}
                                disabled={isView}
                            />
                            {form.formState.errors.last_name && <p className="text-red-500 text-xs">{form.formState.errors.last_name.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            {...form.register("email")}
                            disabled={isView}
                        />
                        {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="mobile" className="text-sm font-medium">Mobile Number</label>
                            <input
                                id="mobile"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                {...form.register("mobile")}
                                disabled={isView}
                            />
                            {form.formState.errors.mobile && <p className="text-red-500 text-xs">{form.formState.errors.mobile.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="role" className="text-sm font-medium">Role</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                disabled={isView}
                                {...form.register("role")}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="TEACHER">Teacher</option>
                                <option value="STAFF">Staff</option>
                                <option value="DRIVER">Driver</option>
                            </select>
                            {form.formState.errors.role && <p className="text-red-500 text-xs">{form.formState.errors.role.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="designation" className="text-sm font-medium">Designation</label>
                            <input
                                id="designation"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                {...form.register("designation")}
                                disabled={isView}
                                placeholder="e.g. Senior Teacher"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="department" className="text-sm font-medium">Department</label>
                            <input
                                id="department"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                {...form.register("department")}
                                disabled={isView}
                                placeholder="e.g. Science"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="joining_date" className="text-sm font-medium">Joining Date</label>
                        <input
                            id="joining_date"
                            type="date"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            {...form.register("joining_date")}
                            disabled={isView}
                        />
                    </div>

                    {!isView && (
                        <div className="space-y-2">
                            <label htmlFor="password">Password {isEdit && "(Leave blank to keep current)"}</label>
                            <input
                                id="password"
                                type="password"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                {...form.register("password")}
                            />
                            {form.formState.errors.password && <p className="text-red-500 text-xs">{form.formState.errors.password.message}</p>}
                        </div>
                    )}

                    {!isView && (
                        <div className="flex justify-end pt-4 gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center"
                            >
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? "Update Staff" : "Create Staff"}
                            </button>
                        </div>
                    )}
                </form>

                {staff && mode !== 'create' && (
                    <div className="border-t pt-6 mt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-sm">Payroll Configuration</h3>
                                <p className="text-xs text-muted-foreground">Manage salary structure and allowances</p>
                            </div>
                            <button
                                className="px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-gray-50"
                                onClick={() => setIsSalaryModalOpen(true)}
                            >
                                Configure Salary
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SalaryStructureModal
                isOpen={isSalaryModalOpen}
                onClose={() => setIsSalaryModalOpen(false)}
                staff={staff}
            />
        </FormModal>
    );
}
