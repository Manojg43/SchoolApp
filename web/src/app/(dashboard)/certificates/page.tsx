'use client';

import React, { useState, useMemo } from "react";
import { getStudents, generateCertificate, generateCertificateManual, type Student } from "@/lib/api";
import { Download, Award, FileText, Loader2, Filter, Search, PlusCircle } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import Card, { CardContent } from "@/components/ui/modern/Card";
import Animate, { AnimatePage } from "@/components/ui/Animate";
import { useCachedData } from "@/hooks/useCachedData";
import { useForm } from "react-hook-form";

export default function CertificatesPage() {
    const { data: students, loading } = useCachedData<Student[]>('students_list', getStudents);
    const [generating, setGenerating] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showManualForm, setShowManualForm] = useState(false);

    // Manual Generation Form
    interface ManualCertificateForm {
        enrollment_number: string;
        class_name: string;
        section: string;
        academic_year: string;
        type: 'bonafide' | 'character' | 'leaving';
    }

    const { register, handleSubmit, reset } = useForm<ManualCertificateForm>({
        defaultValues: {
            enrollment_number: '',
            class_name: '',
            section: '',
            academic_year: new Date().getFullYear().toString(),
            type: 'bonafide'
        }
    });

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const lowerSearch = searchTerm.toLowerCase();
        return students.filter(s =>
            s.first_name.toLowerCase().includes(lowerSearch) ||
            s.last_name.toLowerCase().includes(lowerSearch) ||
            s.enrollment_number.toLowerCase().includes(lowerSearch) ||
            (s.mobile && s.mobile.includes(lowerSearch))
        );
    }, [students, searchTerm]);

    const handleGenerate = async (idOrData: number | any, type: string, name: string, isManual = false) => {
        setGenerating(isManual ? `manual-${type}` : `${idOrData}-${type}`);
        try {
            let blob;
            if (isManual) {
                // idOrData is the data object from the form
                blob = await generateCertificateManual({ ...idOrData, type });
            } else {
                blob = await generateCertificate(idOrData, type);
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}_${type}_Certificate.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            if (isManual) setShowManualForm(false);
        } catch (e) {
            console.error("Certificate generation failed", e);
            alert("Failed to generate certificate. Please verify details.");
        } finally {
            setGenerating(null);
        }
    };

    const onManualSubmit = (data: any) => {
        // Mocking ID for manual generation or handling logic
        // true flag indicates manual generation flow
        handleGenerate(data, data.type || 'bonafide', 'Manual_Student', true);
    };

    const columns: Column<Student>[] = [
        { header: "ID", accessorKey: "enrollment_number", className: "w-24 font-mono text-xs text-text-muted" },
        {
            header: "Student",
            accessorKey: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-white">
                        {row.first_name[0]}{row.last_name[0]}
                    </div>
                    <div>
                        <div className="font-semibold text-text-main">{row.first_name} {row.last_name}</div>
                        <div className="text-xs text-text-muted flex gap-2">
                            <span>Class: {row.class_name || 'N/A'}</span>
                            <span>•</span>
                            <span>{row.mobile || 'No Mobile'}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "Actions",
            accessorKey: (row) => {
                const isProcessing = (type: string) => generating === `${row.id}-${type}`;
                return (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleGenerate(row.id, 'bonafide', row.first_name)}
                            disabled={!!generating}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            {isProcessing('bonafide') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />} Bonafide
                        </button>
                        <button
                            onClick={() => handleGenerate(row.id, 'character', row.first_name)}
                            disabled={!!generating}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            {isProcessing('character') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} Character
                        </button>
                        <button
                            onClick={() => handleGenerate(row.id, 'leaving', row.first_name)}
                            disabled={!!generating}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            {isProcessing('leaving') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Leaving
                        </button>
                    </div>
                )
            }
        }
    ];

    return (
        <AnimatePage>
            <div className="max-w-[1600px] mx-auto p-6 space-y-6">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Certificate Center</h1>
                        <p className="text-text-muted mt-1">Generate official documents. Use search to find students quickly.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowManualForm(!showManualForm)}
                            className="flex items-center gap-2 bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 text-sm font-medium"
                        >
                            <PlusCircle size={18} /> Manual Generation
                        </button>
                    </div>
                </header>

                {/* Manual Generation Form */}
                {showManualForm && (
                    <Animate animation="slideUp">
                        <Card className="border-border bg-surface shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-text-main mb-4">Manual Certificate Generation</h3>
                                <form onSubmit={handleSubmit(onManualSubmit)} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                    <div>
                                        <label className="text-xs font-medium text-text-secondary block mb-1">Type</label>
                                        <select {...register('type')} className="w-full rounded-lg border-border bg-background px-3 py-2 text-sm focus:ring-primary">
                                            <option value="bonafide">Bonafide</option>
                                            <option value="character">Character</option>
                                            <option value="leaving">Leaving</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text-secondary block mb-1">Enrollment No.</label>
                                        <input {...register('enrollment_number')} className="w-full rounded-lg border-border bg-background px-3 py-2 text-sm focus:ring-primary" placeholder="S-1234" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text-secondary block mb-1">Class</label>
                                        <input {...register('class_name')} className="w-full rounded-lg border-border bg-background px-3 py-2 text-sm focus:ring-primary" placeholder="10" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text-secondary block mb-1">Section</label>
                                        <input {...register('section')} className="w-full rounded-lg border-border bg-background px-3 py-2 text-sm focus:ring-primary" placeholder="A" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text-secondary block mb-1">Academic Year</label>
                                        <input {...register('academic_year')} className="w-full rounded-lg border-border bg-background px-3 py-2 text-sm focus:ring-primary" placeholder="2024-25" required />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!!generating}
                                        className="bg-text-main text-white hover:bg-black px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {generating?.startsWith('manual') ? 'Generating...' : 'Generate Certificate'}
                                    </button>
                                </form>
                            </div>
                        </Card>
                    </Animate>
                )}

                <Animate animation="fade" delay={0.2}>
                    <Card className="border-border overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-border bg-surface/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-lg font-bold text-text-main">Student Directory</h2>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search by name, mobile, id..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>
                        <DataTable
                            columns={columns}
                            data={filteredStudents}
                            isLoading={loading}
                        />
                    </Card>
                </Animate>
            </div>
        </AnimatePage>
    );
}
