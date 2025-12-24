'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { createVehicle } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Bus, User, MapPin, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateVehiclePage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Vehicle State
    const [regNumber, setRegNumber] = useState('');
    const [model, setModel] = useState('');
    const [capacity, setCapacity] = useState('');
    const [fitnessUpto, setFitnessUpto] = useState('');

    // Driver State
    const [driverName, setDriverName] = useState('');
    const [driverAge, setDriverAge] = useState('');
    const [driverMobile, setDriverMobile] = useState('');

    // Routes State
    const [routes, setRoutes] = useState<{ name: string }[]>([]);

    const addRoute = () => {
        setRoutes([...routes, { name: '' }]);
    };

    const removeRoute = (index: number) => {
        setRoutes(routes.filter((_, i) => i !== index));
    };

    const updateRoute = (index: number, val: string) => {
        const newRoutes = [...routes];
        newRoutes[index].name = val;
        setRoutes(newRoutes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await createVehicle({
                registration_number: regNumber,
                model,
                capacity: parseInt(capacity),
                fitness_upto: fitnessUpto || undefined,
                driver_name: driverName,
                driver_age: driverAge ? parseInt(driverAge) : undefined,
                driver_mobile: driverMobile,
                routes: routes.filter(r => r.name.trim() !== '') // Send nested routes
            });
            toast.success('Vehicle and Routes Created Successfully!');
            router.push('/transport');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create vehicle', 'Please try again');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/transport" className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Vehicle Details */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bus className="w-5 h-5 text-blue-600" /> Vehicle Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                                <input
                                    required
                                    className="w-full rounded-lg border-gray-300 uppercase font-mono"
                                    placeholder="MH-12-AB-1234"
                                    value={regNumber}
                                    onChange={e => setRegNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                                <input
                                    required
                                    className="w-full rounded-lg border-gray-300"
                                    placeholder="Tata Starbus"
                                    value={model}
                                    onChange={e => setModel(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full rounded-lg border-gray-300"
                                    value={capacity}
                                    onChange={e => setCapacity(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fitness Valid Upto</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border-gray-300"
                                    value={fitnessUpto}
                                    onChange={e => setFitnessUpto(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Driver Details */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-green-600" /> Driver Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                                <input
                                    className="w-full rounded-lg border-gray-300"
                                    placeholder="Full Name"
                                    value={driverName}
                                    onChange={e => setDriverName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border-gray-300"
                                    value={driverAge}
                                    onChange={e => setDriverAge(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                <input
                                    type="tel"
                                    className="w-full rounded-lg border-gray-300"
                                    placeholder="9876543210"
                                    value={driverMobile}
                                    onChange={e => setDriverMobile(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Routes */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-600" /> Associated Routes
                            </h2>
                            <button
                                type="button"
                                onClick={addRoute}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Route
                            </button>
                        </div>

                        {routes.length === 0 ? (
                            <p className="text-gray-500 italic text-sm">No routes added yet. Click "Add Route" to define routes for this vehicle.</p>
                        ) : (
                            <div className="space-y-3">
                                {routes.map((route, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <span className="text-gray-400 font-mono text-sm w-6">{idx + 1}.</span>
                                        <input
                                            required
                                            className="flex-1 rounded-lg border-gray-300"
                                            placeholder="Route Name (e.g. Morning Route - North)"
                                            value={route.name}
                                            onChange={e => updateRoute(idx, e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeRoute(idx)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Vehicle & Routes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
