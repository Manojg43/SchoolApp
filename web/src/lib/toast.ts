import { toast as sonnerToast } from 'sonner';

/**
 * Beautiful toast notifications to replace alert() and confirm()
 */
export const toast = {
    /**
     * Show success message
     */
    success: (message: string, description?: string) => {
        return sonnerToast.success(message, {
            description,
            icon: '✅',
        });
    },

    /**
     * Show error message
     */
    error: (message: string, description?: string) => {
        return sonnerToast.error(message, {
            description,
            icon: '❌',
        });
    },

    /**
     * Show info message
     */
    info: (message: string, description?: string) => {
        return sonnerToast.info(message, {
            description,
            icon: 'ℹ️',
        });
    },

    /**
     * Show warning message
     */
    warning: (message: string, description?: string) => {
        return sonnerToast.warning(message, {
            description,
            icon: '⚠️',
        });
    },

    /**
     * Show loading message (returns ID for updating later)
     */
    loading: (message: string) => {
        return sonnerToast.loading(message);
    },

    /**
     * Promise-based toast (auto-updates on completion)
     */
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ) => {
        return sonnerToast.promise(promise, messages);
    },

    /**
     * Confirmation dialog (replaces window.confirm)
     */
    confirm: ({
        title,
        description,
        onConfirm,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
    }: {
        title: string;
        description?: string;
        onConfirm: () => void | Promise<void>;
        confirmText?: string;
        cancelText?: string;
    }) => {
        return sonnerToast(title, {
            description,
            action: {
                label: confirmText,
                onClick: async () => {
                    await onConfirm();
                },
            },
            cancel: {
                label: cancelText,
                onClick: () => { },
            },
        });
    },

    /**
     * Dismiss a toast by ID
     */
    dismiss: (id?: string | number) => {
        sonnerToast.dismiss(id);
    },

    /**
     * Custom toast with action button
     */
    custom: (message: string, options?: {
        description?: string;
        action?: {
            label: string;
            onClick: () => void;
        };
        duration?: number;
    }) => {
        return sonnerToast(message, {
            description: options?.description,
            action: options?.action,
            duration: options?.duration,
        });
    },
};

/**
 * Helper to update a loading toast to success/error
 */
export const updateToast = {
    success: (id: string | number, message: string, description?: string) => {
        sonnerToast.success(message, {
            id,
            description,
        });
    },
    error: (id: string | number, message: string, description?: string) => {
        sonnerToast.error(message, {
            id,
            description,
        });
    },
};
