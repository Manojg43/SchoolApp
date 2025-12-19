# 🚀 Project State & Recent Changes (Read This First)

**Last Updated:** 2025-12-18
**Purpose:** This file tracks critical architectural changes and features added in the latest sprint. **Agents must read this file to understand the current system state.**

---

## 🚀 Latest Updates (Web & Integrations) - 2025-12-18
### **1. 🌐 Web Dashboard**
*   **New Modules**: Added **Communication** (Notices) and **Academic** (Homework) tabs to Sidebar.
*   **Refactor**: Rewrote `NoticesPage` and `HomeworkPage` to remove dependencies (`date-fns`, `shadcn`) and use native `AppShell`.
*   **Sync**: Verified real-time synchronization with Mobile App (Shared DB).

### **2. 📱 Mobile Payslip (Secure Download)**
*   **Security Upgrade**: Implemented **Signed URL** flow for PDF downloads.
    *   Previously: Direct link (Failed due to Auth).
    *   Now: Mobile requests temporary link -> Backend signs it -> Browser opens secure link.

### **3. 🛡️ Permissions & Audit**
*   **SuperAdmin**: Fixed `NoticeViewSet` and `HomeworkViewSet` to allow SuperAdmin full visibility.
*   **Audit**: Conducted full system audit (`audit_report.md` available). Confirmed strict School Isolation logic in `StandardPermission`.

---

## 1. 📱 Mobile App (Android)
-   **Scanner UI**: Replaced default camera with a **Square Viewfinder** overlay (Green corners, dimmed background) in `ScanScreen.tsx`.
-   **QR Protocol**: Now sends **JSON Data** (`{ token, school, exp }`) instead of raw strings.
-   **Endpoint**: Points to `/api/staff/attendance/scan/`.
-   **Release**: APK built at `schoolapp-release.apk` (Project Root).

## 2. 💻 Frontend (Web)
-   **UI/UX Engine**:
    -   **Global Transitions**: `AnimatePresence` in `AppShell.tsx` for smooth "Tab Switch" effects.
    -   **FAB**: Multi-action Floating Button (New Student, Add Fees) in bottom-right.
    -   **Sidebar**: Modernized with `lucide-react` icons and hover effects.
-   **Settings**: Can upload Logo/Signature (Base64) and set GPS Coordinates.
-   **QR Generation**: Generates **JSON-embedded QRs** valid for **5 minutes** (handles time drift).
-   **Modules Added**:
    -   `Reports`: Attendance & Finance Analytics.
    -   `Certificates`: PDF Generation (Bonafide, Leaving).

## 3. ⚙️ Backend (Django)
-   **QR Validation**:
    -   **JSON Parsing**: Smart detection of JSON vs Raw strings in `ScanAttendanceView`.
    -   **Time Window**: Relaxed to **5 minutes** (300s) to fix "Malformed/Expired Token" on mobile.
-   **Router**: `SchoolViewSet` explicitly registered with `basename='school'` in `config/urls.py` (Fixed startup crash).
-   **API**:
    -   `GET /staff/qr/generate/`: Returns signed JSON token.
    -   `POST /staff/attendance/scan/`: Accepts `{ qr_token, latitude, longitude }`.

---

## 🛑 Critical Constraints
-   **AI Removed**: All Google Gemini integration was **removed** upon request. Do not hallucinate AI features.
-   **Permissions**: `StandardPermission` class governs most access. Mobile uses Token Auth.
