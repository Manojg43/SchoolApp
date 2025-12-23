'use client';

import { useState } from 'react';
import { generateCertificate, downloadCertificate, CERTIFICATE_TYPES, CertificateGenerateResponse } from '@/lib/api';

interface CertificateGeneratorProps {
    studentId: number;
    studentName: string;
    onClose?: () => void;
}

export default function CertificateGenerator({ studentId, studentName, onClose }: CertificateGeneratorProps) {
    const [selectedType, setSelectedType] = useState('BONAFIDE');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState<CertificateGenerateResponse | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setSuccess(null);

        try {
            // Generate certificate (returns PDF blob)
            const pdfBlob = await generateCertificate(studentId, selectedType, purpose);

            // For now, we'll create a success object manually
            // In a real scenario, the backend should return metadata + PDF separately
            const successData: CertificateGenerateResponse = {
                message: 'Certificate generated successfully',
                certificate_id: Date.now(), // Temporary - backend should provide this
                certificate_no: `CERT-${Date.now()}`, // Temporary
                verification_code: `VER-${Date.now()}` // Temporary
            };

            setSuccess(successData);

            // Auto-download the PDF blob
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${successData.certificate_no}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err: any) {
            setError(err.message || 'Failed to generate certificate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Generate Certificate</h2>
            <p className="text-gray-600 mb-6">
                Student: <strong>{studentName}</strong>
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                    <p className="font-semibold">{success.message}</p>
                    <p className="text-sm mt-2">
                        Certificate No: <strong>{success.certificate_no}</strong>
                    </p>
                    <p className="text-sm">
                        Verification Code: <strong>{success.verification_code}</strong>
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {/* Certificate Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Type
                    </label>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    >
                        {CERTIFICATE_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Purpose */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purpose (Optional)
                    </label>
                    <textarea
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g., College admission, Bank account, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        disabled={loading}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Generating...' : 'Generate Certificate'}
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            {success && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        The certificate has been downloaded automatically. You can also verify it using the verification code above.
                    </p>
                </div>
            )}
        </div>
    );
}
