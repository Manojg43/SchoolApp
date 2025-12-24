'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { Save, Upload, RefreshCw, MapPin, Building, QrCode, Clock, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    getSchoolSettings, updateSchoolSettings, regenerateQR,
    SchoolSettings
} from "@/lib/api";
import QRCode from "react-qr-code";
import Animate, { AnimatePage } from "@/components/ui/Animate";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/modern/Card";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Partial<SchoolSettings>>({});
    const [activeTab, setActiveTab] = useState('branding');

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
            // Replace with Toast later
            toast.success('Settings saved successfully!');
        } catch (e) {
            console.error(e);
            toast.error('Failed to save settings', 'Please try again');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    const tabs = [
        { id: 'branding', label: 'Identity & Branding', icon: <Building size={18} /> },
        { id: 'location', label: 'Location & Geo-Fencing', icon: <MapPin size={18} /> },
        { id: 'attendance', label: 'Attendance Rules', icon: <Clock size={18} /> },
        { id: 'qr', label: 'Staff QR Code', icon: <QrCode size={18} /> },
    ];

    const handleDownloadPoster = () => {
        if (!qrData) return;
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background - Gradient
        const gradient = ctx.createLinearGradient(0, 0, 1200, 1600);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f0f9ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 1600);

        // Border
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 40;
        ctx.strokeRect(40, 40, 1120, 1520);

        // Header Text
        ctx.font = 'bold 80px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(qrData.school_name, 600, 200);

        // Quote
        ctx.font = 'italic 50px serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('"Teaching is the one profession', 600, 320);
        ctx.fillText('that creates all other professions."', 600, 390);

        // QR Code Place Holder (White Box)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 40;
        ctx.fillRect(300, 500, 600, 600);
        ctx.shadowBlur = 0;

        // Draw QR
        const svg = document.querySelector('#qr-code-svg');
        if (svg) {
            const xml = new XMLSerializer().serializeToString(svg);
            const svg64 = btoa(xml);
            const b64Start = 'data:image/svg+xml;base64,';
            const image64 = b64Start + svg64;
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 350, 550, 500, 500);

                // Footer
                ctx.font = '40px sans-serif';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Scan with SchoolApp Staff', 600, 1250);

                // Save
                const link = document.createElement('a');
                link.download = `School_QR_Poster.png`;
                link.href = canvas.toDataURL();
                link.click();
            };
            img.src = image64;
        }
    };

    return (
        <AnimatePage>
            <div className="min-h-screen bg-background p-8 font-sans max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">Settings & Branding</h1>
                        <p className="text-text-muted mt-1">Customize your school identity and configuration.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary-dark font-medium disabled:opacity-50 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                    >
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Tabs Sidebar */}
                    <div className="lg:col-span-3 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-surface text-text-muted hover:bg-gray-50 hover:text-text-main'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'branding' && (
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader><CardTitle>School Information</CardTitle></CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-text-main mb-1.5">School Name</label>
                                                    <input
                                                        type="text"
                                                        value={settings.name || ''}
                                                        onChange={e => setSettings({ ...settings, name: e.target.value })}
                                                        className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-text-main mb-1.5">Address</label>
                                                    <textarea
                                                        value={settings.address || ''}
                                                        onChange={e => setSettings({ ...settings, address: e.target.value })}
                                                        className="w-full p-2.5 border border-border rounded-lg h-24 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader><CardTitle>Visual Assets</CardTitle></CardHeader>
                                            <CardContent className="grid md:grid-cols-3 gap-6">
                                                {[
                                                    { label: 'School Logo', field: 'logo_url', type: 'contain' },
                                                    { label: 'Principal Signature', field: 'signature_url', type: 'contain' },
                                                    { label: 'Watermark', field: 'watermark_url', type: 'contain opacity-50' }
                                                ].map((asset: any) => (
                                                    <div key={asset.field}>
                                                        <label className="block text-sm font-semibold text-text-main mb-2">{asset.label}</label>
                                                        <div className="w-full h-32 bg-background rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative group hover:border-primary/50 transition-colors">
                                                            {settings[asset.field as keyof SchoolSettings] ? (
                                                                <img src={settings[asset.field as keyof SchoolSettings] as string} alt={asset.label} className={`w-full h-full object-${asset.type} p-2`} />
                                                            ) : (
                                                                <span className="text-xs text-text-muted">No Upload</span>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <label className="cursor-pointer bg-white text-text-main px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transform scale-95 group-hover:scale-100 transition-transform">
                                                                    <Upload size={14} /> Change
                                                                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileChange(asset.field, e.target.files[0])} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeTab === 'location' && (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-secondary" />
                                                <CardTitle>GPS Configuration</CardTitle>
                                            </div>
                                            <p className="text-sm text-text-muted mt-1">Required for geo-fencing functionality (50m radius).</p>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-text-main mb-1.5">Latitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={settings.gps_lat || ''}
                                                    onChange={e => setSettings({ ...settings, gps_lat: e.target.value })}
                                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    placeholder="e.g. 18.5204"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-text-main mb-1.5">Longitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={settings.gps_long || ''}
                                                    onChange={e => setSettings({ ...settings, gps_long: e.target.value })}
                                                    className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    placeholder="e.g. 73.8567"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <div className="bg-secondary/10 text-secondary text-xs p-3 rounded-lg flex items-center gap-2">
                                                    <MapPin size={14} />
                                                    Tip: Use Google Maps to verify these coordinates precisely.
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeTab === 'attendance' && (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-warning" />
                                                <CardTitle>Working Hours</CardTitle>
                                            </div>
                                            <p className="text-sm text-text-muted mt-1">Define thresholds for auto-calculating attendance status.</p>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-6">
                                            <div className="p-4 bg-background rounded-xl border border-border">
                                                <label className="block text-sm font-bold text-text-main mb-2">Half Day Minimum</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        value={settings.min_hours_half_day || 4.0}
                                                        onChange={e => setSettings({ ...settings, min_hours_half_day: parseFloat(e.target.value) })}
                                                        className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-warning/20 focus:border-warning outline-none text-lg font-mono"
                                                    />
                                                    <span className="text-text-muted text-sm font-medium">Hrs</span>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-background rounded-xl border border-border">
                                                <label className="block text-sm font-bold text-text-main mb-2">Full Day Minimum</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        value={settings.min_hours_full_day || 6.0}
                                                        onChange={e => setSettings({ ...settings, min_hours_full_day: parseFloat(e.target.value) })}
                                                        className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-success/20 focus:border-success outline-none text-lg font-mono"
                                                    />
                                                    <span className="text-text-muted text-sm font-medium">Hrs</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {activeTab === 'qr' && (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <QrCode className="w-5 h-5 text-primary" />
                                                        <CardTitle>Staff Attendance QR</CardTitle>
                                                    </div>
                                                    <p className="text-sm text-text-muted mt-1">Static QR code for staff members to scan.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleDownloadPoster}
                                                        className="p-2 hover:bg-background rounded-full transition-colors text-primary"
                                                        title="Download Poster"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={loadQR}
                                                        className="p-2 hover:bg-background rounded-full transition-colors text-primary"
                                                        title="Regenerate QR"
                                                    >
                                                        <RefreshCw className={`w-5 h-5 ${qrLoading ? 'animate-spin' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col items-center justify-center py-8 space-y-6">
                                                {qrData ? (
                                                    <>
                                                        <div className="p-6 bg-white border-4 border-text-main rounded-2xl shadow-2xl relative">
                                                            <div className="absolute top-0 left-0 w-full h-full border-4 border-white/20 rounded-xl pointer-events-none"></div>
                                                            <QRCode
                                                                id="qr-code-svg"
                                                                value={JSON.stringify({
                                                                    type: 'ATTENDANCE_QR',
                                                                    token: qrData.token,
                                                                    school: qrData.school_name,
                                                                    exp: qrData.expires_in
                                                                })}
                                                                size={240}
                                                            />
                                                        </div>
                                                        <div className="text-center space-y-1">
                                                            <p className="font-bold text-xl text-text-main">{qrData.school_name}</p>
                                                            <p className="text-sm text-text-muted">Scan with Staff App to Check-in/out</p>
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold mt-2">
                                                                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                                                                Active & Valid
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="h-64 w-64 bg-background rounded-2xl flex flex-col items-center justify-center text-text-muted gap-4 animate-pulse">
                                                        <QrCode size={48} className="opacity-20" />
                                                        <span className="text-sm font-medium">Generating Secure QR...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AnimatePage>
    );
}
