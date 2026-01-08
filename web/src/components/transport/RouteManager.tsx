import { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { Route, createRoute, updateRoute, deleteRoute } from "@/lib/api";
import { MapPin, Plus, Edit2, Navigation, Trash2, X, Save } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import Card from "@/components/ui/modern/Card";
import { toast } from "@/lib/toast";
import Modal from "@/components/ui/modern/Modal";

interface RouteManagerProps {
    routes: Route[];
    loading: boolean;
    onRefresh: () => void;
    page: number;
    onPageChange: (page: number) => void;
}

export default function RouteManager({ routes, loading, onRefresh, page, onPageChange }: RouteManagerProps) {
    const { hasPermission } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [routeName, setRouteName] = useState('');

    // Stop Management State
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [stops, setStops] = useState<{ id?: number; name: string; fee_amount: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Pagination state derived from routes metadata
    const [pagination, setPagination] = useState({ hasNext: false, hasPrevious: false });

    useEffect(() => {
        if (routes && (routes as any).__pagination) {
            const meta = (routes as any).__pagination;
            setPagination({
                hasNext: !!meta.next,
                hasPrevious: !!meta.previous
            });
        }
    }, [routes]);

    const handleNext = () => {
        if (pagination.hasNext) {
            onPageChange(page + 1);
        }
    };

    const handlePrevious = () => {
        if (pagination.hasPrevious) {
            onPageChange(page - 1);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createRoute({ name: routeName, stops: [] });
            toast.success('Route created');
            setIsAddModalOpen(false);
            setRouteName('');
            onRefresh();
        } catch (error) {
            toast.error('Failed to create route');
        }
    };

    const handleEdit = (route: Route) => {
        setEditingRoute(route);
        setStops(route.stops || []);
    };

    const handleAddStop = () => {
        setStops([...stops, { name: '', fee_amount: '0.00' }]);
    };

    const handleRemoveStop = (index: number) => {
        setStops(stops.filter((_, i) => i !== index));
    };

    const handleStopChange = (index: number, field: string, value: string) => {
        const newStops = [...stops];
        (newStops[index] as any)[field] = value;
        setStops(newStops);
    };

    const handleSaveStops = async () => {
        if (!editingRoute) return;
        setIsSaving(true);
        try {
            await updateRoute(editingRoute.id, {
                name: editingRoute.name,
                stops: stops as any
            });
            toast.success('Route updated successfully');
            setEditingRoute(null);
            onRefresh();
        } catch (error) {
            toast.error('Failed to update route');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this route?')) return;
        try {
            await deleteRoute(id);
            toast.success('Route deleted');
            onRefresh();
        } catch (error) {
            toast.error('Failed to delete route');
        }
    };

    const columns: Column<Route>[] = [
        {
            header: "Route Name",
            accessorKey: (row) => (
                <div className="flex items-center gap-2">
                    <Navigation size={16} className="text-secondary" />
                    <span className="font-medium text-text-main">{row.name}</span>
                </div>
            )
        },
        {
            header: "Stops",
            accessorKey: (row) => (
                <span className="flex items-center gap-1 text-text-muted text-sm">
                    <MapPin size={14} /> {(row.stops?.length || 0)} Stops
                </span>
            )
        },
        {
            header: "Actions",
            accessorKey: (row) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(row)} className="p-1.5 hover:bg-surface-hover text-primary rounded transition-colors" title="Manage Stops">
                        <Edit2 size={16} />
                    </button>
                    {hasPermission('transport.delete_route') && (
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors" title="Delete Route">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <Card className="h-full border-border flex flex-col">
            <div className="px-6 py-5 border-b border-border bg-surface/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-success" /> Active Routes
                </h2>
                {hasPermission('transport.add_route') && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-success/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Route
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={routes}
                    isLoading={loading}
                    pagination={{
                        currentPage: page,
                        hasNext: pagination.hasNext,
                        hasPrevious: pagination.hasPrevious,
                        onNext: handleNext,
                        onPrevious: handlePrevious
                    }}
                />
            </div>

            {/* Create Route Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Route">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Route Name *</label>
                        <input
                            required
                            value={routeName}
                            onChange={e => setRouteName(e.target.value)}
                            placeholder="e.g. Route 1 - North City"
                            className="w-full p-2 border rounded bg-surface text-text-main"
                        />
                        <p className="text-xs text-text-muted mt-1">You can add stops after creating the route.</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-text-muted hover:bg-surface-hover rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-success text-white rounded hover:bg-success-dark">Create Route</button>
                    </div>
                </form>
            </Modal>

            {/* Manage Stops Modal */}
            <Modal isOpen={!!editingRoute} onClose={() => setEditingRoute(null)} title={`Manage Stops: ${editingRoute?.name}`} size="lg">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Route Stops</h3>
                        <button
                            onClick={handleAddStop}
                            className="text-xs flex items-center gap-1 text-primary hover:underline font-bold"
                        >
                            <Plus size={14} /> Add Stop
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                        {stops.length === 0 ? (
                            <div className="text-center py-8 bg-surface/30 rounded-lg border border-dashed border-border">
                                <p className="text-sm text-text-muted">No stops added to this route yet.</p>
                            </div>
                        ) : (
                            stops.map((stop, index) => (
                                <div key={index} className="flex gap-3 items-start bg-surface/50 p-3 rounded-lg border border-border group animate-in fade-in slide-in-from-top-2">
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted uppercase ml-1">Stop Name</label>
                                            <input
                                                value={stop.name}
                                                onChange={e => handleStopChange(index, 'name', e.target.value)}
                                                placeholder="Stop Name"
                                                className="w-full p-1.5 text-sm border rounded bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted uppercase ml-1">Fee Amount</label>
                                            <input
                                                type="number"
                                                value={stop.fee_amount}
                                                onChange={e => handleStopChange(index, 'fee_amount', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full p-1.5 text-sm border rounded bg-white"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStop(index)}
                                        className="mt-6 p-1.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            onClick={() => setEditingRoute(null)}
                            className="px-4 py-2 text-sm text-text-muted hover:bg-surface-hover rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveStops}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm rounded hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
}
