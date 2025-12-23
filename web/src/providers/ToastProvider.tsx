'use client';

import { Toaster } from 'sonner';

export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster
                position="top-right"
                expand={true}
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                    style: {
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-main)',
                        border: '1px solid var(--color-border)',
                    },
                    className: 'toast-custom',
                }}
            />
        </>
    );
}
