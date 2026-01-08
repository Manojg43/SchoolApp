'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getVehicles, getRoutes, type Vehicle, type Route } from "@/lib/api";
import Animate, { AnimatePage } from "@/components/ui/Animate";
import VehicleManager from "@/components/transport/VehicleManager";
import RouteManager from "@/components/transport/RouteManager";

export default function TransportPage() {
    const { t } = useLanguage();
    const { user, hasPermission } = useAuth();

    // Data State
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [vehiclePage, setVehiclePage] = useState(1);
    const [routePage, setRoutePage] = useState(1);

    async function load() {
        setLoading(true);
        try {
            const [vData, rData] = await Promise.all([
                getVehicles(undefined, vehiclePage),
                getRoutes(undefined, routePage)
            ]);
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
    }, [user, hasPermission, vehiclePage, routePage]);

    return (
        <AnimatePage>
            <div className="max-w-[1600px] mx-auto p-6 space-y-8">
                <header className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Transport Management</h1>
                        <p className="text-text-muted mt-1">Manage school fleet, routes, and pickup points.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                    {/* Vehicles Section */}
                    <Animate animation="slideUp" delay={0.1} className="h-full">
                        <VehicleManager
                            vehicles={vehicles}
                            loading={loading}
                            onRefresh={load}
                            page={vehiclePage}
                            onPageChange={setVehiclePage}
                        />
                    </Animate>

                    {/* Routes Section */}
                    <Animate animation="slideUp" delay={0.2} className="h-full">
                        <RouteManager
                            routes={routes}
                            loading={loading}
                            onRefresh={load}
                            page={routePage}
                            onPageChange={setRoutePage}
                        />
                    </Animate>
                </div>
            </div>
        </AnimatePage>
    );
}
