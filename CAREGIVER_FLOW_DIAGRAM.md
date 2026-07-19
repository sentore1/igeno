# Caregiver Registration & Login Flow

## 📊 Visual Flow Diagram

### Complete Flow from Admin to Caregiver Login

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    ADMIN CREATES CAREGIVER ACCOUNT                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD → Caregiver Management → Add Caregiver             │
│                                                                     │
│  Form Fields:                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Full Name:        Jane Smith                                  │ │
│  │ Email:           jane.smith@example.com                       │ │
│  │ Phone:           +1-555-1234                                  │ │
│  │ Specialization:  Elderly Care                                 │ │
│  │                                                               │ │
│  │ ☑ Send login PIN via email                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                        [Add Caregiver]                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API: POST /api/admin/caregivers                  │
│                                                                     │
│  1. ✓ Verify admin session                                         │
│  2. ✓ Verify admin role                                            │
│  3. ✓ Generate 6-digit PIN (e.g., 123456)                          │
│  4. ✓ Create auth.users record                                     │
│  5. ✓ Create profiles record                                       │
│  6. ✓ Create caregivers record                                     │
│  7. ✓ Send email (if selected)                                     │
│  8. ✓ Return success + PIN                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                        ▼                       ▼
        ┌───────────────────────┐   ┌───────────────────────┐
        │   Email Delivery      │   │   Manual Delivery     │
        │   (if checkbox on)    │   │   (if checkbox off)   │
        └───────────────────────┘   └───────────────────────┘
                        │                       │
                        ▼                       ▼
        ┌───────────────────────┐   ┌───────────────────────┐
        │ 📧 Email to Caregiver │   │ 💬 PIN in Modal       │
        │                       │   │                       │
        │ Subject: Account...   │   │ Display:              │
        │ Email: jane@...       │   │ Email: jane@...       │
        │ PIN: 123456           │   │ PIN: 123456 [Copy]    │
        └───────────────────────┘   └───────────────────────┘
                        │                       │
                        └───────────┬───────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ADMIN SEES SUCCESS MODAL                       │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ ✅ Caregiver Account Created!                                 │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │ Email: jane.smith@example.com                                 │ │
│  │ Login PIN: 123456                               [Copy]        │ │
│  │                                                               │ │
│  │ 📧 Status: Email Sent / ⚠️ Manual Delivery Required           │ │
│  │                                                               │ │
│  │                         [Close]                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  ADMIN SHARES CREDENTIALS WITH CAREGIVER            │
│                 (if manual delivery was selected)                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    CAREGIVER RECEIVES CREDENTIALS                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CAREGIVER GOES TO LOGIN PAGE                      │
│                                                                     │
│                    https://platform.com/auth/signin                 │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                        🔐 Sign In                             │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  Email:                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ jane.smith@example.com                                  │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  Password:                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 123456                                                  │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │                      [Sign In]                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE AUTHENTICATES                         │
│                                                                     │
│  1. ✓ Verify email exists in auth.users                            │
│  2. ✓ Compare password hash with PIN                               │
│  3. ✓ Check email_confirmed_at (auto-confirmed)                    │
│  4. ✓ Create session token                                         │
│  5. ✓ Return session                                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 ✅ LOGIN SUCCESSFUL - REDIRECT                      │
│                                                                     │
│              Route: /dashboard/caregiver                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CAREGIVER DASHBOARD                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   Welcome, Jane Smith!                        │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  📊 Dashboard Overview                                        │ │
│  │  ├─ My Bookings                                               │ │
│  │  ├─ Upcoming Appointments                                     │ │
│  │  ├─ My Schedule                                               │ │
│  │  ├─ Profile Settings                                          │ │
│  │  └─ Availability Management                                   │ │
│  │                                                               │ │
│  │  ⭐ Rating: 0.0 (New caregiver)                               │ │
│  │  📅 Bookings: 0 completed                                     │ │
│  │  ✅ Status: Active                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Database Operations Flow

```
Admin Creates Caregiver
         │
         ▼
┌─────────────────────┐
│   Generate PIN      │
│   (e.g., 123456)    │
└─────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Create Auth User                                   │
│  ───────────────────────────────────────────────────────    │
│  Table: auth.users                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ id:                  uuid-1234                        │ │
│  │ email:              jane.smith@example.com            │ │
│  │ encrypted_password: [hashed PIN]                      │ │
│  │ email_confirmed_at: 2026-07-19 (NOW)                 │ │
│  │ raw_user_meta_data: {                                 │ │
│  │   full_name: "Jane Smith",                            │ │
│  │   role: "caregiver"                                   │ │
│  │ }                                                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Create Profile                                     │
│  ───────────────────────────────────────────────────────    │
│  Table: public.profiles                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ id:         uuid-1234 (same as auth user)             │ │
│  │ full_name:  Jane Smith                                │ │
│  │ email:      jane.smith@example.com                    │ │
│  │ role:       caregiver                                 │ │
│  │ created_at: 2026-07-19                                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Create Caregiver Record                            │
│  ───────────────────────────────────────────────────────    │
│  Table: public.caregivers                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ id:              uuid-5678                            │ │
│  │ user_id:         uuid-1234 (links to auth user)       │ │
│  │ full_name:       Jane Smith                           │ │
│  │ email:           jane.smith@example.com               │ │
│  │ phone:           +1-555-1234                          │ │
│  │ specialization:  Elderly Care                         │ │
│  │ rating:          0                                    │ │
│  │ availability:    []                                   │ │
│  │ created_at:      2026-07-19                           │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Send Email        │
│   (if selected)     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Return Success    │
│   with PIN          │
└─────────────────────┘
```

## 🔐 Authentication Flow

```
Caregiver Login Request
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Auth Check                                        │
│  ───────────────────────────────────────────────────────    │
│  1. Find user by email                                      │
│     SELECT * FROM auth.users WHERE email = ?                │
│                                                             │
│  2. Verify password (PIN) hash                              │
│     bcrypt.compare(inputPIN, stored_hash)                   │
│                                                             │
│  3. Check email confirmation                                │
│     WHERE email_confirmed_at IS NOT NULL                    │
│                                                             │
│  4. Generate session token                                  │
│     CREATE SESSION with JWT                                 │
└─────────────────────────────────────────────────────────────┘
         │
         ├─── ❌ Failed → Return error
         │
         └─── ✅ Success
                  │
                  ▼
         ┌─────────────────────┐
         │  Create Session     │
         │  Set Auth Cookie    │
         └─────────────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │  Check User Role    │
         │  from profiles      │
         └─────────────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │   Redirect Based    │
         │   on Role           │
         ├─────────────────────┤
         │ caregiver →         │
         │ /dashboard/caregiver│
         └─────────────────────┘
```

## 📧 Email Delivery Options

```
┌─────────────────────────────────────────────────────────────┐
│              EMAIL DELIVERY: ENABLED                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Email Content                                              │
│  ───────────────────────────────────────────────────────    │
│  To:      jane.smith@example.com                            │
│  From:    noreply@platform.com                              │
│  Subject: Your Caregiver Account Credentials                │
│                                                             │
│  Body:                                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │  Welcome Jane Smith!                                  │ │
│  │                                                       │ │
│  │  Your caregiver account has been created.             │ │
│  │                                                       │ │
│  │  Login Credentials:                                   │ │
│  │  Email: jane.smith@example.com                        │ │
│  │  PIN: 123456                                          │ │
│  │                                                       │ │
│  │  You can login at:                                    │ │
│  │  https://platform.com/auth/signin                     │ │
│  │                                                       │ │
│  │  Please keep this PIN secure.                         │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              EMAIL DELIVERY: DISABLED                       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Admin Modal Display                                        │
│  ───────────────────────────────────────────────────────    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ⚠️ Manual Delivery Required                           │ │
│  │                                                       │ │
│  │ Please provide these credentials to the caregiver     │ │
│  │ securely. Make sure to copy the PIN before closing.   │ │
│  │                                                       │ │
│  │ Email: jane.smith@example.com                         │ │
│  │ PIN:   123456                          [Copy]         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🎭 User Roles & Access

```
┌─────────────────────────────────────────────────────────────┐
│                         ADMIN                               │
├─────────────────────────────────────────────────────────────┤
│  Access:                                                    │
│  ✅ /dashboard/admin                                        │
│  ✅ /dashboard/admin/caregivers                             │
│  ✅ /dashboard/admin/users                                  │
│  ✅ /dashboard/admin/bookings                               │
│  ✅ /dashboard/admin/courses                                │
│  ✅ /dashboard/admin/reports                                │
│  ✅ /dashboard/admin/settings                               │
│                                                             │
│  Permissions:                                               │
│  ✅ Create caregiver accounts                               │
│  ✅ View all caregivers                                     │
│  ✅ Edit any caregiver                                      │
│  ✅ Delete caregivers                                       │
│  ✅ Generate PINs                                           │
│  ✅ Manage all bookings                                     │
│  ✅ View analytics                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      CAREGIVER                              │
├─────────────────────────────────────────────────────────────┤
│  Access:                                                    │
│  ✅ /dashboard/caregiver                                    │
│  ✅ /profile                                                │
│  ✅ Own bookings only                                       │
│                                                             │
│  Permissions:                                               │
│  ✅ View own dashboard                                      │
│  ✅ View assigned bookings                                  │
│  ✅ Update own profile                                      │
│  ✅ Manage own availability                                 │
│  ✅ View own ratings                                        │
│  ❌ Cannot create other accounts                            │
│  ❌ Cannot access admin areas                               │
│  ❌ Cannot view other caregivers' data                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       CLIENT                                │
├─────────────────────────────────────────────────────────────┤
│  Access:                                                    │
│  ✅ /dashboard (client view)                                │
│  ✅ /care/booking                                           │
│  ✅ /academy                                                │
│  ✅ /profile                                                │
│                                                             │
│  Permissions:                                               │
│  ✅ Book caregivers                                         │
│  ✅ View own bookings                                       │
│  ✅ Rate caregivers                                         │
│  ✅ Enroll in courses                                       │
│  ❌ Cannot access caregiver dashboard                       │
│  ❌ Cannot access admin areas                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Navigation Flow

```
                    Landing Page (/)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
      /academy       /care/booking    /auth/signin
                                           │
                                           ▼
                                    [Login Form]
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
               role=admin            role=caregiver         role=client
                    │                      │                      │
                    ▼                      ▼                      ▼
         /dashboard/admin      /dashboard/caregiver      /dashboard
                    │                      │                      │
                    │                      │                      │
    ┌───────────────┼────────┐            │                      │
    │               │        │            │                      │
    ▼               ▼        ▼            ▼                      ▼
/admin/users   /admin/     /admin/   [Caregiver             [Client
              caregivers   courses    Features]              Features]
                   │
                   ▼
         [Add Caregiver Form]
                   │
                   ▼
           [Generate PIN]
                   │
                   ▼
           [Success Modal]
```

## ✨ Key Features Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE HIGHLIGHTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Auto-Generated 6-Digit PIN                              │
│     └─ Secure random generation (100000-999999)            │
│                                                             │
│  ✅ Email Delivery Option                                   │
│     ├─ Send PIN automatically via email                    │
│     └─ Or display for manual sharing                       │
│                                                             │
│  ✅ Instant Account Activation                              │
│     ├─ No email verification needed                        │
│     └─ Auto-confirmed on creation                          │
│                                                             │
│  ✅ Complete Account Setup                                  │
│     ├─ Auth user (login credentials)                       │
│     ├─ Profile (user information)                          │
│     └─ Caregiver record (specialization, etc.)             │
│                                                             │
│  ✅ Transaction Safety                                      │
│     ├─ Rollback on any failure                             │
│     └─ Atomic operation                                    │
│                                                             │
│  ✅ Admin Control                                           │
│     ├─ Only admins can create accounts                     │
│     └─ Permission checks at API level                      │
│                                                             │
│  ✅ User-Friendly UI                                        │
│     ├─ Success modal with copy button                      │
│     ├─ Clear status indicators                             │
│     └─ Helpful warnings and notices                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**This flow diagram shows the complete journey from admin creating a caregiver account to the caregiver logging in and accessing their dashboard. All operations are secure, atomic, and user-friendly.**
