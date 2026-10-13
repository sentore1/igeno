# Dual User Flow System: Client vs Caregiver

## Overview
The system now intelligently distinguishes between two primary user flows based on where they start their journey:

1. **Care Service Booking** → Creates **CLIENT** accounts
2. **Course Enrollment** → Creates **CAREGIVER** accounts (with admin approval)

## User Flows

### Flow 1: Care Service Booking (Client)

**Starting Point:** User clicks "Book a Service" from Care page

```
1. User on Landing Page → "Care Services" → "Book a Service"
2. System redirects to: /auth/signin?intent=client
3. Sign-in page shows: "Please sign in or create an account to book care services"
4. User clicks "create a new account" → /auth/signup?intent=client
5. Sign-up page:
   - Shows: "Creating a Client account for care services" (green badge)
   - Auto-selects "Client" role (user can change if needed)
6. After registration:
   - Success: "Client account created! You can now book care services"
   - User is redirected to dashboard
7. User can now book care services without restrictions
```

**Key Points:**
- ✅ No approval needed
- ✅ Immediate access to booking services
- ✅ User identified as CLIENT in the system

### Flow 2: Course Enrollment (Caregiver)

**Starting Point:** User clicks "Enroll Now" on a course

```
1. User on Landing Page → "Academy" → Course Detail → "Enroll Now"
2. System redirects to: /auth/signin?intent=caregiver
3. Sign-in page shows: "Please sign in or create a caregiver account to enroll in courses"
4. User clicks "create a new account" → /auth/signup?intent=caregiver
5. Sign-up page:
   - Shows: "Creating a Caregiver account - Requires admin approval" (blue badge)
   - Auto-selects "Caregiver" role (user can change if needed)
6. After registration:
   - Success: "Caregiver account created! Your account needs admin approval before you can enroll in courses"
   - User is redirected to dashboard
7. User sees approval pending banner
8. Admin approves the caregiver account
9. User can now enroll in courses
```

**Key Points:**
- ⏱ Requires admin approval
- 🔒 Cannot enroll in courses until approved
- ✅ User identified as CAREGIVER in the system

## Technical Implementation

### URL Parameters

| Parameter | Value | Purpose | Redirects To |
|-----------|-------|---------|--------------|
| `?intent=client` | client | User wants to book care services | Sign-up with "Client" pre-selected |
| `?intent=caregiver` | caregiver | User wants to enroll in courses | Sign-up with "Caregiver" pre-selected |

### Database Fields

#### Profiles Table
```sql
- role: 'client' | 'caregiver' | ... (other roles)
- is_approved: boolean (false for caregivers by default)
- approved_by: UUID (admin who approved)
- approved_at: timestamp
- rejection_reason: text
```

### Entry Points

#### 1. Care Service Booking
**Files:**
- `/app/care/page.tsx` - Care services landing page
- `/app/care/booking/page.tsx` - Booking form

**Redirect Logic:**
```typescript
// In booking page checkAuth()
if (!session) {
  router.push('/auth/signin?intent=client');
  return;
}
```

#### 2. Course Enrollment
**Files:**
- `/app/academy/courses/[id]/page.tsx` - Course detail page
- `/app/academy/courses/[id]/learn/page.tsx` - Learning page

**Redirect Logic:**
```typescript
// When user tries to enroll without auth
if (!user) {
  router.push('/auth/signin?intent=caregiver');
  return;
}

// When caregiver tries to enroll without approval
if (profile?.role === 'caregiver' && !profile.is_approved) {
  alert('Your caregiver account is pending admin approval...');
  return;
}
```

### Sign-in Page Logic

**File:** `/app/auth/signin/page.tsx`

```typescript
useEffect(() => {
  const intentParam = searchParams.get('intent');
  
  if (intentParam === 'caregiver') {
    setSuccess('Please sign in or create a caregiver account to enroll in courses.');
  } else if (intentParam === 'client') {
    setSuccess('Please sign in or create an account to book care services.');
  }
}, [searchParams]);
```

**Create Account Link:**
```typescript
<Link 
  href={
    searchParams.get('intent') === 'caregiver' 
      ? '/auth/signup?intent=caregiver' 
      : searchParams.get('intent') === 'client'
      ? '/auth/signup?intent=client'
      : '/auth/signup'
  }
>
  create a new account
</Link>
```

### Sign-up Page Logic

**File:** `/app/auth/signup/page.tsx`

```typescript
// Auto-select role based on intent
useEffect(() => {
  const intentParam = searchParams.get('intent');
  if (intentParam === 'caregiver') {
    setRole('caregiver');
  } else if (intentParam === 'client') {
    setRole('client');
  }
}, [searchParams]);
```

**Visual Indicators:**
```typescript
{role === 'caregiver' && (
  <p className="text-blue-600 font-medium">
    Creating a Caregiver account - Requires admin approval
  </p>
)}
{role === 'client' && (
  <p className="text-green-600 font-medium">
    Creating a Client account for care services
  </p>
)}
```

**Success Messages:**
```typescript
if (role === 'caregiver') {
  setSuccess('Caregiver account created! Your account needs admin approval...');
} else if (role === 'client') {
  setSuccess('Client account created! You can now book care services...');
} else {
  setSuccess('Account created successfully!');
}
```

## User Experience Matrix

| User Action | Role Created | Approval Required | Can Book Services | Can Enroll Courses |
|-------------|--------------|-------------------|-------------------|--------------------|
| Books care service | Client | ❌ No | ✅ Yes | ✅ Yes (if approved) |
| Enrolls in course | Caregiver | ✅ Yes | ✅ Yes | ⏱ After approval |
| Signs up directly | Any | Caregiver only | ✅ Yes | Depends on role |

## Admin Actions

### Approving Caregivers

1. Navigate to: **Dashboard → Admin → User Management**
2. Filter by "caregiver" role
3. Find caregivers with "⏱ Pending" status
4. Click "✓ Approve" button
5. Caregiver can now:
   - Enroll in courses
   - Access academy features
   - Book care services

### Rejecting Caregivers

1. Click "✗ Reject" button next to caregiver
2. Enter rejection reason
3. Caregiver sees red banner with reason
4. Can re-approve later if needed

## Testing Scenarios

### Test 1: Care Service Booking Flow
1. Go to homepage
2. Click "Care Services" → "Book a Service"
3. Verify redirect to: `/auth/signin?intent=client`
4. Click "create a new account"
5. Verify "Client" is pre-selected
6. Complete registration
7. Verify immediate access to booking

### Test 2: Course Enrollment Flow
1. Go to homepage
2. Click "Academy" → Select any course → "Enroll Now"
3. Verify redirect to: `/auth/signin?intent=caregiver`
4. Click "create a new account"
5. Verify "Caregiver" is pre-selected
6. Complete registration
7. Verify approval pending message
8. Try to enroll → Blocked with approval message
9. Login as admin and approve
10. Verify caregiver can now enroll

### Test 3: Direct Sign-up (No Intent)
1. Go to `/auth/signup` directly
2. Verify no role is pre-selected
3. User can choose any role
4. If "Caregiver" → approval required
5. If other role → immediate access

## Files Modified

### Created
- `DUAL_USER_FLOW_SYSTEM.md` - This documentation

### Modified
- `app/care/booking/page.tsx` - Added `?intent=client` to auth redirect
- `app/auth/signin/page.tsx` - Handle both client and caregiver intents
- `app/auth/signup/page.tsx` - Auto-select role and show appropriate messages
- `app/academy/courses/[id]/page.tsx` - Added `?intent=caregiver` to auth redirect
- `app/academy/courses/[id]/learn/page.tsx` - Added `?intent=caregiver` to auth redirect

## Benefits

1. **Clear User Journey**: Users are automatically guided to the right account type
2. **Better UX**: Pre-selected roles reduce confusion
3. **Security**: Caregivers must be vetted before accessing courses
4. **Flexibility**: Users can still change their role during signup if needed
5. **Contextual Messaging**: Different messages based on user intent

## Future Enhancements

- Email notifications when caregiver is approved
- Role-specific onboarding flows
- Dashboard customization based on role
- Analytics tracking for conversion by intent
- A/B testing for signup flows
