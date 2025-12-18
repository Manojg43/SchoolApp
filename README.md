# SchoolApp - School Management System

A comprehensive, cloud-based platform for managing school operations, including Staff, Students, Fees, and Transport.

## 🚀 Live Demo

- **Frontend (Production)**: [https://web-kappa-bice-45.vercel.app](https://web-kappa-bice-45.vercel.app)
- **Backend API**: [https://schoolapp-6vwg.onrender.com/api](https://schoolapp-6vwg.onrender.com/api)

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod Validation
- **Hosting**: Vercel

### Backend
- **Framework**: Django 5 + Django REST Framework (DRF)
- **Database**: SQLite (Dev) / PostgreSQL (Prod support)
- **Authentication**: Token Authentication (DRF)
- **Hosting**: Render

## ✨ Key Features (Recent Updates)

### 1. Staff Management
- **Robust Form Validation**: All key fields (Designation, Department, Joining Date) are mandatory.
- **Enhanced UX**: Immediate visual feedback with a Success Popup upon creation.
- **Error Handling**: Visible error banners capture and display validation/API errors (e.g., duplicated emails).

### 2. Student Management
- **Directory**: searchable list of all students with filtering.
- **Data Isolation**: Multi-tenant architecture using headers to isolate data per school.

### 3. Security & Infrastructure
- **CORS Configured**: Secure cross-origin requests allowed for production domains.
- **Header-Based Auth**: Uses `X-School-ID` custom header for tenant isolation (CORS whitelist updated).

## 🏃‍♂️ Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
1. Navigate to root:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run migrations and start server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   Server runs at `http://127.0.0.1:8000`.

### Frontend Setup
1. Navigate to web directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000`.

## 📦 Deployment

- **Frontend**: Commits to `main` branch automatically trigger Vercel deployments.
- **Backend**: Commits to `main` branch automatically trigger Render deployments (Zero Downtime).
