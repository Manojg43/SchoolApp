'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface BarChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
    className?: string;
}

export function BarChart({ data, labels, color = '#6366f1', height = 200 }: BarChartProps) {
    const maxValue = Math.max(...data, 1);

    return (
        <div className="w-full" style={{ height }}>
            <div className="flex items-end justify-between h-full gap-2 pt-6">
                {data.map((value, index) => {
                    const heightPercentage = (value / maxValue) * 100;

                    return (
                        <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group">
                            <div className="relative w-full flex justify-center items-end h-full">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                                    {value}
                                </div>

                                {/* Bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercentage}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.05, type: 'spring' }}
                                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-primary/60 to-primary/90 hover:from-primary hover:to-primary-dark transition-colors relative overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                                </motion.div>
                            </div>

                            {/* Label */}
                            <div className="mt-2 text-xs text-text-muted font-medium truncate w-full text-center">
                                {labels[index]}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface Dataset {
    label: string;
    data: number[];
    color: string;
}

interface MultiBarChartProps {
    datasets: Dataset[];
    labels: string[];
    height?: number;
}

export function MultiBarChart({ datasets, labels, height = 250 }: MultiBarChartProps) {
    const allValues = datasets.flatMap(d => d.data);
    const maxValue = Math.max(...allValues, 1);

    return (
        <div className="w-full" style={{ height }}>
            <div className="flex items-end justify-between h-full gap-4 pt-8">
                {labels.map((label, labelIndex) => (
                    <div key={labelIndex} className="flex flex-col items-center flex-1 h-full justify-end">
                        <div className="flex items-end justify-center w-full gap-1 h-full">
                            {datasets.map((dataset, dsIndex) => {
                                const value = dataset.data[labelIndex] || 0;
                                const heightPercentage = (value / maxValue) * 100;

                                return (
                                    <div key={dsIndex} className="w-full max-w-[20px] h-full flex items-end relative group">
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                            {dataset.label}: {value}
                                        </div>

                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${heightPercentage}%` }}
                                            transition={{ duration: 0.6, delay: labelIndex * 0.1 }}
                                            className={`w-full rounded-t-sm ${dataset.color} hover:opacity-90 transition-opacity`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 text-[10px] md:text-xs text-text-muted font-medium text-center truncate max-w-full">
                            {label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6">
                {datasets.map((ds, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${ds.color}`} />
                        <span className="text-xs font-medium text-text-secondary">{ds.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
