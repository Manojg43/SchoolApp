'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file, if not I'll create one or use clsx directly

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hoverEffect?: boolean;
    variant?: 'default' | 'glass' | 'outline';
}

export default function Card({
    children,
    className,
    onClick,
    hoverEffect = false,
    variant = 'glass',
    ...props
}: CardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                variant === 'glass'
                    ? 'glass-card rounded-xl p-5'
                    : 'bg-surface border border-border rounded-xl shadow-sm p-5',
                hoverEffect && 'cursor-pointer', // hover effects handled by glass-card class or utility
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export const CardHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn('mb-4 flex items-center justify-between', className)}>{children}</div>
);

export const CardTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
    <h3 className={cn('text-lg font-semibold text-text-main', className)}>{children}</h3>
);

export const CardContent = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn('text-text-muted', className)}>{children}</div>
);
