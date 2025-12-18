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
    mother_name: z.string().optional().or(z.literal('')),
    enrollment_number: z.string().min(1, "Enrollment ID is required"),
    gender: z.enum(['M', 'F', 'O']),
    date_of_birth: z.string().min(10, "DOB is required"),
    address: z.string().optional().or(z.literal('')),
    emergency_mobile: z.string().min(10, "Mobile number is required"),
    // Coerce to number, allowing string input from forms. Default to 0 or undefined if empty.
    current_class: z.coerce.number().min(1, "Class is required"),
    // Section is nullable. Transform 0/empty to null.
    section: z.coerce.number().nullable().optional().transform(val => (val === 0 || !val) ? null : val),
});

// Infer directly to ensure consistency
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
        // Cast resolver to any to bypass strict type mismatch between Zod input/output and RHF
        resolver: zodResolver(studentSchema) as any,
        defaultValues: {
            gender: 'M',
            current_class: 0,
            section: null,
            first_name: '',
            last_name: '',
            father_name: '',
            mother_name: '',
            enrollment_number: '',
            emergency_mobile: '',
            date_of_birth: '',
            address: ''
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

            } catch (err) {
                console.error("Failed to load metadata:", err);
                const msg = err instanceof Error ? err.message : 'Unknown Error';
                alert(`Failed to load Classes/Sections: ${msg}. Check Console.`);
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
            setValue('mother_name', studentToEdit.mother_name || '');
            setValue('address', studentToEdit.address || '');

            // Safely set IDs
            if (studentToEdit.current_class) {
                setValue('current_class', studentToEdit.current_class);
            }
            if (studentToEdit.section) {
                setValue('section', studentToEdit.section);
            }
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

            // If the current section is not in the filtered list, reset it
            // unless we are in the initial load of an edit
            const currentSection = watch('section');
            if (currentSection && !filtered.find(s => s.id === currentSection)) {
                setValue('section', null);
            }
        } else {
            setFilteredSections([]);
            setValue('section', null);
        }
    }, [selectedClassId, sections, setValue, watch]);

    const onSubmit = async (data: StudentFormValues) => {
        setLoading(true);
        try {
            const payload: StudentPayload = {
                ...data,
                // Zod has already coerced and transformed this to number | null
                section: data.section
            };
            // Actually, data matches parts of StudentPayload. Let's trust the API call or cast.
            // The issue is 'section' undefined in data vs null in Payload.

            if (studentToEdit) {
                await updateStudent(studentToEdit.id, data as unknown as Partial<StudentPayload>);
            } else {
                await createStudent(data as unknown as StudentPayload);
            }
            onSuccess();
            onClose();
        } catch (error: unknown) {
            console.error("Failed to save student", error);
            const msg = error instanceof Error ? error.message : 'Unknown Error';
            alert(`Failed to save student: ${msg}`);
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
                    {/* Name Section */}
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

                    {/* Parents Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Father Name</label>
                            <input {...register('father_name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mother Name</label>
                            <input {...register('mother_name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                    </div>

                    {/* Contact & ID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Enrollment ID</label>
                            <input {...register('enrollment_number')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.enrollment_number && <p className="text-red-500 text-xs mt-1">{errors.enrollment_number.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                            <input {...register('emergency_mobile')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.emergency_mobile && <p className="text-red-500 text-xs mt-1">{errors.emergency_mobile.message}</p>}
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input type="date" {...register('date_of_birth')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <select {...register('gender')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="O">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Academic Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class</label>
                            <select {...register('current_class')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.current_class && <p className="text-red-500 text-xs mt-1">{String(errors.current_class.message)}</p>}
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

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea
                            {...register('address')}
                            rows={2}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
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
