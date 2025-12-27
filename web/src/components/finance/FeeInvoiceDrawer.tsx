import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, IndianRupee, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createFee, getStudents, type Student, type FeePayload } from '@/lib/api';
import { toast } from '@/lib/toast';

const feeSchema = z.object({
    student: z.coerce.number().min(1, "Student is required"),
    title: z.string().min(2, "Title is required"),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    due_date: z.string().min(10, "Due Date is required"),
    status: z.enum(['PENDING', 'PAID', 'OVERDUE']).default('PENDING'),
});

type FeeFormValues = z.infer<typeof feeSchema>;

interface FeeInvoiceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FeeInvoiceDrawer({ isOpen, onClose, onSuccess }: FeeInvoiceDrawerProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FeeFormValues>({
        resolver: zodResolver(feeSchema) as any,
        defaultValues: {
            title: 'Tuition Fee',
            amount: 0,
            status: 'PENDING',
            due_date: new Date().toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getStudents().then(setStudents).finally(() => setLoading(false));
            reset();
        }
    }, [isOpen, reset]);

    const onSubmit = async (data: FeeFormValues) => {
        setSubmitting(true);
        try {
            await createFee(data as FeePayload);
            onSuccess();
            onClose();
        } catch (e: any) {
            toast.error('Failed to fetch invoice', e.message);
        } finally {
            setSubmitting(false);
        }
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
                            <h2 className="text-xl font-bold text-text-main">Create New Invoice</h2>
                            <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors text-text-muted hover:text-text-main">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-muted uppercase">Student</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 text-text-muted w-5 h-5" />
                                        <select {...register('student')} className="w-full pl-10 p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                            <option value="0">Select Student</option>
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.enrollment_number})</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.student && <p className="text-error text-xs">{errors.student.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-muted uppercase">Fee Title</label>
                                    <input {...register('title')} className="w-full p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Term 1 Tuition" />
                                    {errors.title && <p className="text-error text-xs">{errors.title.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-muted uppercase">Amount</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-2.5 text-text-muted w-5 h-5" />
                                        <input type="number" {...register('amount')} className="w-full pl-10 p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    {errors.amount && <p className="text-error text-xs">{errors.amount.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text-muted uppercase">Due Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-text-muted w-5 h-5" />
                                        <input type="date" {...register('due_date')} className="w-full pl-10 p-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    {errors.due_date && <p className="text-error text-xs">{errors.due_date.message}</p>}
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 bg-surface text-text-main border border-border rounded-xl font-medium hover:bg-background transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> {submitting ? 'Creating...' : 'Create Invoice'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
