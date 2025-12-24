import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, Edit2, Save, Trash2, Phone, Calendar, MapPin, Hash, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClasses, getSections, createStudent, updateStudent, type Student, type ClassItem, type SectionItem, type StudentPayload } from '@/lib/api';
import Animate from '@/components/ui/Animate';
import { toast } from '@/lib/toast';

// Reuse Schema
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
    current_class: z.coerce.number().min(1, "Class is required"),
    section: z.coerce.number().nullable().optional().transform(val => (val === 0 || !val) ? null : val),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    student: Student | null; // If null, we are adding new
    mode?: 'view' | 'edit' | 'create'; // Initial mode
}

export default function StudentProfileDrawer({ isOpen, onClose, onSuccess, student, mode = 'view' }: StudentProfileDrawerProps) {
    const [activeMode, setActiveMode] = useState<'view' | 'edit' | 'create'>(mode);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [filteredSections, setFilteredSections] = useState<SectionItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Sync internal mode with prop when it opens
    useEffect(() => {
        if (isOpen) {
            setActiveMode(student ? (mode === 'create' ? 'create' : mode) : 'create');
        }
    }, [isOpen, student, mode]);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema) as any,
        defaultValues: {
            gender: 'M',
            current_class: 0,
            section: null,
            first_name: '', last_name: '', father_name: '', mother_name: '',
            enrollment_number: '', emergency_mobile: '', date_of_birth: '', address: ''
        }
    });

    // Load Meta
    useEffect(() => {
        if (isOpen) {
            Promise.all([getClasses(), getSections()]).then(([c, s]) => {
                setClasses(c);
                setSections(s);
            }).catch(console.error);
        }
    }, [isOpen]);

    // Populate Form
    useEffect(() => {
        if (student && isOpen) {
            setValue('first_name', student.first_name);
            setValue('last_name', student.last_name);
            setValue('father_name', student.father_name);
            setValue('mother_name', student.mother_name || '');
            setValue('enrollment_number', student.enrollment_number);
            setValue('emergency_mobile', student.emergency_mobile);
            setValue('date_of_birth', student.date_of_birth);
            setValue('gender', student.gender as any);
            setValue('address', student.address || '');
            if (student.current_class) setValue('current_class', student.current_class);
            if (student.section) setValue('section', student.section);
        } else if (isOpen && activeMode === 'create') {
            reset();
        }
    }, [student, isOpen, activeMode, reset, setValue]);

    // Filter Sections
    const selectedClassId = watch('current_class');
    useEffect(() => {
        if (selectedClassId) {
            const cid = Number(selectedClassId);
            const filtered = sections.filter(s => s.parent_class === cid);
            setFilteredSections(filtered);
        } else {
            setFilteredSections([]);
        }
    }, [selectedClassId, sections]);

    const onSubmit = async (data: StudentFormValues) => {
        setLoading(true);
        try {
            const payload: StudentPayload = { ...data, section: data.section };
            if (student && activeMode === 'edit') {
                await updateStudent(student.id, payload as any);
            } else {
                await createStudent(payload as any);
            }
            onSuccess();
            onClose();
        } catch (e: any) {
            toast.error('Error saving student', e.message);
        } finally {
            setLoading(false);
        }
    };

    // View Component
    const ViewProfile = () => {
        if (!student) return null;
        return (
            <div className="space-y-6 pt-2">
                {/* Header Profile */}
                <div className="flex flex-col items-center justify-center space-y-3 pb-6 border-b border-border">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl border-4 border-surface shadow-sm">
                        {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-text-main">{student.first_name} {student.last_name}</h3>
                        <p className="text-sm text-text-muted">ID: {student.enrollment_number}</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${student.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                                {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Academic Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                                <BookOpen size={14} /> Class
                            </div>
                            <div className="font-semibold text-text-main">{student.class_name || 'N/A'}</div>
                        </div>
                        <div className="p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                                <Hash size={14} /> Section
                            </div>
                            <div className="font-semibold text-text-main">{student.section_name || 'N/A'}</div>
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mt-6">Personal Information</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors">
                            <Calendar className="text-primary w-5 h-5" />
                            <div>
                                <div className="text-xs text-text-muted">Date of Birth</div>
                                <div className="text-sm font-medium">{student.date_of_birth}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors">
                            <Phone className="text-success w-5 h-5" />
                            <div>
                                <div className="text-xs text-text-muted">Emergency Mobile</div>
                                <div className="text-sm font-medium">{student.emergency_mobile}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors">
                            <User className="text-warning w-5 h-5" />
                            <div>
                                <div className="text-xs text-text-muted">Parents</div>
                                <div className="text-sm font-medium">{student.father_name} & {student.mother_name || '-'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors">
                            <MapPin className="text-error w-5 h-5" />
                            <div>
                                <div className="text-xs text-text-muted">Address</div>
                                <div className="text-sm font-medium">{student.address || 'No Address Provided'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        onClick={() => setActiveMode('edit')}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Edit2 size={18} /> Edit Student Profile
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
                            <h2 className="text-xl font-bold text-text-main">
                                {activeMode === 'create' ? 'Add New Student' : (activeMode === 'edit' ? 'Edit Profile' : 'Student Profile')}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors text-text-muted hover:text-text-main">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {activeMode === 'view' ? (
                                <ViewProfile />
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">First Name</label>
                                            <input {...register('first_name')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                                            {errors.first_name && <p className="text-error text-xs">{errors.first_name.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Last Name</label>
                                            <input {...register('last_name')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                                            {errors.last_name && <p className="text-error text-xs">{errors.last_name.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Father Name</label>
                                            <input {...register('father_name')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                                            {errors.father_name && <p className="text-error text-xs">{errors.father_name.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Mother Name</label>
                                            <input {...register('mother_name')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Enrollment ID</label>
                                            <input {...register('enrollment_number')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                                            {errors.enrollment_number && <p className="text-error text-xs">{errors.enrollment_number.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Mobile</label>
                                            <input {...register('emergency_mobile')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                                            {errors.emergency_mobile && <p className="text-error text-xs">{errors.emergency_mobile.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">DOB</label>
                                            <input type="date" {...register('date_of_birth')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                                            {errors.date_of_birth && <p className="text-error text-xs">{errors.date_of_birth.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Gender</label>
                                            <select {...register('gender')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none">
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                                <option value="O">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Class</label>
                                            <select {...register('current_class')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none">
                                                <option value="0">Select Class</option>
                                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            {errors.current_class && <p className="text-error text-xs">{String(errors.current_class.message)}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-text-muted uppercase">Section</label>
                                            <select {...register('section')} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" disabled={!selectedClassId}>
                                                <option value="">Select Section</option>
                                                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-text-muted uppercase">Address</label>
                                        <textarea {...register('address')} rows={3} className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
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
