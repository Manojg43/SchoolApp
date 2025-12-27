'use client';

import { IndianRupee } from 'lucide-react';

interface CurrencyInputProps {
    value: number | string;
    onChange: (value: number) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    currency?: string;
}

export default function CurrencyInput({
    value,
    onChange,
    label,
    placeholder = '0.00',
    disabled = false,
    error,
    currency = '₹',
}: CurrencyInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9.]/g, '');
        const numVal = parseFloat(val) || 0;
        onChange(numVal);
    };

    const formattedValue = typeof value === 'number'
        ? value.toFixed(2)
        : value;

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    {currency}
                </div>
                <input
                    type="text"
                    value={formattedValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
                        w-full pl-10 pr-4 py-3 border rounded-lg
                        transition-all focus:outline-none focus:ring-2
                        ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'}
                        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                        font-mono text-right
                    `}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
