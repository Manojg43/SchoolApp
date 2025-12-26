'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { AnimatePage } from '@/components/ui/Animate';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/modern/Card';
import api from '@/lib/api';
import { toast } from '@/lib/toast';

interface Stage {
    id: number;
    name: string;
    order: number;
    is_required: boolean;
    requires_documents: boolean;
    requires_payment: boolean;
    requires_assessment: boolean;
    required_approver_role: string;
    assessments: any[];
}

interface Workflow {
    id: number;
    name: string;
    workflow_type: string;
    is_active: boolean;
    is_default: boolean;
    stages: Stage[];
    stages_count: number;
}

const WORKFLOW_TYPES: Record<string, string> = {
    'ADMISSION': 'Admission Enquiry',
    'SCHOLARSHIP': 'Scholarship Application',
    'TRANSPORT': 'Transport Request',
    'HOSTEL': 'Hostel Application',
    'CUSTOM': 'Custom Workflow',
};

export default function WorkflowSettingsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedWorkflow, setExpandedWorkflow] = useState<number | null>(null);

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const res = await api.get('/admissions/workflows/');
            setWorkflows(res.data.results || res.data);
        } catch (error) {
            console.error('Failed to load workflows', error);
            toast.error('Failed to load workflows');
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (workflowId: number) => {
        try {
            await api.post(`/admissions/workflows/${workflowId}/set_default/`);
            toast.success('Default workflow updated');
            loadWorkflows();
        } catch (error) {
            toast.error('Failed to set default');
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedWorkflow(expandedWorkflow === id ? null : id);
    };

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-6 space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Workflow Settings</h1>
                        <p className="text-text-muted">Configure admission workflow stages and assessments</p>
                    </div>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                    >
                        <Plus className="w-4 h-4" />
                        New Workflow
                    </button>
                </div>

                {/* Info Card */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Workflow Templates</strong> define the stages an enquiry goes through before admission.
                            Each stage can require documents, payments, or assessments. You can create multiple workflows
                            for different admission types (regular, scholarship, etc.)
                        </p>
                    </CardContent>
                </Card>

                {/* Workflows List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : workflows.length === 0 ? (
                    <Card>
                        <CardContent className="py-20 text-center">
                            <Settings className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-30" />
                            <p className="text-text-muted">No workflows configured yet</p>
                            <p className="text-sm text-text-muted mt-2">Create your first admission workflow to get started</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {workflows.map((workflow) => (
                            <Card key={workflow.id}>
                                <CardContent className="p-0">
                                    {/* Workflow Header */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-background/50"
                                        onClick={() => toggleExpand(workflow.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedWorkflow === workflow.id ? (
                                                <ChevronDown className="w-5 h-5 text-text-muted" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-text-muted" />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-text-main">{workflow.name}</h3>
                                                    {workflow.is_default && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Default</span>
                                                    )}
                                                    {!workflow.is_active && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-muted">{WORKFLOW_TYPES[workflow.workflow_type]}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-text-muted">{workflow.stages_count} stages</span>
                                            {!workflow.is_default && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSetDefault(workflow.id); }}
                                                    className="text-xs px-3 py-1 border border-primary text-primary rounded-lg hover:bg-primary/10"
                                                >
                                                    Set as Default
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Stages */}
                                    {expandedWorkflow === workflow.id && workflow.stages.length > 0 && (
                                        <div className="border-t border-border bg-background/30">
                                            <div className="p-4 space-y-3">
                                                {workflow.stages.map((stage, index) => (
                                                    <div key={stage.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-border">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                                                            {stage.order}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{stage.name}</p>
                                                            <div className="flex gap-3 mt-1 text-xs text-text-muted">
                                                                {stage.is_required && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">Required</span>}
                                                                {stage.requires_documents && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded">Documents</span>}
                                                                {stage.requires_payment && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded">Payment</span>}
                                                                {stage.requires_assessment && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded">Assessment</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-text-muted">
                                                            Approver: <span className="font-medium">{stage.required_approver_role}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AnimatePage>
    );
}
