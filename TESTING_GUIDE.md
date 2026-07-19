# Division A - Complete Testing Guide

## ✅ Pre-Testing Checklist

### 1. Database Connection Test
```bash
# Already passed! ✅
node test-division-a.mjs
```
**Result**: All 6 tests passed ✅

### 2. Create Test Data
Run the SQL script in Supabase:
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy contents from `scripts/create-test-data.sql`
4. Click "Run"

This creates:
- ✅ 5 sample caregivers
- ✅ 4 sample clients
- ✅ 6 sample bookings (pending, confirmed, today's, in-progress, completed)

---

## 🧪 Test Scenarios

### **Scenario 1: Admin Assigns Caregiver to Pending Booking** ⭐ NEW FEATURE

**Goal**: Test the new caregiver assignment UI

**Steps**:
1. Open browser: `http://localhost:3000`
2. Click "Sign In"
3. Login with admin credentials:
   - Email: `admin@platform.com` (or your admin email)
   - Password: your password
4. Should auto-redirect to `/dashboard/admin`
5. Click "Manage Bookings" or go to `/dashboard/admin/bookings`

**Expected Results**:
```
✅ See table with columns:
   - Client
   - Service
   - Date & Time
   - Duration
   - Caregiver (NEW COLUMN!)
   - Status
   - Actions

✅ See 2 pending bookings WITHOUT caregivers:
   - "Personal Care" - shows "Assign Caregiver" button
   - "Medical Care" - shows "Assign Caregiver" button

✅ See 4 bookings WITH caregivers:
   - Shows caregiver name and email in table
```

**Now Test Assignment**:
6. Click "Assign Caregiver" button on first pending booking
7. **Modal should open** showing:
   ```
   Title: "Assign Caregiver"
   Subtitle: "Booking: Personal Care on [date]"
   
   List of 5 caregivers:
   - Jane Smith - jane.smith@caregivers.com - Elderly Care ⭐ 4.8
   - Michael Johnson - mike.j@caregivers.com - Dementia Care ⭐ 4.9
   - Sarah Williams - sarah.w@caregivers.com - Disability Support ⭐ 5.0
   - David Brown - david.b@caregivers.com - Post-Surgery Care ⭐ 4.7
   - Emily Davis - emily.d@caregivers.com - Palliative Care ⭐ 4.9
   
   [Cancel] button at bottom
   ```

8. Click on "Sarah Williams" (5.0 rating)
9. Confirmation dialog appears: "Assign Sarah Williams to this booking?"
10. Click "OK"

**Expected Results**:
```
✅ Success message: "Caregiver assigned successfully!"
✅ Modal closes
✅ Table refreshes
✅ Booking now shows:
   - Caregiver column: "Sarah Williams" / sarah.w@caregivers.com
   - Status: changed from "pending" to "confirmed"
✅ "Reassign" button now available
```

---

### **Scenario 2: Caregiver Views Dashboard** ⭐ NEW FEATURE

**Goal**: Test the new dedicated caregiver dashboard

**Prerequisites**: 
- Run the test data script first (creates caregiver accounts)
- OR create a caregiver user:
  1. Sign up with role "Caregiver"
  2. Admin goes to `/dashboard/admin/caregivers`
  3. Admin clicks "Add Caregiver" and fills details
  4. Link the caregiver record to the user (or have admin assign bookings)

**Steps**:
1. Sign out if logged in
2. Sign in as a caregiver (or create test caregiver account)
3. After login, should **auto-redirect** to `/dashboard/caregiver`

**Expected Results - Dashboard Layout**:
```
✅ Header shows:
   - "Welcome, [Caregiver Name]!"
   - Rating display with star icon
   - Specialization badge (purple)

✅ 4 Statistics Cards:
   Card 1: Today's Bookings (blue) - shows count
   Card 2: Upcoming (purple) - shows count
   Card 3: Total Bookings (green) - shows all-time count
   Card 4: Completed (gray) - shows completed count

✅ Today's Schedule Section (if today's bookings exist):
   - Shows bookings scheduled for today
   - Each booking shows:
     * Large time: "09:00" or "14:00"
     * Status badge (confirmed, in-progress)
     * Service type
     * Duration
     * Client Info Card:
       - Client name
       - Email
       - Phone
       - Address
     * Special notes (yellow box if present)
     * Action button:
       - "Start Service" (if confirmed)
       - "Complete" (if in-progress)

✅ Upcoming Bookings Section:
   - List of future bookings
   - Shows date, time, service, client name
   - Status badges

✅ Recent History Section:
   - Past bookings (completed)
   - Shows service details
```

---

### **Scenario 3: Caregiver Updates Booking Status** ⭐ NEW FEATURE

**Goal**: Test status update workflow

**Steps**:
1. Login as caregiver (from Scenario 2)
2. Should be at `/dashboard/caregiver`
3. Look at "Today's Schedule" section
4. Find a booking with status "confirmed"

**Test: Start Service**
5. Click "Start Service" button
6. **Expected**:
   ```
   ✅ Status badge changes from "confirmed" (blue) to "in-progress" (purple)
   ✅ Button changes from "Start Service" to "Complete"
   ✅ Page updates without full reload
   ```

**Test: Complete Service**
7. Click "Complete" button
8. **Expected**:
   ```
   ✅ Status badge changes to "completed" (green)
   ✅ Button disappears
   ✅ Booking moves to "Recent History" section
   ✅ "Today's Bookings" count decreases by 1
   ✅ "Completed" count increases by 1
   ```

---

### **Scenario 4: Client Books and Tracks Service**

**Goal**: Test existing client workflow still works

**Steps**:
1. Sign out
2. Sign up as new client or login as existing client
3. Go to `/care/booking`
4. Fill out booking form:
   - Service: "Personal Care"
   - Date: Tomorrow
   - Time: "14:00"
   - Duration: 2 hours
   - Notes: "Test booking from client"
5. Click "Book Service"

**Expected Results**:
```
✅ Success message appears
✅ Redirected to `/dashboard`
✅ Booking appears in "Recent Bookings" section
✅ Status shows "pending" (yellow badge)
✅ No caregiver assigned yet
```

**Wait for Admin to Assign**:
6. Admin assigns caregiver (Scenario 1)
7. Client refreshes dashboard

**Expected**:
```
✅ Status changes to "confirmed" (blue badge)
✅ Caregiver information visible (future enhancement)
```

---

### **Scenario 5: Admin Reassigns Caregiver**

**Goal**: Test reassignment functionality

**Steps**:
1. Login as admin
2. Go to `/dashboard/admin/bookings`
3. Find a booking that already has a caregiver
4. Click "Reassign" button next to caregiver name
5. Modal opens showing all caregivers
6. Select a different caregiver
7. Confirm

**Expected Results**:
```
✅ Success message
✅ New caregiver name shows in table
✅ Old caregiver no longer sees this booking
✅ New caregiver sees booking in their dashboard
```

---

### **Scenario 6: Filter Bookings by Status**

**Goal**: Test filtering functionality

**Steps**:
1. Login as admin
2. Go to `/dashboard/admin/bookings`
3. Click filter buttons at top:
   - "All Bookings"
   - "pending"
   - "confirmed"
   - "in-progress"
   - "completed"
   - "cancelled"

**Expected Results**:
```
✅ Clicking "pending" shows only pending bookings
✅ Clicking "confirmed" shows only confirmed bookings
✅ Clicking "All Bookings" shows everything
✅ Table updates without page reload
✅ Active filter button is highlighted (blue)
```

---

### **Scenario 7: Admin Changes Booking Status**

**Goal**: Test manual status updates

**Steps**:
1. Login as admin
2. Go to `/dashboard/admin/bookings`
3. Find any booking
4. Use status dropdown in "Actions" column
5. Select different status
6. Page should update

**Expected Results**:
```
✅ Status badge updates immediately
✅ No page reload
✅ Changes persist (refresh page to verify)
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "No caregivers available"
**Solution**: 
1. Go to `/dashboard/admin/caregivers`
2. Click "Add Caregiver"
3. Add at least one caregiver
4. Or run the test data SQL script

### Issue 2: Caregiver dashboard is empty
**Solution**:
- Caregivers only see bookings assigned to them
- Admin needs to assign bookings first
- Check if caregiver record exists in database

### Issue 3: "Assign Caregiver" button not showing
**Solution**:
- Button only shows for bookings WITHOUT caregivers
- Check if booking already has caregiver_id
- Look for bookings with "pending" status

### Issue 4: Auto-redirect not working for caregiver
**Solution**:
- Check user role in profiles table
- Must be exactly "caregiver" (lowercase)
- Clear browser cache and cookies
- Re-login

### Issue 5: RLS policy error
**Solution**:
- Run the RLS policy scripts:
  - `scripts/add-missing-rls-policies.sql`
  - `scripts/add-caregiver-rls-policies.sql`
- Check Supabase dashboard for policy errors

---

## ✅ Testing Checklist

Mark each test as completed:

### Admin Features
- [ ] Login as admin
- [ ] View all bookings
- [ ] Filter bookings by status
- [ ] See "Assign Caregiver" button on pending bookings
- [ ] Click "Assign Caregiver" button
- [ ] Modal opens with caregiver list
- [ ] Select a caregiver
- [ ] Assignment succeeds
- [ ] Caregiver name appears in table
- [ ] Status changes to "confirmed"
- [ ] Reassign functionality works
- [ ] Manual status update works
- [ ] Add new caregiver works

### Caregiver Features
- [ ] Login as caregiver
- [ ] Auto-redirect to `/dashboard/caregiver`
- [ ] See statistics cards
- [ ] See today's schedule (if bookings exist)
- [ ] See client information
- [ ] See special notes
- [ ] "Start Service" button works
- [ ] Status changes to "in-progress"
- [ ] "Complete" button appears
- [ ] "Complete" button works
- [ ] Status changes to "completed"
- [ ] See upcoming bookings
- [ ] See past bookings

### Client Features
- [ ] Login as client
- [ ] Book a service
- [ ] See booking in dashboard
- [ ] Status shows "pending"
- [ ] After assignment, status shows "confirmed"
- [ ] Can track booking status

### Navigation
- [ ] Navigation shows correct links for each role
- [ ] Admin sees "Admin Panel" link
- [ ] Caregiver sees "Caregiver Dashboard" link
- [ ] Mobile menu works
- [ ] Links work correctly

---

## 📊 Test Results

### Database Tests
```
✅ Connection      PASSED
✅ Bookings        PASSED
✅ Caregivers      PASSED
✅ Clients         PASSED
✅ Assignment      PASSED
✅ RLS Policies    PASSED
```

### UI Tests
- [ ] Admin assignment UI: ___________
- [ ] Caregiver dashboard: ___________
- [ ] Status updates: ___________
- [ ] Filtering: ___________
- [ ] Navigation: ___________

---

##  Notes

**Browser**: _______________________
**Date**: _______________________
**Tester**: _______________________

**Issues Found**:
```
1. 
2. 
3. 
```

**Suggestions**:
```
1. 
2. 
3. 
```

---

## 🎉 Success Criteria

All tests should pass:
- ✅ Admin can assign caregivers through UI
- ✅ Caregivers see dedicated dashboard
- ✅ Caregivers can update booking status
- ✅ Client workflow unaffected
- ✅ Navigation works for all roles
- ✅ Database queries work correctly
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ RLS policies enforce security

---

**Ready to test? Start with Scenario 1!** 🚀
