import { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { Vehicle, createVehicle, deleteVehicle } from "@/lib/api";
import { Bus, Plus, Trash2, Phone, User } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import Card from "@/components/ui/modern/Card";
import { toast } from "@/lib/toast";
import Modal from "@/components/ui/modern/Modal";

interface VehicleManagerProps {
    vehicles: Vehicle[];
    loading: boolean;
    onRefresh: () => void;
    page: number;
    onPageChange: (page: number) => void;
}

export default function VehicleManager({ vehicles, loading, onRefresh, page, onPageChange }: VehicleManagerProps) {
    const { hasPermission } = useAuth();
    const [isaddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        registration_number: '',
        model: '',
        capacity: '',
        driver_name: '',
        driver_mobile: ''
    });

    const [pagination, setPagination] = useState({
        hasNext: false,
        hasPrevious: false,
        count: 0
    });

    useEffect(() => {
        if (vehicles && (vehicles as any).__pagination) {
            const meta = (vehicles as any).__pagination;
            setPagination({
                hasNext: !!meta.next,
                hasPrevious: !!meta.previous,
                count: meta.count
            });
        }
    }, [vehicles]);

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
            await createVehicle({
                ...formData,
                capacity: parseInt(formData.capacity)
            });
            toast.success('Vehicle added successfully');
            setIsAddModalOpen(false);
            setFormData({ registration_number: '', model: '', capacity: '', driver_name: '', driver_mobile: '' });
            onRefresh();
        } catch (error) {
            toast.error('Failed to add vehicle');
        }
    };

    const handleDelete = (v: Vehicle) => {
        toast.confirm({
            title: 'Delete Vehicle?',
            description: `Permanently delete ${v.registration_number}?`,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await deleteVehicle(v.id);
                    toast.success('Vehicle deleted');
                    onRefresh();
                } catch (e) {
                    toast.error('Failed to delete');
                }
            }
        });
    };

    const columns: Column<Vehicle>[] = [
        {
            header: "Vehicle Info",
            accessorKey: (row) => (
                <div>
                    <div className="font-bold text-text-main font-mono">{row.registration_number}</div>
                    <div className="text-xs text-text-muted">{row.model}</div>
                </div>
            )
        },
        {
            header: "Capacity",
            accessorKey: (row) => <span className="bg-surface border border-border px-2 py-0.5 rounded text-xs font-semibold">{row.capacity} Seats</span>
        },
        {
            header: "Driver Details",
            accessorKey: (row) => (
                <div className="flex flex-col text-sm">
                    <span className="flex items-center gap-1"><User size={12} className="text-primary" /> {row.driver_name || '-'}</span>
                    {row.driver_mobile && <span className="flex items-center gap-1 text-text-muted"><Phone size={12} /> {row.driver_mobile}</span>}
                </div>
            )
        },
        {
            header: "Actions",
            accessorKey: (row) => (
                hasPermission('transport.delete_vehicle') && (
                    <button onClick={() => handleDelete(row)} className="p-1.5 hover:bg-error/10 text-error rounded transition-colors">
                        <Trash2 size={16} />
                    </button>
                )
            )
        }
    ];

    return (
        <Card className="h-full border-border flex flex-col">
            <div className="px-6 py-5 border-b border-border bg-surface/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <Bus className="w-5 h-5 text-primary" /> Fleet Management
                </h2>
                {hasPermission('transport.add_vehicle') && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Bus
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={vehicles}
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

            <Modal isOpen={isaddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Vehicle">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Reg Number *</label>
                            <input
                                required
                                value={formData.registration_number}
                                onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                                placeholder="KA-01-AB-1234"
                                className="w-full p-2 border rounded bg-surface text-text-main uppercase font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Model *</label>
                            <input
                                required
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                placeholder="Tata Starbus"
                                className="w-full p-2 border rounded bg-surface text-text-main"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Capacity *</label>
                        <input
                            type="number"
                            required
                            value={formData.capacity}
                            onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                            className="w-full p-2 border rounded bg-surface text-text-main"
                        />
                    </div>
                    <div className="border-t pt-2 mt-2">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Driver Info (Optional)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    value={formData.driver_name}
                                    onChange={e => setFormData({ ...formData, driver_name: e.target.value })}
                                    className="w-full p-2 border rounded bg-surface text-text-main"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mobile</label>
                                <input
                                    value={formData.driver_mobile}
                                    onChange={e => setFormData({ ...formData, driver_mobile: e.target.value })}
                                    className="w-full p-2 border rounded bg-surface text-text-main"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-text-muted hover:bg-surface-hover rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">Create Vehicle</button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
}
