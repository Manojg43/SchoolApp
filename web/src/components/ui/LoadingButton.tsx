'use client';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    success: 'bg-success text-white hover:bg-success/90',
    danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
};

export default function LoadingButton({
    loading = false,
    children,
    variant = 'primary',
    size = 'md',
    disabled,
    className = '',
    ...props
}: LoadingButtonProps) {
    return (
        <button
            disabled={loading || disabled}
            className={`
                ${variants[variant]}
                ${sizes[size]}
                rounded-lg font-medium transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                ${className}
            `}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
}
