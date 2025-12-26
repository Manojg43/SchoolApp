/**
 * Indian Rupees Currency Formatter
 * Formats numbers to Indian Rupee format with ₹ symbol
 */

// Format number to Indian currency (₹)
export function formatINR(amount: number | string | undefined | null): string {
    if (amount === null || amount === undefined) return '₹0';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';

    // Indian numbering system: 1,00,000 instead of 100,000
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
}

// Format date to IST (Indian Standard Time)
export function formatDateIST(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '-';

    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
}

// Format datetime to IST with time
export function formatDateTimeIST(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '-';

    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
}

// Format time only in IST
export function formatTimeIST(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '-';

    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
}

// Compact Indian number format (e.g., 1.5L, 10Cr)
export function formatINRCompact(amount: number | string | undefined | null): string {
    if (amount === null || amount === undefined) return '₹0';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';

    if (num >= 10000000) { // 1 Crore+
        return `₹${(num / 10000000).toFixed(1)}Cr`;
    } else if (num >= 100000) { // 1 Lakh+
        return `₹${(num / 100000).toFixed(1)}L`;
    } else if (num >= 1000) { // 1 Thousand+
        return `₹${(num / 1000).toFixed(1)}K`;
    }

    return `₹${num.toFixed(0)}`;
}
