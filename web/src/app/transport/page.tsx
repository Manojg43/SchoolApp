'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Bus, MapPin, Plus } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import { getVehicles, createVehicle, deleteVehicle, getRoutes, createRoute, type Vehicle, type Route } from "@/lib/api";

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

        // MVP: Empty stops for now, or prompt for 1 stop
        try {
            await createRoute({ name, stops: [] }); // Backend serializer must support empty stops or we handle it
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
        { header: "Reg Number", accessorKey: "registration_number", className: "font-mono font-bold" },
        { header: "Model", accessorKey: "model" },
        { header: "Capacity", accessorKey: "capacity" },
        { header: "Driver", accessorKey: (row) => row.driver_name || "Unassigned" },
    ];

    const routeColumns: Column<Route>[] = [
        { header: "Route Name", accessorKey: "name", className: "font-medium" },
        { header: "Stops", accessorKey: (row) => (row.stops?.length || 0) + " Stops" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transport Management</h1>
                    <p className="text-gray-500">Manage Buses, Routes, and Stops</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vehicles Section */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-blue-50">
                        <h2 className="text-lg font-medium text-blue-900 flex items-center gap-2">
                            <Bus className="w-5 h-5" /> Vehicles
                        </h2>
                        {hasPermission('transport.add_vehicle') && (
                            <Link href="/transport/create" className="p-1 hover:bg-white rounded-full transition-colors inline-block">
                                <Plus className="w-5 h-5 text-blue-700" />
                            </Link>
                        )}
                    </div>
                    <DataTable
                        columns={vehicleColumns}
                        data={vehicles}
                        isLoading={loading}
                        onDelete={hasPermission('transport.delete_vehicle') ? handleDeleteVehicle : undefined}
                    />
                </div>

                {/* Routes Section */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-green-50">
                        <h2 className="text-lg font-medium text-green-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Routes
                        </h2>
                        {hasPermission('transport.add_route') && (
                            <button onClick={handleAddRoute} className="p-1 hover:bg-white rounded-full transition-colors">
                                <Plus className="w-5 h-5 text-green-700" />
                            </button>
                        )}
                    </div>
                    <DataTable
                        columns={routeColumns}
                        data={routes}
                        isLoading={loading}
                        onEdit={hasPermission('transport.change_route') ? () => alert("Edit Route (Pending)") : undefined}
                    />
                </div>
            </div>
        </div>
    );
}
