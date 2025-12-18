import AsyncStorage from '@react-native-async-storage/async-storage';

// Production URL
const BASE_URL = 'https://schoolapp-6vwg.onrender.com/api';

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

    scanQR: (qrToken: string | null, lat: number, long: number, isManual: boolean = false) =>
        apiRequest('/staff/attendance/scan/', 'POST', {
            qr_token: qrToken,
            gps_lat: lat,
            gps_long: long,
            manual_gps: isManual
        }),

    getMyProfile: () => apiRequest('/staff/dashboard/', 'GET'),

    // Leave Management
    applyLeave: (start_date: string, end_date: string, reason: string) =>
        apiRequest('/staff/leaves/apply/', 'POST', { start_date, end_date, reason }),

    getMyLeaves: () => apiRequest('/staff/leaves/my/', 'GET'),

    // Day-wise Attendance with Salary
    getMyAttendanceReport: (month: number, year: number) =>
        apiRequest(`/staff/attendance/report/?month=${month}&year=${year}`, 'GET'), // No staff_id = self

    // Admin View: All Staff Daily Attendance
    getDailyAttendance: (date: string) =>
        apiRequest(`/staff/attendance/daily/?date=${date}`, 'GET'),
};
