import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Laptop's Local IP for Emulator/Device access
// 10.0.2.2 is for Android Emulator to access host localhost
// For physical device, use actual IP e.g. 'http://192.168.1.5:8000/api'
const BASE_URL = 'http://10.0.2.2:8000/api';

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any) {
    const token = await AsyncStorage.getItem('auth_token');
    const schoolId = await AsyncStorage.getItem('school_id');

    const headers: any = {
        'Content-Type': 'application/json',
    };

    if (token) headers['Authorization'] = `Token ${token}`;
    if (schoolId) headers['X-School-ID'] = schoolId;

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (response.status === 401) {
            // Unauthenticated
            await AsyncStorage.removeItem('auth_token');
            throw new Error('Unauthorized');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'API Request Failed');
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Mobile Specific API Methods
export const mobileApi = {
    login: (username: string, password: string) =>
        apiRequest('/login/', 'POST', { username, password }),

    generateQR: () => apiRequest('/staff/qr/generate/', 'GET'),

    scanQR: (qrToken: string, lat: number, long: number) =>
        apiRequest('/staff/attendance/scan/', 'POST', {
            qr_token: qrToken,
            gps_lat: lat,
            gps_long: long
        }),

    getMyProfile: () => apiRequest('/staff/profile/', 'GET'),
};
