'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, ChevronRight, ChevronDown, X, Save } from 'lucide-react';
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

const APPROVER_ROLES = [
    { value: 'OFFICE_STAFF', label: 'Office Staff' },
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'PRINCIPAL', label: 'Principal' },
    { value: 'ADMIN', label: 'Admin' },
];

export default function WorkflowSettingsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedWorkflow, setExpandedWorkflow] = useState<number | null>(null);

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        workflow_type: 'ADMISSION',
        is_active: true,
        is_default: false,
        stages: [
            { name: 'Document Verification', order: 1, is_required: true, requires_documents: true, requires_payment: false, requires_assessment: false, required_approver_role: 'OFFICE_STAFF' },
            { name: 'Entrance Test', order: 2, is_required: true, requires_documents: false, requires_payment: false, requires_assessment: true, required_approver_role: 'TEACHER' },
            { name: 'Fee Payment', order: 3, is_required: true, requires_documents: false, requires_payment: true, requires_assessment: false, required_approver_role: 'ACCOUNTANT' },
            { name: 'Final Approval', order: 4, is_required: true, requires_documents: false, requires_payment: false, requires_assessment: false, required_approver_role: 'PRINCIPAL' },
        ]
    });

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const res = await api.get('/admissions/workflows/');
            const data = Array.isArray(res) ? res : (res.results || []);
            setWorkflows(data);
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

    const handleCreateWorkflow = async () => {
        if (!formData.name.trim()) {
            toast.error('Please enter workflow name');
            return;
        }

        setSaving(true);
        try {
            await api.post('/admissions/workflows/', formData);
            toast.success('Workflow created successfully!');
            setShowCreateDialog(false);
            resetForm();
            loadWorkflows();
        } catch (error: any) {
            console.error('Failed to create workflow', error);
            toast.error(error?.message || 'Failed to create workflow');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWorkflow = async (workflowId: number) => {
        if (!confirm('Are you sure you want to delete this workflow?')) return;

        try {
            await api.delete(`/admissions/workflows/${workflowId}/`);
            toast.success('Workflow deleted');
            loadWorkflows();
        } catch (error) {
            toast.error('Failed to delete workflow');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            workflow_type: 'ADMISSION',
            is_active: true,
            is_default: false,
            stages: [
                { name: 'Document Verification', order: 1, is_required: true, requires_documents: true, requires_payment: false, requires_assessment: false, required_approver_role: 'OFFICE_STAFF' },
                { name: 'Entrance Test', order: 2, is_required: true, requires_documents: false, requires_payment: false, requires_assessment: true, required_approver_role: 'TEACHER' },
                { name: 'Fee Payment', order: 3, is_required: true, requires_documents: false, requires_payment: true, requires_assessment: false, required_approver_role: 'ACCOUNTANT' },
                { name: 'Final Approval', order: 4, is_required: true, requires_documents: false, requires_payment: false, requires_assessment: false, required_approver_role: 'PRINCIPAL' },
            ]
        });
    };

    const addStage = () => {
        setFormData({
            ...formData,
            stages: [
                ...formData.stages,
                {
                    name: '',
                    order: formData.stages.length + 1,
                    is_required: true,
                    requires_documents: false,
                    requires_payment: false,
                    requires_assessment: false,
                    required_approver_role: 'OFFICE_STAFF'
                }
            ]
        });
    };

    const removeStage = (index: number) => {
        const newStages = formData.stages.filter((_, i) => i !== index);
        // Reorder
        newStages.forEach((s, i) => s.order = i + 1);
        setFormData({ ...formData, stages: newStages });
    };

    const updateStage = (index: number, field: string, value: any) => {
        const newStages = [...formData.stages];
        (newStages[index] as any)[field] = value;
        setFormData({ ...formData, stages: newStages });
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
                        onClick={() => setShowCreateDialog(true)}
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
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                            >
                                Create First Workflow
                            </button>
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
                                            <span className="text-sm text-text-muted">{workflow.stages_count || workflow.stages?.length || 0} stages</span>
                                            {!workflow.is_default && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSetDefault(workflow.id); }}
                                                    className="text-xs px-3 py-1 border border-primary text-primary rounded-lg hover:bg-primary/10"
                                                >
                                                    Set as Default
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(workflow.id); }}
                                                className="text-xs px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Stages */}
                                    {expandedWorkflow === workflow.id && workflow.stages && workflow.stages.length > 0 && (
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

                {/* Create Workflow Dialog */}
                {showCreateDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h2 className="text-xl font-bold">Create Admission Workflow</h2>
                                <button onClick={() => setShowCreateDialog(false)} className="p-2 hover:bg-surface rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Workflow Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Standard Admission"
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Workflow Type</label>
                                        <select
                                            value={formData.workflow_type}
                                            onChange={(e) => setFormData({ ...formData, workflow_type: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            {Object.entries(WORKFLOW_TYPES).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_default}
                                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm">Set as Default</span>
                                    </label>
                                </div>

                                {/* Stages */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold">Workflow Stages</h3>
                                        <button
                                            type="button"
                                            onClick={addStage}
                                            className="text-sm px-3 py-1 border border-primary text-primary rounded-lg hover:bg-primary/10"
                                        >
                                            + Add Stage
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.stages.map((stage, index) => (
                                            <div key={index} className="p-4 border border-border rounded-lg bg-surface/50">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                                                        {stage.order}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={stage.name}
                                                        onChange={(e) => updateStage(index, 'name', e.target.value)}
                                                        placeholder="Stage name"
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    />
                                                    <select
                                                        value={stage.required_approver_role}
                                                        onChange={(e) => updateStage(index, 'required_approver_role', e.target.value)}
                                                        className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    >
                                                        {APPROVER_ROLES.map(role => (
                                                            <option key={role.value} value={role.value}>{role.label}</option>
                                                        ))}
                                                    </select>
                                                    {formData.stages.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeStage(index)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex gap-4 text-sm">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={stage.is_required}
                                                            onChange={(e) => updateStage(index, 'is_required', e.target.checked)}
                                                            className="w-4 h-4 rounded border-gray-300"
                                                        />
                                                        <span>Required</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={stage.requires_documents}
                                                            onChange={(e) => updateStage(index, 'requires_documents', e.target.checked)}
                                                            className="w-4 h-4 rounded border-gray-300"
                                                        />
                                                        <span>Requires Documents</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={stage.requires_payment}
                                                            onChange={(e) => updateStage(index, 'requires_payment', e.target.checked)}
                                                            className="w-4 h-4 rounded border-gray-300"
                                                        />
                                                        <span>Requires Payment</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={stage.requires_assessment}
                                                            onChange={(e) => updateStage(index, 'requires_assessment', e.target.checked)}
                                                            className="w-4 h-4 rounded border-gray-300"
                                                        />
                                                        <span>Requires Assessment</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 p-4 border-t border-border">
                                <button
                                    onClick={() => setShowCreateDialog(false)}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateWorkflow}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Creating...' : 'Create Workflow'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnimatePage>
    );
}
