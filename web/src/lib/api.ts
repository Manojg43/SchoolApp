// BYPASS PROXY: Connect directly to Render to avoid Vercel Timeouts
// const API_BASE_URL = '/api';
const API_BASE_URL = 'https://schoolapp-6vwg.onrender.com/api';

// For demo purposes, we default to a specific school if not determined dynamically
const DEFAULT_SCHOOL_ID = ''; // Changed from 'SCHOOL-A' to allow superuser access (no header = all schools)

export async function fetchWithSchool(endpoint: string, schoolId: string | undefined = undefined) {
    // Priority: Argument -> LocalStorage -> Default (fallback)
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (effectiveSchoolId) {
        headers['X-School-ID'] = effectiveSchoolId;
    }

    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

    // Handle Auth Errors (401/403)
    if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login'; // Force login
        }
    }

    if (!res.ok) {
        throw new Error(`API call failed: ${res.statusText}`);
    }

    return res.json();
}

export interface Achievement {
    id: number;
    title: string;
    description: string;
    image_url: string; // Changed from image to image_url per Master v5
    date: string;
}

export async function getAchievements(schoolId?: string): Promise<Achievement[]> {
    return fetchWithSchool('/achievements/', schoolId);
}

// Helper to get stats
export async function getDashboardStats(schoolId?: string) {
    const [students, schools] = await Promise.all([
        fetchWithSchool('/students/', schoolId),
        fetchWithSchool('/schools/', schoolId)
    ]);

    return {
        students: students.length,
        schools: schools.length,
    };
}

// Students
export interface Student {
    id: number;
    enrollment_number: string;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth: string;

    // Academic (Joined)
    class_name?: string;
    section_name?: string;
    year_name?: string;

    // Parents
    father_name: string;
    mother_name: string;
    emergency_mobile: string;
    address: string;

    language: string;
    is_active: boolean;

    // IDs (needed for updates)
    current_class?: number;
    section?: number;
    academic_year?: number;
}

export async function getStudents(schoolId?: string): Promise<Student[]> {
    return fetchWithSchool('/students/', schoolId);
}

// Attendance
export interface Attendance {
    id: number;
    student: number;
    student_name: string;
    date: string;
    status: 'P' | 'A' | 'L';
    remarks: string;
}

// Fee Interfaces
export interface FeeCategory {
    id: number;
    name: string;
    description?: string;
}

export interface FeeStructure {
    id: number;
    academic_year: number;
    class_assigned: number;
    category: number;
    amount: string;
}

// Helper to fetch categories
export async function getFeeCategories(schoolId?: string): Promise<FeeCategory[]> {
    return fetchWithSchool('/finance/categories/', schoolId);
}

// Helper to fetch structure amount
export async function getFeeStructureAmount(classId: number, categoryId: number, schoolId?: string): Promise<string> {
    try {
        // Assuming backend filter by class and category
        const res = await fetchWithSchool(`/finance/structure/?class_assigned=${classId}&category=${categoryId}`, schoolId);
        if (Array.isArray(res) && res.length > 0) {
            return res[0].amount;
        }
        return "0";
    } catch (e) {
        console.error("Error fetching fee structure", e);
        return "0";
    }
}

export async function getAttendance(schoolId?: string): Promise<Attendance[]> {
    return fetchWithSchool('/attendance/', schoolId);
}

// Fees
export interface Fee {
    id: number;
    student: number;
    student_name: string;
    title: string;
    amount: string;
    due_date: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    paid_date: string | null;
}

export async function getFees(schoolId?: string): Promise<Fee[]> {
    return fetchWithSchool('/fees/', schoolId);
}

export async function createFee(data: any, schoolId?: string): Promise<Fee> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/fees/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Failed to create fee: ${res.statusText}`);
    return res.json();
}

export async function deleteFee(id: number, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/fees/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        }
    });

    if (!res.ok) throw new Error(`Failed to delete fee: ${res.statusText}`);
}

// Staff
export interface Staff {
    id: number;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    role: string;
    designation?: string;
    department?: string;
    joining_date?: string;
}

export async function getStaff(schoolId?: string): Promise<Staff[]> {
    // In a real app we might have a specific endpoint, or filter users by role
    // For now assuming /staff/ endpoint exists or reusing /users/ with filter
    // Let's assume /staff-dashboard/ gives current user info, but for list we need /staff/
    // If backend doesn't have /staff/ list endpoint, we might fail.
    // Checking backend... `staff` app has views but no ModelViewSet for listing all staff exposed plainly?
    // Wait, backend/staff/views.py only has Dashboard and Scans.
    // I should check `backend/core/views.py` or `setup_roles.py`.
    // Actually, let's assume I need to add a Staff List API to backend first?
    // No, let's just use a placeholder or assume /users/?role=STAFF works if implemented.
    // User asked for "CRUD at UI level", implying backend exists.
    // Let's assume /staff/ endpoint is NOT there based on my `staff/views.py` read.
    // I will add `StaffViewSet` to `backend/staff/views.py` quickly.
    return fetchWithSchool('/staff/', schoolId);
}

export async function createStaff(data: any, schoolId?: string): Promise<Staff> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/staff/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Failed to create staff: ${res.statusText}`);
    return res.json();
}

export async function updateStaff(id: number, data: any, schoolId?: string): Promise<Staff> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/staff/${id}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Failed to update staff: ${res.statusText}`);
    return res.json();
}

export async function deleteStaff(id: number, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/staff/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        }
    });

    if (!res.ok) throw new Error(`Failed to delete staff: ${res.statusText}`);
}

// Classes & Sections (Helpers for Dropdowns)
export interface ClassItem {
    id: number;
    name: string;
}

export interface SectionItem {
    id: number;
    name: string;
    parent_class: number;
}

export async function getClasses(schoolId?: string): Promise<ClassItem[]> {
    return fetchWithSchool('/classes/', schoolId);
}

export async function getSections(schoolId?: string): Promise<SectionItem[]> {
    return fetchWithSchool('/sections/', schoolId);
}

// Student CRUD
export async function createStudent(data: any, schoolId?: string): Promise<Student> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/students/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Failed to create student: ${res.statusText}`);
    return res.json();
}

export async function updateStudent(id: number, data: any, schoolId?: string): Promise<Student> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/students/${id}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Failed to update student: ${res.statusText}`);
    return res.json();
}

export async function deleteStudent(id: number, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/students/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        }
    });

    if (!res.ok) throw new Error(`Failed to delete student: ${res.statusText}`);
}


// Transport
export interface Vehicle {
    id: number;
    registration_number: string;
    model: string;
    capacity: number;
    driver_name?: string;
    driver?: number | null;
}

export interface Route {
    id: number;
    name: string;
    stops: { id: number; name: string; fee_amount: string }[];
}

export async function getVehicles(schoolId?: string): Promise<Vehicle[]> {
    return fetchWithSchool('/transport/vehicles/', schoolId);
}

export async function createVehicle(data: any, schoolId?: string): Promise<Vehicle> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/transport/vehicles/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to create vehicle: ${res.statusText}`);
    return res.json();
}

export async function deleteVehicle(id: number, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/transport/vehicles/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        }
    });

    if (!res.ok) throw new Error(`Failed to delete vehicle: ${res.statusText}`);
}

export async function getRoutes(schoolId?: string): Promise<Route[]> {
    return fetchWithSchool('/transport/routes/', schoolId);
}

export async function createRoute(data: any, schoolId?: string): Promise<Route> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/transport/routes/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to create route: ${res.statusText}`);
    return res.json();
}

export async function deleteRoute(id: number, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/transport/routes/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        }
    });

    if (!res.ok) throw new Error(`Failed to delete route: ${res.statusText}`);
}
