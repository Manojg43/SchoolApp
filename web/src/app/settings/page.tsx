'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { Save, Upload, RefreshCw, MapPin } from "lucide-react";
import { useAuth, PermissionGuard } from "@/context/AuthContext";
import {
    getSchoolSettings, updateSchoolSettings, regenerateQR,
    SchoolSettings
} from "@/lib/api";
import QRCode from "react-qr-code";

export default function SettingsPage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Partial<SchoolSettings>>({});

    // QR State
    const [qrData, setQrData] = useState<{ token: string, expires_in: number, school_name: string } | null>(null);
    const [qrLoading, setQrLoading] = useState(false);

    useEffect(() => {
        loadSettings();
        if (user?.role !== 'DRIVER' && user?.role !== 'TEACHER') {
            loadQR(); // Only load for admins
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            const data = await getSchoolSettings();
            setSettings(data);
        } catch (e) {
            console.error("Failed to load settings", e);
        } finally {
            setLoading(false);
        }
    };

    const loadQR = async () => {
        setQrLoading(true);
        try {
            const data = await regenerateQR();
            setQrData({
                token: data.qr_token,
                expires_in: data.expires_in,
                school_name: data.school_name
            });
        } catch (e) {
            console.error("Failed to load QR", e);
        } finally {
            setQrLoading(false);
        }
    };

    const handleFileChange = (field: keyof SchoolSettings, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSettings(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSchoolSettings(settings);
            alert("Settings saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
            <header className="mb-8 border-b pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings & Branding</h1>
                    <p className="text-gray-500">Customize your school identity and configuration.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">

                {/* Branding Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2">School Identity</h2>

                    <div className="space-y-6">
                        {/* School Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                            <input
                                type="text"
                                value={settings.name || ''}
                                onChange={e => setSettings({ ...settings, name: e.target.value })}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                value={settings.address || ''}
                                onChange={e => setSettings({ ...settings, address: e.target.value })}
                                className="w-full p-2 border rounded-md h-20"
                            />
                        </div>

                        {/* Logo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300 overflow-hidden">
                                    {settings.logo_url ? (
                                        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-gray-400">No Logo</span>
                                    )}
                                </div>
                                <label className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <Upload className="w-4 h-4" /> Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileChange('logo_url', e.target.files[0])} />
                                </label>
                            </div>
                        </div>

                        {/* Signature */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Principal&apos;s Signature</label>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300 overflow-hidden">
                                    {settings.signature_url ? (
                                        <img src={settings.signature_url} alt="Sign" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-gray-400">No Signature</span>
                                    )}
                                </div>
                                <label className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <Upload className="w-4 h-4" /> Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileChange('signature_url', e.target.files[0])} />
                                </label>
                            </div>
                        </div>

                        {/* Watermark */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Report Watermark</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300 overflow-hidden">
                                    {settings.watermark_url ? (
                                        <img src={settings.watermark_url} alt="Watermark" className="w-full h-full object-contain opacity-50" />
                                    ) : (
                                        <span className="text-xs text-gray-400">None</span>
                                    )}
                                </div>
                                <label className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <Upload className="w-4 h-4" /> Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileChange('watermark_url', e.target.files[0])} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Geo-Fencing Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-800">Location & Geo-Fencing</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Set your school&apos;s GPS coordinates to enable staff attendance geo-fencing (50m radius).</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={settings.gps_lat || ''}
                                    onChange={e => setSettings({ ...settings, gps_lat: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="e.g. 18.5204"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={settings.gps_long || ''}
                                    onChange={e => setSettings({ ...settings, gps_long: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="e.g. 73.8567"
                                />
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                            Tip: Use Google Maps to find these coordinates.
                        </div>
                    </div>

                    {/* Attendance Rules Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <h2 className="text-lg font-semibold text-gray-800">Attendance Rules</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Define minimum working hours for auto-calculation.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Hours (Half Day)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={settings.min_hours_half_day || 4.0}
                                    onChange={e => setSettings({ ...settings, min_hours_half_day: parseFloat(e.target.value) })}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Hours (Full Day)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={settings.min_hours_full_day || 6.0}
                                    onChange={e => setSettings({ ...settings, min_hours_full_day: parseFloat(e.target.value) })}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Staff QR Code Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-lg font-semibold text-gray-800">Static Attendance QR (Printable)</h2>
                            <button onClick={loadQR} className="p-1 hover:bg-gray-100 rounded-full" title="Regenerate QR">
                                <RefreshCw className={`w-4 h-4 text-gray-500 ${qrLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center justify-center py-4 space-y-4">
                            {qrData ? (
                                <>
                                    <div className="p-4 bg-white border-4 border-gray-900 rounded-xl">
                                        <QRCode
                                            value={JSON.stringify({
                                                type: 'ATTENDANCE_QR',
                                                token: qrData.token,
                                                school: qrData.school_name,
                                                exp: qrData.expires_in
                                            })}
                                            size={200}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{qrData.school_name}</p>
                                        <p className="text-xs text-gray-500">Scan via Staff App to Mark Attendance</p>
                                        <p className="text-xs text-green-600 mt-1 font-bold">Static QR - Valid Indefinitely</p>
                                    </div>
                                </>
                            ) : (
                                <div className="h-48 w-48 bg-gray-100 flex items-center justify-center rounded-xl text-gray-400">
                                    QR Loading...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            );
}
