export const theme = {
    colors: {
        primary: '#2563eb', // Vibrant Royal Blue - Web Match
        primaryDark: '#1e40af', // Blue 800
        primaryLight: '#60a5fa', // Blue 400

        secondary: '#06b6d4', // Cyan 500
        secondaryLight: '#67e8f9',

        background: '#f0f4f8', // Cool light blue-grey
        surface: '#ffffff',
        surfaceGlass: 'rgba(255, 255, 255, 0.85)',

        text: {
            main: '#0f172a', // Slate 900
            muted: '#64748b', // Slate 500
            light: '#94a3b8', // Slate 400
            inverse: '#ffffff',
        },

        border: '#e2e8f0', // Slate 200

        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    },
    borderRadius: {
        s: 8,
        m: 12,
        l: 16,
        full: 9999,
    },
    shadows: {
        card: {
            shadowColor: '#64748b',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        glass: {
            shadowColor: '#2563eb',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
        }
    },
    linearGradient: {
        primary: ['#2563eb', '#1e40af'] as const,
        secondary: ['#06b6d4', '#0891b2'] as const,
    }
};
