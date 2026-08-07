# Course Payment, Quiz Limits, and Certificate Features Guide

## Overview

This guide covers the new features added to the learning management system:

1. **Quiz Attempt Limits** (2 attempts maximum)
2. **Course Payment System** with MoMo QR code and admin approval
3. **Certificate Generation** with student names
4. **Featured Images** for courses

## Setup Instructions

### 1. Run the Database Migration

Run this SQL script in your Supabase SQL Editor:

```bash
scripts/add-course-payment-and-features.sql
```

This script will:
- Add `featured_image_url`, `price`, `is_free`, and `requires_payment` columns to courses
- Create `course_payments` table for payment tracking
- Add `max_attempts` to quizzes (default: 2)
- Enhance certificates with student names and course details
- Add payment status tracking to enrollments
- Create automated certificate generation
- Set up RLS policies for all new tables

### 2. Create Storage Buckets in Supabase

Go to Supabase Dashboard → Storage and create these buckets:

**a) course-images** (for featured images)
- Public bucket
- Allowed file types: image/png, image/jpeg, image/gif, image/webp
- Max file size: 5MB

**b) course-payments** (for payment proofs)
- Public bucket  
- Allowed file types: image/*, application/pdf
- Max file size: 10MB

### 3. Update Payment Settings

Go to Admin Dashboard → Settings → Payment Settings and configure:

**Mobile Money (MoMo)**
- Account Name
- Phone Number
- Instructions

**Bank Transfer**
- Bank Name
- Account Name
- Account Number

## Features Usage

### 1. Quiz Attempt Limits

**For Students:**
- Each quiz can be attempted a maximum of 2 times
- After 2 attempts, the quiz becomes locked
- The best score is recorded

**For Admins:**
- When creating/editing a quiz, set `max_attempts` (default is 2)
- View attempt history in the admin dashboard

**Database Functions:**
```sql
-- Check if student can attempt a quiz
SELECT can_attempt_quiz('quiz-id', 'user-id');

-- Check for course quizzes
SELECT can_attempt_course_quiz('quiz-id', 'user-id');
```

### 2. Course Payment System

#### Creating a Paid Course

1. Go to Admin Dashboard → Courses → Create Course
2. Fill in course details
3. **Set Price**: Enter price in RWF (0 for free)
4. **Upload Featured Image**: Add an attractive course image
5. **Check "Require payment approval"** if price > 0
6. Publish the course

#### Student Enrollment Flow

**For Free Courses:**
1. Click "Enroll Now"
2. Instant access to course content

**For Paid Courses:**
1. Click "Enroll Now"
2. Payment modal appears
3. Choose payment method (MoMo or Bank)
4. **For MoMo:**
   - Scan QR code or enter phone number manually
   - Complete payment via mobile money
   - Upload payment screenshot (optional but recommended)
5. **For Bank Transfer:**
   - View bank details
   - Make transfer
   - Upload payment proof
6. Enter transaction reference
7. Submit payment
8. Wait for admin approval

**Enrollment Status:**
- `pending` - Payment submitted, awaiting approval
- `approved` - Payment approved, course access granted
- `rejected` - Payment rejected, no access

#### Admin Payment Management

Create a new admin page at:
`app/dashboard/admin/payments/page.tsx`

Features needed:
- View all pending payments
- See payment proofs
- Approve/reject payments
- View payment history
- Filter by status and course

**Quick SQL to view pending payments:**
```sql
SELECT 
  cp.*,
  p.full_name as student_name,
  c.title as course_title
FROM course_payments cp
JOIN profiles p ON cp.user_id = p.id
JOIN courses c ON cp.course_id = c.id
WHERE cp.status = 'pending'
ORDER BY cp.created_at DESC;
```

### 3. Certificate Generation

**Automatic Generation:**
- When a student completes 100% of a course, a certificate is automatically generated
- Trigger: `UPDATE enrollments SET completed = true`

**Manual Generation:**
```sql
SELECT generate_course_certificate('user-id', 'course-id');
```

**Certificate Details Include:**
- Student's full name (from profile)
- Course title
- Completion date
- Certificate number (unique: CERT-YY-XXXXXXXX)
- Final average quiz score

**Viewing Certificates:**

Students can view/download their certificates at:
`/academy/courses/{id}/certificate`

```typescript
// In the learn page, add a "View Certificate" button when completed
{enrollment?.completed && (
  <Link 
    href={`/academy/courses/${id}/certificate`}
    className="px-6 py-3 bg-green-600 text-white rounded-lg"
  >
    🎓 View Certificate
  </Link>
)}
```

### 4. Featured Images for Courses

**Adding Featured Image:**
1. Admin Dashboard → Create/Edit Course
2. Click "Featured Image" section
3. Upload image (PNG, JPG, GIF)
4. Recommended size: 800x400px
5. Max size: 5MB

**Display:**
- Course listing pages
- Course detail page
- Enrollment cards
- Search results

## API Endpoints Needed

### 1. Payment Approval Endpoint

Create: `app/api/admin/payments/[id]/approve/route.ts`

```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify admin
  // Update payment status to 'approved'
  // Grant course access
  // Send notification to student
}
```

### 2. Payment Rejection Endpoint

Create: `app/api/admin/payments/[id]/reject/route.ts`

```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify admin
  // Update payment status to 'rejected'
  // Add rejection reason
  // Send notification to student
}
```

### 3. Certificate View Endpoint

Create: `app/academy/courses/[id]/certificate/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import CourseCertificate from '@/components/CourseCertificate';

export default function CertificatePage({ params }) {
  const [certificate, setCertificate] = useState(null);
  
  // Load certificate data
  // Display using CourseCertificate component
}
```

## Testing Checklist

### Quiz Attempt Limits
- [ ] Create a quiz with 2 max attempts
- [ ] Student attempts quiz first time
- [ ] Student fails and attempts second time
- [ ] Verify quiz is locked after 2 attempts
- [ ] Check both attempts are recorded in database

### Course Payment
- [ ] Create a paid course (e.g., 5000 RWF)
- [ ] Upload featured image
- [ ] Student enrolls and sees payment modal
- [ ] Student submits MoMo payment
- [ ] Admin sees payment in pending list
- [ ] Admin approves payment
- [ ] Student gains course access
- [ ] Test rejection flow

### Certificates
- [ ] Student completes a course (100% progress)
- [ ] Certificate is auto-generated
- [ ] Certificate shows correct student name
- [ ] Certificate shows correct course title
- [ ] Certificate has unique number
- [ ] Certificate shows completion date
- [ ] Student can download/print certificate

### Featured Images
- [ ] Upload featured image for a course
- [ ] Image appears in course listing
- [ ] Image appears on course detail page
- [ ] Image is properly sized and cropped
- [ ] Test with different image formats (PNG, JPG, GIF)

## Common Issues & Solutions

### Issue: Payment proofs not uploading

**Solution:**
1. Check Supabase storage bucket exists
2. Verify RLS policies on storage bucket
3. Check file size limits
4. Ensure bucket is public

### Issue: QR code not generating

**Solution:**
1. Verify `/api/generate-qr` endpoint exists
2. Check payment settings have phone number
3. Verify QR library is installed: `npm install qrcode`

### Issue: Certificates not auto-generating

**Solution:**
1. Check trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_certificate';`
2. Verify enrollment has `completed = true` and `completed_at` set
3. Check student has a full_name in profile

### Issue: Quiz won't submit after 2 attempts

**Solution:**
1. Verify `can_attempt_quiz()` function exists
2. Check quiz_attempts table has correct attempt count
3. Clear old test attempts if needed

## Database Schema Reference

### course_payments Table
```sql
id                  UUID PRIMARY KEY
user_id             UUID (student)
course_id           UUID
amount              NUMERIC(10,2)
payment_method      TEXT (momo, bank, card)
payment_proof_url   TEXT
phone_number        TEXT
transaction_reference TEXT
status              TEXT (pending, approved, rejected)
approved_by         UUID (admin)
approved_at         TIMESTAMP
rejection_reason    TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### Updated courses Table
```sql
-- New columns:
featured_image_url  TEXT
price               NUMERIC(10,2) DEFAULT 0
is_free             BOOLEAN DEFAULT true
requires_payment    BOOLEAN DEFAULT false
```

### Updated enrollments Table
```sql
-- New columns:
payment_status      TEXT (not_required, pending, approved, rejected)
payment_id          UUID
can_access          BOOLEAN DEFAULT true
```

### Updated certificates Table
```sql
-- New columns:
student_name        TEXT
course_title        TEXT
completion_date     DATE
certificate_number  TEXT UNIQUE
final_score         NUMERIC(5,2)
```

### Updated quizzes Tables
```sql
-- Both quizzes and course_quizzes:
max_attempts        INTEGER DEFAULT 2
```

## Security Considerations

1. **Payment Verification**: Always verify payment proofs before approval
2. **Quiz Attempts**: Prevent attempt count manipulation
3. **Certificate Forgery**: Use unique certificate numbers and verification
4. **Image Uploads**: Validate file types and sizes
5. **Admin Actions**: Log all payment approvals/rejections

## Future Enhancements

1. **Email Notifications**: Send emails on payment approval/rejection
2. **PDF Certificates**: Generate downloadable PDF certificates
3. **Payment Gateway Integration**: Direct MoMo API integration
4. **Refund System**: Handle payment refunds
5. **Bulk Payment Approval**: Approve multiple payments at once
6. **Certificate Verification Page**: Public page to verify certificate authenticity
7. **Payment Analytics**: Revenue reports and payment statistics

## Support

For issues or questions, check:
- Database logs in Supabase
- Browser console for frontend errors
- Supabase function logs for backend errors
- This documentation file

---

**Last Updated**: December 2024
**Version**: 1.0.0
