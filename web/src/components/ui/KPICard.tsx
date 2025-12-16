import React from 'react';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';

interface KPICardProps {
    label: string;
    value: string | number;
    trend?: { value: number; isPositive: boolean };
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error';
    className?: string;
}

export default function KPICard({ label, value, trend, icon, color = 'primary', className = '' }: KPICardProps) {
    const borderColors = {
        primary: 'border-l-primary',
        success: 'border-l-success',
        warning: 'border-l-warning',
        error: 'border-l-error',
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${borderColors[color]} flex items-center justify-between ${className}`}>
            <div>
                <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
                {trend && (
                    <div className={`mt-1 flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        <span className="ml-1">{Math.abs(trend.value)}%</span>
                        <span className="ml-1 text-gray-400">vs last month</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-full bg-${color}/10 text-${color}`}>
                {icon || <Activity className="h-6 w-6 text-gray-400" />}
            </div>
        </div>
    );
}
