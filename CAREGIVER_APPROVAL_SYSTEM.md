# Caregiver Approval System

## Overview
This system ensures that all caregivers must be approved by an administrator before they can enroll in courses and access academy features.

## Setup Instructions

### 1. Run the SQL Migration
Execute the following SQL script in your Supabase SQL Editor:

```bash
scripts/add-caregiver-approval.sql
```

This script will:
- Add `is_approved`, `approved_by`, `approved_at`, and `rejection_reason` columns to the `profiles` table
- Auto-approve all existing non-caregiver users
- Create a trigger to auto-approve non-caregivers on signup
- Create helper function `is_user_approved()`

### 2. Verify Database Changes
After running the script, verify the columns were added:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name IN ('is_approved', 'approved_by', 'approved_at', 'rejection_reason');
```

## User Flow

### For Caregivers

1. **Sign Up**
   - User visits course page and clicks "Enroll Now"
   - System redirects to `/auth/signin?intent=caregiver`
   - User clicks "create a new account"
   - Sign up page opens with "Caregiver" role pre-selected
   - User completes registration form

2. **After Registration**
   - Caregiver account is created with `is_approved = false`
   - Success message shows: "Caregiver account created! Note: Your account needs admin approval before you can enroll in courses."
   - User is redirected to dashboard

3. **Pending Approval**
   - Caregiver sees a yellow banner: "Account Pending Approval"
   - When trying to enroll in courses, system shows: "Your caregiver account is pending admin approval. You will be notified once approved."
   - Caregiver cannot enroll in any courses until approved

4. **After Approval**
   - Admin approves the account
   - Caregiver can now enroll in courses and access all academy features
   - Banner disappears

5. **If Rejected**
   - Caregiver sees a red banner with rejection reason
   - Cannot enroll in courses
   - Message prompts to contact support

### For Administrators

1. **View Pending Caregivers**
   - Navigate to: Dashboard → Admin → User Management
   - Filter by "caregiver" role
   - Pending caregivers show yellow "⏱ Pending" status badge

2. **Approve a Caregiver**
   - Click "✓ Approve" button next to the caregiver
   - Confirm approval
   - Status changes to "✓ Approved" (green)
   - Caregiver can now enroll in courses

3. **Reject a Caregiver**
   - Click "✗ Reject" button next to the caregiver
   - Enter rejection reason in the prompt
   - Status changes to "✗ Rejected" (red)
   - Rejection reason is saved and shown to the caregiver

4. **Re-approve Rejected Caregiver**
   - Rejected caregivers can be approved later
   - Click "✓ Approve" button
   - Rejection reason is cleared
   - Status changes to "✓ Approved"

## Technical Details

### Database Schema

```sql
-- Profiles table additions
ALTER TABLE public.profiles
  ADD COLUMN is_approved BOOLEAN DEFAULT false,
  ADD COLUMN approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN rejection_reason TEXT;
```

### Auto-Approval Logic

- **Caregivers**: `is_approved = false` by default
- **All other roles**: `is_approved = true` automatically (via trigger)

### Enrollment Check

Before allowing enrollment, the system checks:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_approved')
  .eq('id', user.id)
  .single();

if (profile?.role === 'caregiver' && !profile.is_approved) {
  // Block enrollment
}
```

## Files Modified/Created

### Created
- `scripts/add-caregiver-approval.sql` - Database migration
- `components/CaregiverApprovalBanner.tsx` - UI banner for caregivers
- `CAREGIVER_APPROVAL_SYSTEM.md` - This documentation

### Modified
- `app/auth/signup/page.tsx` - Added caregiver context detection and approval messaging
- `app/auth/signin/page.tsx` - Added caregiver intent parameter handling
- `app/academy/courses/[id]/page.tsx` - Added approval check before enrollment
- `app/academy/courses/[id]/learn/page.tsx` - Added caregiver redirect with intent
- `app/dashboard/admin/users/page.tsx` - Added approval/rejection UI and functions
- `lib/types.ts` - Added approval fields to User interface

## Usage Example

### Add Banner to Dashboard
To show the approval status banner to caregivers, add this to your dashboard layout:

```tsx
import CaregiverApprovalBanner from '@/components/CaregiverApprovalBanner';

export default function DashboardLayout({ children }) {
  return (
    <div>
      <CaregiverApprovalBanner />
      {children}
    </div>
  );
}
```

## Testing

### Test Caregiver Flow
1. Sign up as a new caregiver
2. Verify you see approval pending message
3. Try to enroll in a course - should be blocked
4. Login as admin
5. Approve the caregiver
6. Login as caregiver again
7. Verify you can now enroll in courses

### Test Rejection Flow
1. As admin, reject a caregiver with a reason
2. Login as that caregiver
3. Verify rejection message shows with reason
4. As admin, re-approve the caregiver
5. Verify caregiver can now access courses

## Security Notes

- Only admins can approve/reject caregivers
- Approval status is checked server-side during enrollment
- Non-caregiver roles are auto-approved to not disrupt existing workflows
- Row Level Security (RLS) policies should restrict direct updates to approval fields

## Future Enhancements

- Email notifications when caregiver is approved/rejected
- Bulk approval interface for admins
- Approval workflow with multiple review stages
- Caregiver application form with additional verification documents
- Automated approval based on criteria
