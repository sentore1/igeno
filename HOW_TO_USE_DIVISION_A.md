# Division A - Care Management System: How to Use Guide

## 🚀 Quick Start Guide

### **For Clients (People Needing Care)**

#### 1️⃣ Register
```
1. Go to platform homepage
2. Click "Sign Up"
3. Fill in:
   - Full Name
   - Email
   - Password
   - Select Role: "Client (Care Services)"
4. Click "Sign Up"
5. You'll be redirected to your dashboard
```

#### 2️⃣ Book Care Service
```
1. From dashboard, click "Book Service"
   OR go to /care/booking
2. Fill in the form:
   - Service Type (Personal Care, Medical Care, etc.)
   - Date (select from calendar)
   - Time (select time)
   - Duration (1-8 hours)
   - Special Notes (optional but recommended)
3. Click "Book Service"
4. You'll see confirmation message
5. Booking appears in your dashboard with "pending" status
```

#### 3️⃣ Track Your Booking
```
1. Go to /dashboard
2. See "Recent Bookings" section
3. Your booking shows:
   - Service type
   - Date and time
   - Duration
   - Status badge (pending → confirmed → in-progress → completed)
4. Wait for admin to assign a caregiver
5. Status will change to "confirmed" when caregiver is assigned
```

---

### **For Admins (System Managers)**

#### 1️⃣ Login
```
1. Go to /auth/signin
2. Login with admin credentials
3. You'll be redirected to /dashboard/admin
```

#### 2️⃣ Manage Caregivers
```
1. From admin dashboard, click "Manage Caregivers"
   OR go to /dashboard/admin/caregivers
2. View all caregivers
3. To add new caregiver:
   - Click "Add Caregiver" button
   - Fill in:
     * Full Name
     * Email
     * Phone
     * Specialization (optional)
   - Click "Add Caregiver"
4. New caregiver appears in the list
```

#### 3️⃣ Assign Caregiver to Booking (NEW! ✨)
```
1. From admin dashboard, click "Manage Bookings"
   OR go to /dashboard/admin/bookings
2. See list of all bookings
3. Filter by status if needed (all, pending, confirmed, etc.)
4. For bookings WITHOUT caregiver:
   - Look for "Assign Caregiver" button
   - Click the button
   
5. Assignment Modal Opens:
   - Shows all available caregivers
   - Each caregiver shows:
     * Name
     * Email
     * Specialization
     * Rating (with star icon)
   
6. Click on a caregiver
7. Confirm assignment
8. System automatically:
   - Assigns caregiver to booking
   - Updates status to "confirmed"
   - Caregiver can now see this booking

9. To Reassign:
   - Click "Reassign" button next to assigned caregiver
   - Follow same process
```

#### 4️⃣ Monitor Bookings
```
1. View all bookings in the table
2. See assigned caregivers
3. Update status via dropdown if needed
4. Filter by status to focus on pending/active bookings
```

#### 5️⃣ View Reports
```
1. From admin dashboard, click "Reports & Analytics"
   OR go to /dashboard/admin/reports
2. See key metrics:
   - Total bookings
   - Pending bookings
   - Completion rate
   - Revenue (if payment system is active)
3. View statistics by:
   - Users (caregivers, clients)
   - Bookings (total, pending, completed)
   - Platform health
```

---

### **For Caregivers (Service Providers)**

#### 1️⃣ Register
```
1. Go to platform homepage
2. Click "Sign Up"
3. Fill in:
   - Full Name
   - Email
   - Password
   - Select Role: "Caregiver"
4. Click "Sign Up"
5. Admin needs to create your caregiver profile
   (Contact admin to complete setup)
```

#### 2️⃣ Access Your Dashboard (NEW! ✨)
```
1. Go to /auth/signin
2. Login with your credentials
3. System automatically redirects to /dashboard/caregiver
4. You see your dedicated caregiver dashboard
```

#### 3️⃣ View Today's Schedule (NEW! ✨)
```
In your dashboard, you'll see:

📊 Statistics Cards at the top:
   - Today's Bookings (count)
   - Upcoming Bookings (count)
   - Total Bookings (all time)
   - Completed Bookings (success count)

⏰ Today's Schedule Section:
   Each booking shows:
   - Large time display (e.g., "14:00")
   - Status badge (pending, confirmed, in-progress, completed)
   - Service type
   - Duration
   
   📋 Client Information Card:
   - Client name
   - Email
   - Phone number
   - Address (if provided)
   
   ⚠️ Special Requirements (if any):
   - Highlighted in yellow box
   - Important notes from client
   
   🔘 Action Buttons:
   - "Start Service" (when confirmed)
   - "Complete" (when in-progress)
```

#### 4️⃣ Update Booking Status (NEW! ✨)
```
When you arrive at client's location:
1. Find the booking in "Today's Schedule"
2. Status shows "confirmed"
3. Click "Start Service" button
4. Status updates to "in-progress"

When you finish the service:
1. Same booking, now showing "in-progress"
2. Click "Complete" button
3. Status updates to "completed"
4. Booking moves to history
```

#### 5️⃣ View Upcoming Bookings (NEW! ✨)
```
In the "Upcoming Bookings" section:
- See all future bookings assigned to you
- Shows: date, time, service type, client name
- Plan your schedule
- Status badges for each booking
```

#### 6️⃣ View Work History (NEW! ✨)
```
In the "Recent History" section:
- See your last 10 completed bookings
- Reference past work
- Track your service history
```

---

## 🔄 Complete Workflow Example

### **Scenario: Client Books a Personal Care Service**

#### **Step 1: Client Books** ✅
```
- Client: Sarah Johnson
- Service: Personal Care
- Date: July 25, 2026
- Time: 14:00
- Duration: 2 hours
- Notes: "Needs assistance with mobility. Prefer female caregiver."

Result:
✅ Booking created
✅ Status: "pending"
✅ caregiver_id: NULL (not assigned yet)
✅ Client sees booking in her dashboard
```

#### **Step 2: Admin Assigns Caregiver** ✅
```
Admin (John) logs in:
1. Goes to /dashboard/admin/bookings
2. Sees Sarah's booking (pending, no caregiver)
3. Clicks "Assign Caregiver" button
4. Modal opens showing:
   - Jane Smith (Rating: 4.8, Specialization: Elderly Care)
   - Mike Johnson (Rating: 4.5, Specialization: Disability Support)
   - Lisa Brown (Rating: 5.0, Specialization: Personal Care) ⭐
5. Admin selects Lisa Brown
6. Confirms assignment

Result:
✅ caregiver_id: Lisa's ID
✅ Status: "confirmed"
✅ Lisa can now see this booking
✅ Client sees status change to "confirmed"
```

#### **Step 3: Caregiver Sees Assignment** ✅
```
Lisa Brown logs in:
1. Auto-redirected to /dashboard/caregiver
2. Sees her dashboard with:
   
   Statistics:
   - Today's Bookings: 1
   - Upcoming: 3
   - Total: 45
   - Completed: 42
   
   Today's Schedule shows:
   📅 July 25, 2026
   ⏰ 14:00
   📋 Personal Care
   ⏱️ Duration: 120 minutes
   
   Client Info:
   👤 Sarah Johnson
   📧 sarah.j@email.com
   📞 +1 (555) 123-4567
   📍 123 Main St, City
   
   Special Notes:
   ⚠️ "Needs assistance with mobility. Prefer female caregiver."
   
   🔘 [Start Service] button ready
```

#### **Step 4: Service Day** ✅
```
Lisa arrives at 14:00:
1. Opens her dashboard
2. Finds Sarah's booking
3. Clicks "Start Service"
4. Status updates to "in-progress"
5. Provides care for 2 hours
6. At 16:00, clicks "Complete"
7. Status updates to "completed"

Result:
✅ Service completed
✅ Booking moves to history
✅ Client sees "completed" status
✅ Admin sees completion in reports
```

---

## 📱 Access URLs

### **Public Pages**:
- Homepage: `/`
- Sign Up: `/auth/signup`
- Sign In: `/auth/signin`
- Care Services: `/care`
- Academy: `/academy`

### **Client Pages**:
- Dashboard: `/dashboard`
- Book Service: `/care/booking`
- Profile: `/profile`

### **Admin Pages**:
- Admin Dashboard: `/dashboard/admin`
- Manage Bookings: `/dashboard/admin/bookings` ⭐
- Manage Caregivers: `/dashboard/admin/caregivers`
- Manage Users: `/dashboard/admin/users`
- Manage Courses: `/dashboard/admin/courses`
- Reports & Analytics: `/dashboard/admin/reports`
- Settings: `/dashboard/admin/settings`

### **Caregiver Pages** (NEW! ✨):
- Caregiver Dashboard: `/dashboard/caregiver` ⭐

---

## 🎨 Status Badge Colors

| Status | Color | Meaning |
|--------|-------|---------|
| **pending** | 🟡 Yellow | Waiting for caregiver assignment |
| **confirmed** | 🔵 Blue | Caregiver assigned, awaiting service day |
| **in-progress** | 🟣 Purple | Service is currently being provided |
| **completed** | 🟢 Green | Service successfully completed |
| **cancelled** | 🔴 Red | Booking was cancelled |

---

##  Tips & Best Practices

### **For Clients**:
- ✅ Add detailed notes when booking (helps caregivers prepare)
- ✅ Book in advance (better caregiver availability)
- ✅ Check your dashboard regularly for updates
- ✅ Provide accurate contact information

### **For Admins**:
- ✅ Assign caregivers quickly (within 24 hours)
- ✅ Match caregiver specialization to service type
- ✅ Check caregiver ratings before assigning
- ✅ Monitor pending bookings daily
- ✅ Review completion rates regularly

### **For Caregivers**:
- ✅ Check dashboard every morning
- ✅ Read client notes carefully
- ✅ Update status promptly (Start/Complete)
- ✅ Arrive on time
- ✅ Contact client if running late
- ✅ Review tomorrow's schedule before end of day

---

## ❓ Common Questions

### **Q: What happens after I book a service?**
A: Your booking is created with "pending" status. An admin will review and assign an appropriate caregiver within 24 hours. Once assigned, status changes to "confirmed" and you'll see the caregiver details.

### **Q: Can I cancel a booking?**
A: Yes, contact admin to cancel. (Future: self-service cancellation will be added)

### **Q: How do I know which caregiver is assigned?**
A: Once assigned, the caregiver information will be visible in your booking details. (Future: this will show in client dashboard)

### **Q: What if I need to reschedule?**
A: Contact admin to reschedule. (Future: self-service rescheduling will be added)

### **Q: Can caregivers see my contact information?**
A: Yes, once assigned, caregivers can see your name, email, phone, and address to provide the service.

### **Q: How do I become a caregiver?**
A: Register with "Caregiver" role, then contact admin to complete your caregiver profile with specializations and details.

---

## 🆘 Troubleshooting

### **Issue: I booked but don't see it in dashboard**
- Refresh the page
- Check if you're logged in
- Verify you selected the correct service type

### **Issue: Booking stuck in "pending" for too long**
- Contact admin
- Admin may not have assigned a caregiver yet

### **Issue: Caregiver dashboard not showing**
- Verify your role is "caregiver"
- Admin needs to create your caregiver profile
- Contact admin to complete setup

### **Issue: Can't assign caregiver (Admin)**
- Verify caregivers exist in the system
- Add caregivers first at /dashboard/admin/caregivers
- Check if booking is already assigned

---

## 📞 Support

For technical issues or questions:
- Contact system administrator
- Email: admin@platform.com (update this)
- Check documentation in `/DIVISION_A_FIX_COMPLETE.md`

---

**Last Updated**: Today
**Version**: 2.0 (with caregiver dashboard and assignment features)
