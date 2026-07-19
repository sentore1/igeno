# Courses Navigation Flow

## 📍 Where Courses Links Go

### Overview
When users click on "courses" or course-related links in your platform, they navigate through this flow:

## 🗺️ Complete Navigation Map

### 1. **Homepage (`/`)**
   ```
   Homepage
   ├─ Hero Section (Left side)
   └─ Courses Section (Right side) ← Shows featured courses
   ```

   **What Users See:**
   - Split layout with hero content on left
   - Course listings on right side
   - Courses displayed directly on homepage

---

### 2. **Navigation Menu → Academy**
   ```
   Navigation Bar
   ├─ Care Services → /care
   ├─ Academy → /academy  ← Main academy page
   └─ Dashboard → /dashboard
   ```

   **When Clicked:**
   - Goes to: `/academy`
   - Shows: Academy landing page with overview

---

### 3. **Academy Page (`/academy`)**
   ```
   /academy
   ├─ Hero: "Igeno Gate Academy"
   ├─ "Browse Courses" button → /academy/courses
   ├─ "My Dashboard" button → /dashboard
   ├─ Features section (Video Lessons, Resources, etc.)
   ├─ Featured Courses (First 6 courses)
   │  └─ Each course card → /academy/courses/[id]
   ├─ Course Categories (6 categories)
   │  └─ Each category → /academy/courses?category=[name]
   └─ "Explore All Courses" button → /academy/courses
   ```

   **Main Call-to-Action Buttons:**
   1. **"Browse Courses"** → `/academy/courses` (All courses listing)
   2. **"View Course"** (on each card) → `/academy/courses/[specific-course-id]`
   3. **Category links** → `/academy/courses?category=Caregiver+Training`
   4. **"Explore All Courses"** → `/academy/courses`

---

### 4. **All Courses Page (`/academy/courses`)**
   ```
   /academy/courses
   ├─ Page Title: "All Courses"
   ├─ Create Course button (admins/trainers only)
   ├─ Category Filter Buttons
   │  ├─ All Courses (default)
   │  ├─ Caregiver Training
   │  ├─ Nursing Skills
   │  ├─ Health & Safety
   │  ├─ Communication
   │  ├─ Career Development
   │  └─ Specialized Care
   ├─ Courses Grid (3 columns)
   │  └─ Each course card → /academy/courses/[id]
   └─ Filter by URL parameter: ?category=[name]
   ```

   **What Users See:**
   - All published courses in a grid layout
   - Category filter buttons at top
   - Each course shows:
     - Category badge
     - Title
     - Description
     - Duration
     - "View Course" button

   **Special Features:**
   - Admins and trainers see "Create Course" button
   - URL filtering: `/academy/courses?category=Nursing+Skills`
   - Only shows published courses (`is_published = true`)

---

### 5. **Individual Course Page (`/academy/courses/[id]`)**
   ```
   /academy/courses/[id]
   ├─ Course Details
   ├─ Course Content
   ├─ Enrollment Options
   └─ Related Information
   ```

   **Examples:**
   - `/academy/courses/123-abc-def` → Specific course details
   - `/academy/courses/456-ghi-jkl` → Another course

---

### 6. **Course Learning Page (`/academy/courses/[id]/learn`)**
   ```
   /academy/courses/[id]/learn
   ├─ Course Player
   ├─ Lessons List
   ├─ Resources
   ├─ Progress Tracking
   └─ Quizzes/Assessments
   ```

   **When Accessed:**
   - User must be enrolled in the course
   - Interactive learning environment
   - Track progress through lessons

---

## 🎯 Quick Reference: Where Each Link Goes

| Link Location | Link Text/Button | Destination | Purpose |
|---------------|------------------|-------------|---------|
| **Homepage** | Course cards (right side) | `/academy/courses/[id]` | View specific course |
| **Navigation Menu** | "Academy" | `/academy` | Academy landing page |
| **Academy Page** | "Browse Courses" | `/academy/courses` | All courses list |
| **Academy Page** | "My Dashboard" | `/dashboard` | User dashboard |
| **Academy Page** | Course cards | `/academy/courses/[id]` | Specific course details |
| **Academy Page** | Category names | `/academy/courses?category=[name]` | Filtered courses |
| **Academy Page** | "Explore All Courses" | `/academy/courses` | All courses list |
| **Courses Page** | "View Course" button | `/academy/courses/[id]` | Specific course details |
| **Courses Page** | "Create Course" (admin) | `/dashboard/admin/courses` | Admin course management |
| **Course Detail** | "Start Learning" / "Continue" | `/academy/courses/[id]/learn` | Course player |

---

## 📂 File Structure

```
app/
├── page.tsx                              # Homepage with courses
├── academy/
│   ├── page.tsx                         # Academy landing page
│   └── courses/
│       ├── page.tsx                     # All courses listing
│       └── [id]/
│           ├── page.tsx                 # Course details
│           └── learn/
│               └── page.tsx             # Course learning interface
└── dashboard/
    └── admin/
        └── courses/
            └── page.tsx                 # Admin course management
```

---

## 🔄 Complete User Journey Examples

### Journey 1: New Visitor Exploring Courses

```
1. Land on Homepage (/)
   └─ See courses on right side

2. Click "Academy" in navigation
   └─ Go to /academy

3. Click "Browse Courses" button
   └─ Go to /academy/courses
   └─ See all available courses

4. Click category "Caregiver Training"
   └─ Filter to /academy/courses?category=Caregiver+Training
   └─ See only caregiver training courses

5. Click "View Course" on a specific course
   └─ Go to /academy/courses/abc-123
   └─ See course details

6. Click "Enroll" or "Start Learning"
   └─ Go to /academy/courses/abc-123/learn
   └─ Begin course content
```

---

### Journey 2: Returning Student

```
1. Login at /auth/signin

2. Click "Dashboard" in navigation
   └─ Go to /dashboard
   └─ See enrolled courses

3. Click "Continue Learning" on a course
   └─ Go to /academy/courses/abc-123/learn
   └─ Resume where they left off
```

---

### Journey 3: Admin Creating Course

```
1. Login as admin

2. Go to /academy/courses

3. Click "Create Course" button
   └─ Go to /dashboard/admin/courses
   └─ See course management interface

4. Fill course creation form
   └─ Create new course

5. Publish course
   └─ Course now appears in /academy/courses
```

---

## 🎨 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Homepage (/)                          │
│  ┌──────────────────┐         ┌──────────────────────┐     │
│  │   Hero Section   │         │   Courses Section    │     │
│  │   (Left Side)    │         │   (Right Side)       │     │
│  └──────────────────┘         └──────────────────────┘     │
│                                          │                   │
│                                          ↓                   │
│                                 Click course card            │
│                                          │                   │
└──────────────────────────────────────────┼───────────────────┘
                                           │
                    ┌──────────────────────┴────────────────────────┐
                    │                                                │
                    ↓                                                ↓
        ┌──────────────────────┐                   ┌─────────────────────────┐
        │   Academy Landing    │                   │   Specific Course       │
        │   (/academy)         │                   │   (/academy/courses/id) │
        └──────────────────────┘                   └─────────────────────────┘
                    │                                                │
                    │                                                │
       ┌────────────┼────────────┐                                 │
       │            │            │                                  │
       ↓            ↓            ↓                                  ↓
   Featured    Categories   Browse Button              ┌────────────────────┐
   Courses        │            │                       │  Course Learning   │
       │          │            │                       │  (/...id/learn)    │
       │          │            │                       └────────────────────┘
       │          ↓            ↓
       │    Filter Courses    │
       │          │            │
       │          ↓            │
       └──────►  ┌────────────────────────┐  ◄─────────┘
                 │   All Courses Page     │
                 │   (/academy/courses)   │
                 └────────────────────────┘
                            │
                            ↓
                    Filter by category
                            │
                            ↓
                  /academy/courses?category=X
```

---

## 🔍 URL Patterns Explained

### Static Routes
- `/` - Homepage
- `/academy` - Academy landing page
- `/academy/courses` - All courses listing

### Dynamic Routes
- `/academy/courses/[id]` - Course detail page
  - Example: `/academy/courses/550e8400-e29b-41d4-a716-446655440000`
  - The `[id]` is a UUID from the database

- `/academy/courses/[id]/learn` - Course learning interface
  - Example: `/academy/courses/550e8400-e29b-41d4-a716-446655440000/learn`

### Query Parameters
- `/academy/courses?category=Caregiver+Training` - Filtered by category
- `/academy/courses?category=Nursing+Skills` - Different category
- `/academy/courses` (no param) - Shows all courses

---

## 👥 Role-Based Navigation Differences

### Guest Users (Not Logged In)
- ✅ Can view homepage courses
- ✅ Can browse academy page
- ✅ Can view all courses listing
- ✅ Can view course details
- ❌ Cannot access course learning content
- ❌ Cannot see "Create Course" button

### Students/Clients (Logged In)
- ✅ All guest permissions +
- ✅ Can enroll in courses
- ✅ Can access enrolled course content
- ✅ Can track progress
- ❌ Cannot create courses

### Trainers (Logged In)
- ✅ All student permissions +
- ✅ Can create courses
- ✅ Can see "Create Course" button on `/academy/courses`
- ✅ Button links to `/dashboard/admin/courses`

### Admins (Logged In)
- ✅ All trainer permissions +
- ✅ Full course management access
- ✅ Can publish/unpublish courses
- ✅ Can edit any course

---

## 🎯 Key Takeaways

1. **Primary Courses Entry Point:** `/academy/courses`
   - This is the main courses listing page
   - Accessible from multiple locations

2. **Multiple Paths to Courses:**
   - Homepage → Course cards → Individual course
   - Navigation → Academy → Browse Courses
   - Navigation → Academy → Featured courses
   - Navigation → Academy → Categories → Filtered courses

3. **Course Detail Pages:** `/academy/courses/[id]`
   - Shows full course information
   - Enrollment options
   - Course curriculum

4. **Learning Interface:** `/academy/courses/[id]/learn`
   - Actual course content delivery
   - Only accessible to enrolled users

5. **Admin Management:** `/dashboard/admin/courses`
   - Separate from public course pages
   - Full CRUD operations
   - Only accessible to admins/trainers

---

## 🚀 Quick Command Reference

### For Users:
- **Browse all courses:** Click "Academy" → "Browse Courses"
- **Filter by category:** Click category name on academy page
- **View course details:** Click "View Course" on any course card
- **Start learning:** Click "Start Learning" on course detail page

### For Admins:
- **Manage courses:** `/dashboard/admin/courses`
- **Create course:** Click "Create Course" on courses page or admin dashboard
- **Edit course:** Go to admin courses page, click "Edit"

---

##  Summary

**Main Question: "Where does courses go?"**

**Answer:** 
When users click on courses-related links, they typically navigate to:
1. **`/academy`** - Academy landing page (overview)
2. **`/academy/courses`** - All courses listing (main destination)
3. **`/academy/courses/[id]`** - Individual course details
4. **`/academy/courses/[id]/learn`** - Course learning interface

The most common destination is **`/academy/courses`** which shows all available courses in a filterable grid layout.

---

**Created:** Navigation flow documentation  
**Date:** 2026-07-19  
**File:** `COURSES_NAVIGATION_FLOW.md`
