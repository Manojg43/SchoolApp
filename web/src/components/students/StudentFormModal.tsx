import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { getClasses, getSections, createStudent, updateStudent, type Student, type ClassItem, type SectionItem, type StudentPayload } from '@/lib/api';

const studentSchema = z.object({
    first_name: z.string().min(2, "First Name is required"),
    last_name: z.string().min(2, "Last Name is required"),
    father_name: z.string().min(2, "Father Name is required"),
    mother_name: z.string().optional(),
    enrollment_number: z.string().min(1, "Enrollment ID is required"),
    gender: z.enum(['M', 'F', 'O']),
    date_of_birth: z.string().min(10, "DOB is required"),
    address: z.string().optional(),
    emergency_mobile: z.string().min(10, "Mobile number is required"),
    current_class: z.preprocess((val) => Number(val), z.number().min(1, "Class is required")),
    section: z.preprocess((val) => (val ? Number(val) : null), z.number().nullable().optional()),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentToEdit?: Student | null;
}

export default function StudentFormModal({ isOpen, onClose, onSuccess, studentToEdit }: StudentFormModalProps) {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [filteredSections, setFilteredSections] = useState<SectionItem[]>([]);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            gender: 'M',
            current_class: undefined
        }
    });

    // Fetch Metadata
    useEffect(() => {
        async function loadMeta() {
            try {
                // console.log("Fetching Classes and Sections...");
                const [c, s] = await Promise.all([getClasses(), getSections()]);
                // console.log("Fetched Data:", c, s);
                setClasses(c);
                setSections(s);
            } catch (err: any) {
                console.error("Failed to load metadata:", err);
                alert(`Failed to load Classes/Sections: ${err.message || 'Unknown Error'}. Check Console.`);
            }
        }
        if (isOpen) loadMeta();
    }, [isOpen]);

    // Populate Form on Edit
    useEffect(() => {
        if (studentToEdit) {
            setValue('first_name', studentToEdit.first_name);
            setValue('last_name', studentToEdit.last_name);
            setValue('father_name', studentToEdit.father_name);
            setValue('enrollment_number', studentToEdit.enrollment_number);
            setValue('emergency_mobile', studentToEdit.emergency_mobile);
            setValue('date_of_birth', studentToEdit.date_of_birth);
            setValue('gender', studentToEdit.gender as 'M' | 'F' | 'O');
            // Safely cast if necessary due to backend/frontend type mismatch in 'current_class'
            setValue('current_class', (studentToEdit as unknown as { current_class: number }).current_class);
            setValue('section', (studentToEdit as unknown as { section: number }).section);
        } else {
            reset();
        }
    }, [studentToEdit, isOpen, reset, setValue]);

    // Filter Sections based on Class Selection
    const selectedClassId = watch('current_class');

    useEffect(() => {
        if (selectedClassId) {
            const classIdNum = Number(selectedClassId);
            const filtered = sections.filter(s => s.parent_class === classIdNum);
            setFilteredSections(filtered);
        } else {
            setFilteredSections([]);
        }
    }, [selectedClassId, sections]);

    const onSubmit = async (data: StudentFormValues) => {
        setLoading(true);
        try {
            if (studentToEdit) {
                await updateStudent(studentToEdit.id, data);
            } else {
                await createStudent(data);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save student", error);
            alert("Failed to save student. Check console.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {studentToEdit ? 'Edit Student' : 'Add New Student'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                    {/* Basic Info */}
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
                            <label className="block text-sm font-medium text-gray-700">Father Name</label>
                            <input {...register('father_name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Enrollment No.</label>
                            <input {...register('enrollment_number')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.enrollment_number && <p className="text-red-500 text-xs mt-1">{errors.enrollment_number.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                            <input {...register('emergency_mobile')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.emergency_mobile && <p className="text-red-500 text-xs mt-1">{errors.emergency_mobile.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input type="date" {...register('date_of_birth')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <select {...register('gender')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="O">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class</label>
                            <select {...register('current_class')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.current_class && <p className="text-red-500 text-xs mt-1">{errors.current_class.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Section</label>
                            <select
                                {...register('section')}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                disabled={!selectedClassId}
                            >
                                <option value="">Select Section</option>
                                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
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
                            {loading ? 'Saving...' : 'Save Student'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
