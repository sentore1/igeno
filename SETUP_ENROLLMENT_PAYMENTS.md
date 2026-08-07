# Setup Guide: Course Enrollment & Payment System

## Quick Setup Steps

### Step 1: Run SQL Scripts (in order)

Open Supabase SQL Editor and run these scripts:

1. **`scripts/add-course-payment-and-features.sql`** (if not already run)
   - Creates `course_payments` table
   - Adds payment columns to `enrollments`
   - Adds price columns to `courses`
   - Sets up triggers for payment approval

2. **`scripts/fix-enrollments-timestamps.sql`** ⭐ **RUN THIS FIRST**
   - Adds `created_at` and `updated_at` columns to enrollments
   - Creates auto-update trigger for `updated_at`
   - Backfills existing records with timestamps

3. **`scripts/add-enrollment-payment-rls.sql`** ⭐ **RUN THIS SECOND**
   - Sets up RLS policies for enrollments
   - Sets up RLS policies for course_payments
   - Allows admins to view/manage all enrollments
   - Allows users to view/manage their own enrollments

### Step 2: Configure Payment Settings

1. Go to Admin Dashboard → Payment Settings
2. Configure Mobile Money (MoMo) details:
   - Account name
   - Phone number
3. Configure Bank Transfer details:
   - Bank name
   - Account name
   - Account number

### Step 3: Create a Paid Course (for testing)

1. Go to Admin Dashboard → Course Management
2. Create or edit a course
3. Set these fields:
   - **Price**: e.g., 10000 (RWF)
   - **Is Free**: `false`
   - **Requires Payment**: `true`

### Step 4: Test the Flow

#### As a Student:
1. Browse to the paid course detail page
2. Click "Enroll Now"
3. Payment modal should open
4. Fill in payment details and submit
5. Should see "Awaiting Payment Approval" message

#### As an Admin:
1. Go to Admin Dashboard → Enrollments & Payments
2. You should see the pending enrollment
3. Click "Review Payment →"
4. View payment details and proof
5. Approve or reject the payment
6. Student should now see "Start Learning" button (if approved)

## Troubleshooting

### Error: "column enrollments.created_at does not exist"

**Cause**: The enrollments table is missing timestamp columns

**Solution**:
```sql
-- Run this in Supabase SQL Editor
\i scripts/fix-enrollments-timestamps.sql
```

Or add the columns manually:
```sql
ALTER TABLE public.enrollments 
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.enrollments 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### Error: "Failed to load enrollments"

**Cause**: RLS policies not set up correctly

**Solution**:
```sql
-- Run this in Supabase SQL Editor
\i scripts/add-enrollment-payment-rls.sql
```

Or copy and paste the content of `scripts/add-enrollment-payment-rls.sql` directly into the SQL Editor.

### Error: "Permission denied for table enrollments"

**Cause**: Your user doesn't have admin role

**Solution**:
```sql
-- Check your role
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';

-- If role is not 'admin', update it:
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### Error: "Cannot read properties of null"

**Cause**: Foreign key relationships not properly set up or data is missing

**Solution**: Verify the foreign keys exist:
```sql
-- Check enrollments foreign keys
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table
FROM pg_constraint
WHERE contype = 'f' 
AND conrelid = 'enrollments'::regclass;

-- Should show:
-- enrollments_user_id_fkey → profiles
-- enrollments_course_id_fkey → courses
-- enrollments_payment_id_fkey → course_payments
```

### Payment Modal Not Opening

**Cause**: Course payment fields not set correctly

**Solution**:
```sql
-- Check course settings
SELECT id, title, price, is_free, requires_payment 
FROM courses 
WHERE id = 'YOUR_COURSE_ID';

-- For paid courses, should have:
UPDATE courses 
SET price = 10000, is_free = false, requires_payment = true
WHERE id = 'YOUR_COURSE_ID';
```

### Storage Error: "Payment proof upload failed"

**Cause**: Storage bucket not created or RLS not configured

**Solution**:
```sql
-- Run storage setup script
\i scripts/create-storage-buckets-step-by-step.sql
```

Or create bucket manually:
1. Go to Supabase Storage
2. Create bucket: `course-payments`
3. Set public: `true`
4. Add RLS policy to allow authenticated users to upload

## Database Schema Reference

### Courses Table
```sql
price: NUMERIC(10,2) DEFAULT 0
is_free: BOOLEAN DEFAULT true
requires_payment: BOOLEAN DEFAULT false
```

### Enrollments Table
```sql
payment_status: TEXT DEFAULT 'not_required'
  CHECK (payment_status IN ('not_required', 'pending', 'approved', 'rejected'))
payment_id: UUID REFERENCES course_payments(id)
can_access: BOOLEAN DEFAULT true
```

### Course Payments Table
```sql
id: UUID PRIMARY KEY
user_id: UUID REFERENCES profiles(id)
course_id: UUID REFERENCES courses(id)
amount: NUMERIC(10,2) NOT NULL
payment_method: TEXT CHECK (payment_method IN ('momo', 'bank', 'card'))
payment_proof_url: TEXT
phone_number: TEXT
transaction_reference: TEXT
status: TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
approved_by: UUID REFERENCES profiles(id)
approved_at: TIMESTAMP WITH TIME ZONE
rejection_reason: TEXT
```

## File Changes Summary

### Modified Files:
1. `app/academy/courses/[id]/page.tsx` - Added payment check and modal
2. `components/CoursePaymentModal.tsx` - Updated to create enrollment
3. `app/dashboard/admin/page.tsx` - Added enrollments card
4. `components/RichTextEditor.tsx` - Fixed styled-jsx issue

### New Files:
1. `app/dashboard/admin/enrollments/page.tsx` - Admin enrollment management
2. `scripts/add-enrollment-payment-rls.sql` - RLS policies
3. `COURSE_ENROLLMENT_PAYMENT_GUIDE.md` - User guide
4. `SETUP_ENROLLMENT_PAYMENTS.md` - This setup guide

## Testing Checklist

- [ ] SQL scripts executed successfully
- [ ] Payment settings configured
- [ ] Test paid course created
- [ ] Student can see payment modal for paid courses
- [ ] Student can see direct enrollment for free courses
- [ ] Admin can view enrollments page
- [ ] Admin can see pending payments
- [ ] Admin can approve payments
- [ ] Admin can reject payments with reason
- [ ] Student gets access after approval
- [ ] Payment proof uploads to storage

## Next Steps

Consider implementing:
- [ ] Email notifications on payment approval/rejection
- [ ] Payment reminder system
- [ ] Automatic payment verification (API integration)
- [ ] Refund functionality
- [ ] Payment history page for students
- [ ] Export enrollment reports
- [ ] Bulk payment approval
- [ ] Payment analytics dashboard

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify RLS policies are correct
4. Ensure user has admin role
5. Check foreign key relationships
6. Review this guide's troubleshooting section
