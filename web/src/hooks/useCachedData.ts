import { useState, useEffect } from 'react';

const cache = new Map<string, { data: any; timestamp: number }>();

interface CacheOptions {
    ttl?: number; // Time to live in milliseconds (default: 5 minutes)
    revalidateOnFocus?: boolean;
}

export function useCachedData<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}) {
    const { ttl = 5 * 60 * 1000 } = options; // Default 5 mins

    // Initialize state from cache if available
    const [data, setData] = useState<T | null>(() => {
        const cached = cache.get(key);
        if (cached) {
            const isFresh = Date.now() - cached.timestamp < ttl;
            // Return cached data immediately if it exists (stale-while-revalidate)
            return cached.data;
        }
        return null;
    });

    const [loading, setLoading] = useState(!data);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                // If we have data and it's fresh, we might not need to fetch,
                // BUT for this specific "dashboard" use case, the user wants "fast" UI.
                // We returned data from state initializer, so UI is already showing content.
                // We can optionally fetch in background to update.

                const cached = cache.get(key);
                const isFresh = cached && (Date.now() - cached.timestamp < ttl);

                if (isFresh && data) {
                    setLoading(false);
                    return;
                }

                if (!data) setLoading(true); // Only show loading if we have NO data

                const result = await fetcher();

                if (isMounted) {
                    // Update cache
                    cache.set(key, { data: result, timestamp: Date.now() });
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    console.error(`Error fetching ${key}:`, err);
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [key, ttl]); // Re-run if key changes

    // Helper to manually refresh
    const refetch = async () => {
        setLoading(true);
        try {
            const result = await fetcher();
            cache.set(key, { data: result, timestamp: Date.now() });
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, refetch };
}
