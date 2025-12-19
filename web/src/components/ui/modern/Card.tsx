'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file, if not I'll create one or use clsx directly

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hoverEffect?: boolean;
}

export default function Card({ children, className, onClick, hoverEffect = false, ...props }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-surface border border-border rounded-xl shadow-sm p-5',
                hoverEffect && 'transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer',
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
