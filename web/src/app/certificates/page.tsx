'use client';

import React, { useEffect, useState } from "react";
import { getStudents, generateCertificate, type Student } from "@/lib/api";
import { Download, Award, FileText, Loader2, Filter } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import Card, { CardContent } from "@/components/ui/modern/Card";
import Animate, { AnimatePage } from "@/components/ui/Animate";

export default function CertificatesPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getStudents();
                setStudents(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleGenerate = async (studentId: number, type: string, studentName: string) => {
        setGenerating(`${studentId}-${type}`);
        try {
            const blob = await generateCertificate(studentId, type);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${studentName}_${type}_Certificate.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Certificate generation failed", e);
            alert("Failed to generate certificate. Please try again.");
        } finally {
            setGenerating(null);
        }
    };

    const columns: Column<Student>[] = [
        { header: "ID", accessorKey: "enrollment_number", className: "w-24 font-mono text-xs text-text-muted" },
        {
            header: "Student",
            accessorKey: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {row.first_name[0]}{row.last_name[0]}
                    </div>
                    <div>
                        <div className="font-semibold text-text-main">{row.first_name} {row.last_name}</div>
                        <div className="text-xs text-text-muted">Class: {row.class_name || 'N/A'}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Generate Certificates",
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
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Certificate Center</h1>
                        <p className="text-text-muted mt-1">Generate official school documents, character certificates, and leaving letters.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-xl text-text-muted hover:text-text-main transition-colors text-sm font-medium">
                            <Filter size={16} /> Filter by Class
                        </button>
                    </div>
                </header>

                <Animate animation="fade" delay={0.2}>
                    <Card className="border-border overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-surface/50">
                            <h2 className="text-lg font-bold text-text-main">Student Directory</h2>
                        </div>
                        <DataTable
                            columns={columns}
                            data={students}
                            isLoading={loading}
                        />
                    </Card>
                </Animate>
            </div>
        </AnimatePage>
    );
}
