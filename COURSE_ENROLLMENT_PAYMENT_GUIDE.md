# Course Enrollment & Payment System Guide

## Overview
This guide explains how the course enrollment and payment system works for both students and administrators.

## For Students

### Free Courses
When enrolling in a **free course**:
1. Click "Enroll Now" button on the course detail page
2. System automatically creates enrollment with:
   - `payment_status: 'not_required'`
   - `can_access: true`
3. Student immediately gets "Start Learning →" button
4. Can access course content right away

### Paid Courses
When enrolling in a **paid course** (price > 0 and requires_payment = true):
1. Click "Enroll Now" button
2. Payment modal opens automatically
3. Student selects payment method:
   - **Mobile Money (MoMo)**: MTN MoMo or Airtel Money
   - **Bank Transfer**: Direct bank deposit

#### Mobile Money Payment:
- QR code displayed for easy scanning
- Shows account name and phone number
- Student enters their phone number
- Optional transaction reference
- Optional payment proof upload

#### Bank Transfer Payment:
- Shows bank details (name, account number)
- Student can upload payment proof
- Optional transaction reference

4. After submitting payment:
   - Enrollment created with `payment_status: 'pending'`
   - `can_access: false`
   - Button shows "Awaiting Payment Approval"
   - Student notified: "Payment submitted successfully! Please wait for admin approval."

5. After admin approval:
   - `payment_status: 'approved'`
   - `can_access: true`
   - Button changes to "Start Learning →"
   - Student can access course content

6. If payment is rejected:
   - `payment_status: 'rejected'`
   - `can_access: false`
   - Shows rejection reason
   - "Submit Payment Again" button appears

## For Administrators

### Accessing Enrollment Management
1. Go to Admin Dashboard (`/dashboard/admin`)
2. Click on "Enrollments & Payments" card
3. Or navigate directly to `/dashboard/admin/enrollments`

### Enrollment Management Page Features

#### Filter Tabs
- **All**: Shows all enrollments (free and paid)
- **Pending**: Shows enrollments awaiting payment approval (with notification badge)
- **Approved**: Shows approved enrollments
- **Rejected**: Shows rejected enrollments

#### Enrollment Table Columns
- **Student**: Name and email
- **Course**: Course title
- **Price**: Course price (or "Free")
- **Payment Status**: Badge showing status
- **Access**: Whether student can access content
- **Date**: Enrollment creation date
- **Actions**: Button to review/view details

### Reviewing Payments

#### For Pending Payments:
1. Click "Review Payment →" button
2. Modal opens showing:
   - **Student Information**: Name and email
   - **Payment Details**:
     - Amount
     - Payment method (MoMo or Bank)
     - Phone number (if MoMo)
     - Transaction reference (if provided)
     - Submission date
   - **Payment Proof**: Image preview with download link
   
3. Admin actions:
   - **Approve Payment** (✓ button):
     - Updates payment status to 'approved'
     - Grants course access (`can_access: true`)
     - Records admin ID and approval timestamp
   - **Reject Payment** (✗ button):
     - Requires rejection reason
     - Updates payment status to 'rejected'
     - Denies course access (`can_access: false`)
     - Student sees reason and can resubmit

#### For Approved/Rejected Payments:
- Click "View Details" to see payment information
- Read-only view of payment details
- Shows approval info or rejection reason

## Database Schema

### Courses Table
```sql
- price: NUMERIC(10,2) DEFAULT 0
- is_free: BOOLEAN DEFAULT true
- requires_payment: BOOLEAN DEFAULT false
```

### Enrollments Table
```sql
- payment_status: TEXT (not_required, pending, approved, rejected)
- payment_id: UUID (references course_payments)
- can_access: BOOLEAN
```

### Course Payments Table
```sql
- user_id: UUID
- course_id: UUID
- amount: NUMERIC(10,2)
- payment_method: TEXT (momo, bank, card)
- payment_proof_url: TEXT
- phone_number: TEXT
- transaction_reference: TEXT
- status: TEXT (pending, approved, rejected)
- approved_by: UUID
- approved_at: TIMESTAMP
- rejection_reason: TEXT
```

## Payment Flow Diagram

```
STUDENT CLICKS "ENROLL NOW"
         |
         v
    Is course paid?
    /           \
   NO           YES
   |             |
   v             v
Direct      Payment Modal
Enrollment   Opens
   |             |
   |         Student submits
   |         payment info
   |             |
   |             v
   |        Enrollment created
   |        (pending payment)
   |             |
   |             v
   |        Admin reviews
   |             |
   |         /       \
   |    APPROVE    REJECT
   |        |         |
   v        v         v
Access   Access    No Access
Granted  Granted   (can retry)
```

## Important Notes

1. **Automatic Triggers**: When payment is approved, a database trigger automatically updates the enrollment
2. **Storage**: Payment proofs are stored in Supabase storage bucket `course-payments`
3. **Unique Constraint**: One payment record per user per course (prevents duplicates)
4. **Security**: Only admins can approve/reject payments
5. **Audit Trail**: Records who approved payment and when

## Configuration

### Setting Up a Paid Course
In the admin course management:
1. Set `price` to amount in RWF
2. Set `is_free` to `false`
3. Set `requires_payment` to `true`

### Payment Settings
Configure in `/dashboard/admin/payment-settings`:
- Mobile Money account details
- Bank account details
- QR code generation settings

## Troubleshooting

### Student Can't Access Paid Course
- Check enrollment `payment_status` is 'approved'
- Check enrollment `can_access` is true
- Verify payment record exists

### Payment Not Showing for Review
- Check enrollment has `payment_id` set
- Verify payment record exists in `course_payments` table
- Check payment status is 'pending'

### QR Code Not Generating
- Verify payment settings configured in admin panel
- Check QR code API route is working (`/api/generate-qr`)

## Next Steps

Consider adding:
- Email notifications to students when payment approved/rejected
- Automatic payment verification (API integration)
- Payment reminders
- Refund system
- Payment history for students
