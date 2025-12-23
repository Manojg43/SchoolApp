// CENTRAL API CONFIGURATION
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://schoolapp-6vwg.onrender.com/api';

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

    const data = await res.json();

    // Handle paginated responses automatically
    // If the response has 'results' key, it's paginated - extract the results
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        // Paginated response - return results directly for backward compatibility
        // but attach pagination metadata for advanced use cases
        const results = data.results;
        (results as any).__pagination = {
            count: data.count,
            next: data.next,
            previous: data.previous,
        };
        return results;
    }

    return data;
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
    mobile?: string;
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

export interface FeePayload {
    student: number;
    title: string;
    amount: number;
    due_date: string;
    status: string;
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

export async function createFee(data: FeePayload, schoolId?: string): Promise<Fee> {
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
export type StaffPayload = Omit<Staff, 'id' | 'user_id'>;
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
    can_mark_manual_attendance?: boolean;
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

export async function createStaff(data: StaffPayload, schoolId?: string): Promise<Staff> {
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

export async function updateStaff(id: number, data: Partial<StaffPayload>, schoolId?: string): Promise<Staff> {
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
    sections?: SectionItem[];
}

export interface SectionItem {
    id: number;
    name: string;
    parent_class: number;
}

export async function getClasses(schoolId?: string): Promise<ClassItem[]> {
    return fetchWithSchool('/classes/', schoolId);
}

export async function getSections(schoolId?: string, classId?: number): Promise<SectionItem[]> {
    const query = classId ? `?parent_class=${classId}` : '';
    return fetchWithSchool(`/sections/${query}`, schoolId);
}

// Student CRUD
export type StudentPayload = Omit<Student, 'id' | 'is_active' | 'language' | 'mother_name' | 'address' | 'section'> & {
    language?: string;
    is_active?: boolean;
    mother_name?: string;
    address?: string;
    section?: number | null;
};

export async function createStudent(data: StudentPayload, schoolId?: string): Promise<Student> {
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

export async function updateStudent(id: number, data: Partial<StudentPayload>, schoolId?: string): Promise<Student> {
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
    driver_age?: number;
    driver_mobile?: string;
    fitness_upto?: string;
    // driver_id (FK) optional
    driver?: number | null;
    routes?: Route[]; // Nested read
}

export interface Route {
    id: number;
    name: string;
    stops: { id: number; name: string; fee_amount: string }[];
}

export async function getVehicles(schoolId?: string): Promise<Vehicle[]> {
    return fetchWithSchool('/transport/vehicles/', schoolId);
}

// Transport Payloads
export interface VehiclePayload {
    registration_number: string;
    model: string;
    capacity: number;
    driver_name?: string;
    driver_age?: number;
    driver_mobile?: string;
    fitness_upto?: string;
    driver?: number | null;
    routes?: { name: string }[]; // Nested write
}

export async function createVehicle(data: VehiclePayload, schoolId?: string): Promise<Vehicle> {
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

export type RoutePayload = Omit<Route, 'id'>;

export async function createRoute(data: RoutePayload, schoolId?: string): Promise<Route> {
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

// Analytics & Reports
export interface AttendanceAnalytics {
    date: string;
    students: {
        total: number;
        present: number;
        absent: number;
        percentage: number;
    };
    staff: {
        total_marked: number;
        present: number;
        absent: number;
    };
    class_distribution: { current_class__name: string; count: number }[];
}

export interface FinanceAnalytics {
    overview: {
        total_invoiced: number;
        total_collected: number;
        pending: number;
        collection_rate: number;
    };
}

export async function getAttendanceAnalytics(schoolId?: string): Promise<AttendanceAnalytics> {
    return fetchWithSchool('/reports/attendance/', schoolId);
}

export async function getFinanceAnalytics(schoolId?: string): Promise<FinanceAnalytics> {
    return fetchWithSchool('/reports/finance/', schoolId);
}

export interface StaffAttendanceReport {
    staff_name: string;
    month: string;
    stats: {
        present: number;
        half_day: number;
        leave: number;
        absent: number;
    };
    daily_logs: {
        date: string;
        day: number;
        status: string;
        id?: number;
        check_in?: string;
        check_out?: string;
    }[];
}

export async function getStaffAttendanceReport(staffId: number, month: number, year: number, schoolId?: string): Promise<StaffAttendanceReport> {
    return fetchWithSchool(`/staff/attendance/report/?staff_id=${staffId}&month=${month}&year=${year}`, schoolId);
}

export interface StaffDailyLog {
    id: number; // Staff ID
    name: string;
    status: string;
    check_in: string;
    check_out: string;
    attendance_id?: number | null;
}

export async function getStaffDailyAttendance(date: string, schoolId?: string): Promise<{ date: string, records: StaffDailyLog[] }> {
    return fetchWithSchool(`/staff/attendance/daily/?date=${date}`, schoolId);
}

export async function updateAttendance(id: number, data: { status?: string, check_in?: string, check_out?: string, correction_reason?: string }, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/staff/attendance/${id}/update/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Failed to update attendance: ${res.statusText}`);
}

// School Settings & Branding
export interface SchoolSettings {
    name: string;
    address: string;
    domain: string;
    language: string;
    gps_lat: string | number;
    gps_long: string | number;
    logo_url: string; // Base64 or URL
    signature_url: string; // Base64 or URL
    watermark_url: string; // Base64 or URL
    min_hours_half_day?: number;
    min_hours_full_day?: number;
    salary_calculation_day?: number;
}

export async function getSchoolSettings(schoolId?: string): Promise<SchoolSettings> {
    return fetchWithSchool('/schools/current/', schoolId);
}

export async function updateSchoolSettings(data: Partial<SchoolSettings>, schoolId?: string): Promise<SchoolSettings> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/schools/current/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error(`Failed to update school settings: ${res.statusText}`);
    return res.json();
}

export async function regenerateQR(schoolId?: string): Promise<{ qr_token: string, expires_in: number, school_name: string }> {
    return fetchWithSchool('/staff/qr/generate/', schoolId);
}

// Certificates
export async function generateCertificate(studentId: number, type: string, schoolId?: string): Promise<Blob> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/certificates/generate/${studentId}/${type}/`, {
        method: 'GET',
        headers: {
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        }
    });

    if (!res.ok) throw new Error(`Failed to generate certificate: ${res.statusText}`);
    return res.blob();
}

export async function generateCertificateManual(data: { enrollment_number: string, type: string, class_name?: string, section?: string, academic_year?: string }, schoolId?: string): Promise<Blob> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const queryInfo = new URLSearchParams({
        enrollment_number: data.enrollment_number,
        type: data.type,
        ...(data.class_name && { class_name: data.class_name }),
        ...(data.section && { section: data.section }),
        ...(data.academic_year && { year: data.academic_year })
    });

    const res = await fetch(`${API_BASE_URL}/certificates/generate/manual/?${queryInfo.toString()}`, {
        method: 'GET',
        headers: {
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        }
    });

    if (!res.ok) throw new Error(`Failed to generate certificate: ${res.statusText}`);
    return res.blob();
}

// Payroll
export interface PayrollEntry {
    id: number;
    staff_name: string;
    designation: string;
    present_days: number;
    base_salary: string;
    net_salary: string;
    is_paid: boolean;
    paid_date: string | null;
}

export async function getPayrollDashboard(month?: number, year?: number, schoolId?: string): Promise<PayrollEntry[]> {
    const query = month && year ? `?month=${month}&year=${year}` : '';
    return fetchWithSchool(`/finance/payroll/dashboard/${query}`, schoolId);
}

export async function generatePayroll(month: number, year: number, schoolId?: string): Promise<{ message: string }> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/finance/salary/calculate/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ month, year })
    });

    if (!res.ok) throw new Error(`Failed to generate payroll: ${res.statusText}`);
    return res.json();
}

export async function getSalaryStructure(staffId: number, schoolId?: string): Promise<{ base_salary: number }> {
    return fetchWithSchool(`/finance/payroll/structure/${staffId}/`, schoolId);
}

export async function saveSalaryStructure(staffId: number, base_salary: number, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/finance/payroll/structure/${staffId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ base_salary })
    });

    if (!res.ok) throw new Error(`Failed to save salary structure: ${res.statusText}`);
}

export async function markSalaryPaid(salaryId: number, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/finance/payroll/mark-paid/${salaryId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        }
    });

    if (!res.ok) throw new Error(`Failed to mark paid: ${res.statusText}`);
}

// Leave Management
export interface LeaveApplication {
    id: number;
    staff_name?: string; // For Admin
    start_date: string;
    end_date: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    is_paid?: boolean;
}

export async function getLeaveApplications(status: string = 'PENDING', schoolId?: string): Promise<LeaveApplication[]> {
    return fetchWithSchool(`/staff/leaves/manage/?status=${status}`, schoolId);
}

export async function processLeaveApplication(id: number, action: 'APPROVE' | 'REJECT', isPaid: boolean = false, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/staff/leaves/manage/${id}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ action, is_paid: isPaid })
    });

    if (!res.ok) throw new Error(`Failed to process leave: ${res.statusText}`);
}

export async function applyForLeave(start_date: string, end_date: string, reason: string, schoolId?: string): Promise<void> {
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;

    const res = await fetch(`${API_BASE_URL}/staff/leaves/apply/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-School-ID': effectiveSchoolId,
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ start_date, end_date, reason })
    });

    if (!res.ok) throw new Error(`Failed to apply for leave: ${res.statusText}`);
}

// Generic API wrapper for new components
export const api = {
    get: (endpoint: string) => fetchWithSchool(endpoint),
    post: async (endpoint: string, data: any) => {
        const schoolId = typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined;
        const headers: any = { 'Content-Type': 'application/json' };
        if (schoolId) headers['X-School-ID'] = schoolId;
        const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;
        if (token) headers['Authorization'] = `Token ${token}`;

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(res.statusText);
        return { data: await res.json() };
    },
    delete: async (endpoint: string) => {
        const schoolId = typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined;
        const headers: any = {};
        if (schoolId) headers['X-School-ID'] = schoolId;
        const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;
        if (token) headers['Authorization'] = `Token ${token}`;

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error(res.statusText);
        return { data: null };
    }
};

// Access Security
export async function generateResetCode(staffId: number, schoolId?: string): Promise<{ code: string }> {
    return fetchWithSchool(`/staff/reset-code/${staffId}/`, schoolId);
}

// ============================================
// CERTIFICATE API
// ============================================

export interface Certificate {
    id: number;
    certificate_no: string;
    verification_code: string;
    type: string;
    purpose?: string;
    issued_date: string;
    pdf_url?: string;
    qr_code_url?: string;
    is_revoked: boolean;
    student: {
        id: number;
        first_name: string;
        last_name: string;
        enrollment_number: string;
    };
}

export interface CertificateGenerateRequest {
    purpose?: string;
}

export interface CertificateGenerateResponse {
    success: boolean;
    certificate_id: number;
    certificate_no: string;
    verification_code: string;
    pdf_url?: string;
    message: string;
}

export interface CertificateVerificationResponse {
    valid: boolean;
    status: 'VALID' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND';
    certificate_no?: string;
    type?: string;
    student_name?: string;
    school_name?: string;
    issued_date?: string;
    message?: string;
}

// Certificate types
export const CERTIFICATE_TYPES = [
    { value: 'BONAFIDE', label: 'Bonafide Certificate' },
    { value: 'TC', label: 'Transfer Certificate' },
    { value: 'LC', label: 'Leaving Certificate' },
    { value: 'MIGRATION', label: 'Migration Certificate' },
    { value: 'CHARACTER', label: 'Character Certificate' },
    { value: 'CONDUCT', label: 'Conduct Certificate' },
    { value: 'STUDY', label: 'Study Certificate' },
    { value: 'ATTENDANCE', label: 'Attendance Certificate' },
    { value: 'SPORTS', label: 'Sports Participation' },
    { value: 'ACHIEVEMENT', label: 'Achievement Certificate' },
    { value: 'FEE_CLEARANCE', label: 'Fee Clearance Certificate' },
    { value: 'COURSE_COMPLETION', label: 'Course Completion' },
    { value: 'CUSTOM', label: 'Custom Certificate' },
];

// Generate certificate for a student
export async function generateCertificate(
    studentId: number,
    certType: string,
    purpose?: string,
    schoolId?: string
): Promise<CertificateGenerateResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (effectiveSchoolId) {
        headers['X-School-ID'] = effectiveSchoolId;
    }

    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }

    const res = await fetch(
        `${API_BASE_URL}/certificates/generate/${studentId}/${certType}/`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({ purpose: purpose || '' })
        }
    );

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate certificate');
    }

    return res.json();
}

// Download certificate PDF
export async function downloadCertificate(
    certificateId: number,
    schoolId?: string
): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('school_token') : null;
    const effectiveSchoolId = schoolId || (typeof window !== 'undefined' ? localStorage.getItem('school_id') : undefined) || DEFAULT_SCHOOL_ID;

    const headers: HeadersInit = {};

    if (effectiveSchoolId) {
        headers['X-School-ID'] = effectiveSchoolId;
    }

    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }

    const res = await fetch(
        `${API_BASE_URL}/certificates/download/${certificateId}/`,
        { headers }
    );

    if (!res.ok) {
        throw new Error('Failed to download certificate');
    }

    return res.blob();
}

// Verify certificate (public endpoint)
export async function verifyCertificate(
    verificationCode: string
): Promise<CertificateVerificationResponse> {
    const res = await fetch(
        `${API_BASE_URL}/certificates/verify/${verificationCode}/`
    );

    if (!res.ok && res.status !== 404) {
        throw new Error('Failed to verify certificate');
    }

    return res.json();
}

// Get all certificates for a student
export async function getStudentCertificates(
    studentId: number,
    schoolId?: string
): Promise<Certificate[]> {
    return fetchWithSchool(`/students/${studentId}/certificates/`, schoolId);
}
