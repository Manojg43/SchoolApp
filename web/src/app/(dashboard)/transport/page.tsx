'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Bus, MapPin, Plus, Trash2, Edit2 } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import { getVehicles, createVehicle, deleteVehicle, getRoutes, createRoute, type Vehicle, type Route } from "@/lib/api";
import Card, { CardContent } from "@/components/ui/modern/Card";
import Animate, { AnimatePage } from "@/components/ui/Animate";
import Link from 'next/link';

export default function TransportPage() {
    const { t } = useLanguage();
    const { user, hasPermission } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const [vData, rData] = await Promise.all([getVehicles(), getRoutes()]);
            setVehicles(vData);
            setRoutes(rData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (hasPermission(['is_superuser', 'transport.view_vehicle'])) {
            load();
        } else {
            setLoading(false);
        }
    }, [user, hasPermission]);

    const handleAddVehicle = async () => {
        const reg = prompt("Enter Vehicle Registration Number (e.g. MH-12-AB-1234):");
        if (!reg) return;
        const model = prompt("Enter Vehicle Model (e.g. Tata Starbus):");
        if (!model) return;
        const capacity = prompt("Enter Capacity:");
        if (!capacity) return;

        try {
            await createVehicle({ registration_number: reg, model, capacity: parseInt(capacity) });
            load();
        } catch (e) {
            alert("Failed to create vehicle");
        }
    };

    const handleAddRoute = async () => {
        const name = prompt("Enter Route Name (e.g. North City Route):");
        if (!name) return;
        try {
            await createRoute({ name, stops: [] });
            load();
        } catch (e) {
            alert("Failed to create route");
        }
    };

    const handleDeleteVehicle = async (v: Vehicle) => {
        if (!confirm("Delete vehicle?")) return;
        try {
            await deleteVehicle(v.id);
            load();
        } catch (e) {
            alert("Failed to delete vehicle");
        }
    }

    const vehicleColumns: Column<Vehicle>[] = [
        { header: "Reg Number", accessorKey: "registration_number", className: "font-mono font-bold text-text-main" },
        { header: "Model", accessorKey: "model" },
        {
            header: "Capacity",
            accessorKey: (row) => <span className="bg-surface border border-border px-2 py-0.5 rounded text-xs font-semibold">{row.capacity} Seats</span>
        },
        { header: "Driver", accessorKey: (row) => row.driver_name || <span className="text-text-muted italic">Unassigned</span> },
        {
            header: "Actions",
            accessorKey: (row) => (
                <div className="flex gap-2">
                    {hasPermission('transport.delete_vehicle') && (
                        <button onClick={() => handleDeleteVehicle(row)} className="p-1.5 hover:bg-error/10 text-error rounded transition-colors">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const routeColumns: Column<Route>[] = [
        { header: "Route Name", accessorKey: "name", className: "font-medium text-text-main" },
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
                <div className="flex gap-2">
                    <button onClick={() => alert("Edit Route (Pending)")} className="p-1.5 hover:bg-primary/10 text-primary rounded transition-colors">
                        <Edit2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AnimatePage>
            <div className="max-w-[1600px] mx-auto p-6 space-y-8">
                <header className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Transport Management</h1>
                        <p className="text-text-muted mt-1">Manage school fleet, routes, and pickup points.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Vehicles Section */}
                    <Animate animation="slideUp" delay={0.1}>
                        <Card className="h-full border-border">
                            <div className="px-6 py-5 border-b border-border bg-surface/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                                    <Bus className="w-5 h-5 text-primary" /> Fleet Management
                                </h2>
                                {hasPermission('transport.add_vehicle') && (
                                    <button
                                        onClick={handleAddVehicle}
                                        className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Bus
                                    </button>
                                )}
                            </div>
                            <DataTable
                                columns={vehicleColumns}
                                data={vehicles}
                                isLoading={loading}
                            />
                        </Card>
                    </Animate>

                    {/* Routes Section */}
                    <Animate animation="slideUp" delay={0.2}>
                        <Card className="h-full border-border">
                            <div className="px-6 py-5 border-b border-border bg-surface/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-success" /> Active Routes
                                </h2>
                                {hasPermission('transport.add_route') && (
                                    <button
                                        onClick={handleAddRoute}
                                        className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-success/20 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Route
                                    </button>
                                )}
                            </div>
                            <DataTable
                                columns={routeColumns}
                                data={routes}
                                isLoading={loading}
                            />
                        </Card>
                    </Animate>
                </div>
            </div>
        </AnimatePage>
    );
}
