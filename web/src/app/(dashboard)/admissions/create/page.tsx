'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { AnimatePage } from '@/components/ui/Animate';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import api from '@/lib/api';
import { toast } from '@/lib/toast';

interface ClassOption {
    id: number;
    name: string;
}

export default function CreateEnquiryPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState<ClassOption[]>([]);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'M',
        class_applied: '',
        parent_name: '',
        parent_mobile: '',
        parent_email: '',
        parent_occupation: '',
        address: '',
        previous_school_name: '',
        previous_class: '',
        previous_percentage: '',
        referred_by: '',
        priority: 'NORMAL',
        notes: '',
    });

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            const data = await api.get('/classes/');
            // api.get uses fetchWithSchool which returns unwrapped data directly
            setClasses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.first_name || !formData.last_name || !formData.parent_mobile || !formData.date_of_birth) {
            toast.error('Please fill required fields');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                class_applied: formData.class_applied || null,
                previous_percentage: formData.previous_percentage || null,
            };

            await api.post('/admissions/enquiries/', payload);
            toast.success('Enquiry created successfully!');
            router.push('/admissions');
        } catch (error: any) {
            console.error('Failed to create enquiry', error);
            toast.error(error.response?.data?.detail || 'Failed to create enquiry');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-6 space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">New Admission Enquiry</h1>
                        <p className="text-text-muted">Fill student and parent details</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Student Details */}
                    <Card>
                        <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">First Name *</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Gender *</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Class Applied For</label>
                                <select
                                    name="class_applied"
                                    value={formData.class_applied}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parent Details */}
                    <Card>
                        <CardHeader><CardTitle>Parent / Guardian Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Parent Name *</label>
                                <input
                                    type="text"
                                    name="parent_name"
                                    value={formData.parent_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                                <input
                                    type="tel"
                                    name="parent_mobile"
                                    value={formData.parent_mobile}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    name="parent_email"
                                    value={formData.parent_email}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Occupation</label>
                                <input
                                    type="text"
                                    name="parent_occupation"
                                    value={formData.parent_occupation}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Previous School */}
                    <Card>
                        <CardHeader><CardTitle>Previous School (if applicable)</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">School Name</label>
                                <input
                                    type="text"
                                    name="previous_school_name"
                                    value={formData.previous_school_name}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Previous Class</label>
                                <input
                                    type="text"
                                    name="previous_class"
                                    value={formData.previous_class}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Percentage</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="previous_percentage"
                                    value={formData.previous_percentage}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info */}
                    <Card>
                        <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Referred By</label>
                                <input
                                    type="text"
                                    name="referred_by"
                                    value={formData.referred_by}
                                    onChange={handleChange}
                                    placeholder="Who referred this student?"
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Any additional notes..."
                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2.5 border border-border rounded-lg hover:bg-surface transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Create Enquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </AnimatePage>
    );
}
