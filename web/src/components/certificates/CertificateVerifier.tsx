'use client';

import { useState } from 'react';
import { verifyCertificate, CertificateVerificationResponse } from '@/lib/api';

export default function CertificateVerifier() {
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CertificateVerificationResponse | null>(null);

    const handleVerify = async () => {
        if (!verificationCode.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await verifyCertificate(verificationCode.trim());
            setResult(response);
        } catch (err) {
            setResult({
                valid: false,
                status: 'NOT_FOUND',
                message: 'Failed to verify certificate'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Verify Certificate</h2>
            <p className="text-gray-600 mb-6">
                Enter the verification code from the certificate to verify its authenticity.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                    </label>
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="e.g., SCH001-STU0042-789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                    />
                </div>

                <button
                    onClick={handleVerify}
                    disabled={loading || !verificationCode.trim()}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Verifying...' : 'Verify Certificate'}
                </button>
            </div>

            {result && (
                <div className={`mt-6 p-4 rounded-md ${result.valid
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                    <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${result.valid ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                            {result.valid ? (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>

                        <div className="flex-1">
                            <h3 className={`font-semibold ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                                {result.status === 'VALID' && 'Certificate is Valid'}
                                {result.status === 'REVOKED' && 'Certificate Revoked'}
                                {result.status === 'EXPIRED' && 'Certificate Expired'}
                                {result.status === 'NOT_FOUND' && 'Certificate Not Found'}
                            </h3>

                            {result.valid && (
                                <dl className="mt-3 space-y-2 text-sm text-green-700">
                                    <div>
                                        <dt className="font-medium">Certificate No:</dt>
                                        <dd>{result.certificate_no}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium">Type:</dt>
                                        <dd>{result.type}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium">Student:</dt>
                                        <dd>{result.student_name}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium">School:</dt>
                                        <dd>{result.school_name}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium">Issued:</dt>
                                        <dd>{result.issued_date}</dd>
                                    </div>
                                </dl>
                            )}

                            {!result.valid && result.message && (
                                <p className="mt-2 text-sm text-red-700">
                                    {result.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
