# Care & Igeno Platform

A modular web platform with two main divisions:

## Division A – Care & Family Wellness
Complete care management system with client registration, booking, caregiver assignment, scheduling, and reporting.

## Division B – Igeno Gate Academy
Learning Management System (LMS) with courses, videos, quizzes, certificates, and career resources.

## Features
- Single Sign-On (SSO) with unified authentication
- Role-based access control (Admin, Trainer, Student, Caregiver, Nurse, Consultant, Client)
- Secure online payments
- Email and in-app notifications
- Reporting and analytics
- Responsive design

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database
Run the SQL schema in your Supabase project:
```bash
# Copy contents of supabase-schema.sql to Supabase SQL Editor and execute
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
```
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (care)/              # Division A - Care Management
│   ├── (academy)/           # Division B - LMS
│   ├── dashboard/           # User dashboards
│   └── api/                 # API routes
├── components/              # Reusable components
├── lib/                     # Utilities and configurations
└── public/                  # Static assets
```

## User Roles
- **Admin**: Full system access
- **Trainer**: Manage courses and students
- **Student**: Access courses and learning materials
- **Caregiver**: Manage appointments and client care
- **Nurse**: Healthcare services
- **Consultant**: Provide consultancy services
- **Client**: Book care services

## Development
```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```
