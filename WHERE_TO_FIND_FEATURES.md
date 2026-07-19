# 📍 Where to Find Everything - Admin Features

## 🎯 Quick Navigation Guide

### From Admin Dashboard

**Step 1: Login as Admin**
```
1. Go to: http://localhost:3000
2. Click "Sign In"
3. Login with admin account
4. You'll see "Admin Panel" button in header
```

**Step 2: Access Admin Dashboard**
```
Click "Admin Panel" button (top right)
OR
Navigate to: http://localhost:3000/dashboard/admin
```

**Step 3: Choose Your Task**

---

## 🏥 Service Types Management

### Location
```
Admin Dashboard → Service Types (card with 🏥 icon)
```

### Direct URL
```
http://localhost:3000/dashboard/admin/services
```

### What You Can Do
- ➕ Add new service types
- ✏️ Edit existing services
- 🗑️ Delete services
- 👁️ View service details
- ⚡ Enable/Disable services
- 💰 Set pricing per hour
- 🔢 Change display order

### Visual Location
```
┌─────────────────────────────────┐
│      Admin Dashboard            │
├─────────────────────────────────┤
│ [User Management] [Bookings]    │
│ [Courses] [Caregivers]          │
│ [Reports]                       │
│                                 │
│ 🏥 Service Types       [NEW]    │  ← HERE!
│ Manage booking service types    │
│                                 │
│ 📱 Payment Settings    [NEW]    │
│ Configure Mobile Money          │
└─────────────────────────────────┘
```

---

## 📱 Payment Settings (MoMo)

### Location
```
Admin Dashboard → Payment Settings (card with 📱 icon)
```

### Direct URL
```
http://localhost:3000/dashboard/admin/payment-settings
```

### What You Can Do
- 📤 Upload QR code image
- 📞 Set phone number
- 👤 Configure account name
- 📝 Write payment instructions
- ✅ Enable/Disable MoMo payments
- 👀 Preview customer view

### Visual Location
```
┌─────────────────────────────────┐
│      Admin Dashboard            │
├─────────────────────────────────┤
│ [User Management] [Bookings]    │
│ [Courses] [Caregivers]          │
│ [Reports]                       │
│                                 │
│ 🏥 Service Types       [NEW]    │
│ Manage booking service types    │
│                                 │
│ 📱 Payment Settings    [NEW]    │  ← HERE!
│ Configure Mobile Money          │
└─────────────────────────────────┘
```

---

## 👥 User Management

### Location
```
Admin Dashboard → User Management
```

### Direct URL
```
http://localhost:3000/dashboard/admin/users
```

### What You Can Do
- ➕ Add new users
- 👁️ View user details
- ✏️ Edit user information
- 🗑️ Delete users
- 🔍 Search users
- 🔀 Filter by role

---

## 📅 Bookings Management

### Location
```
Admin Dashboard → Booking Management
```

### Direct URL
```
http://localhost:3000/dashboard/admin/bookings
```

### What You Can Do
- 📋 View all bookings
- ✅ Verify payments
- 👁️ View payment proofs
- 📊 Check booking status
- 📧 Contact customers

---

## 🎓 Course Management

### Location
```
Admin Dashboard → Course Management
```

### Direct URL
```
http://localhost:3000/dashboard/admin/courses
```

### What You Can Do
- ➕ Create courses
- ✏️ Edit courses
- 📚 Add lessons
- 📝 Create quizzes
- 🎯 Manage enrollments

---

## 🔄 Complete Admin Navigation Map

```
localhost:3000
    │
    └─ /auth/signin → Login
           ↓
    /dashboard → User Dashboard
           ↓
    Click "Admin Panel" button
           ↓
    /dashboard/admin → Admin Dashboard
           │
           ├─ /users → User Management
           │
           ├─ /bookings → Booking Management
           │
           ├─ /courses → Course Management
           │
           ├─ /caregivers → Caregiver Management
           │
           ├─ /reports → Reports & Analytics
           │
           ├─ /services → 🏥 Service Types [NEW]
           │      │
           │      ├─ Add Service
           │      ├─ Edit Service
           │      ├─ Delete Service
           │      └─ Toggle Active/Inactive
           │
           ├─ /payment-settings → 📱 Payment Settings [NEW]
           │      │
           │      ├─ Upload QR Code
           │      ├─ Set Phone Number
           │      ├─ Configure Account
           │      └─ Enable/Disable
           │
           └─ /settings → System Settings
```

---

## 🎯 Quick Actions

### I Want To Add a New Service Type
```
1. Admin Dashboard
2. Click "Service Types" card (🏥)
3. Click "+ Add Service Type" button
4. Fill form:
   - Choose icon
   - Enter name
   - Add description
   - Set price
   - Check "Active"
5. Click "Create Service"
✅ Done! Service appears in booking form
```

### I Want To Setup Mobile Money
```
1. Admin Dashboard
2. Click "Payment Settings" card (📱)
3. Upload QR code image
4. Enter phone number
5. Enter account name
6. Write instructions
7. Check "Enable Mobile Money"
8. Click "Save Settings"
✅ Done! Customers can now pay via MoMo
```

### I Want To Add a New User
```
1. Admin Dashboard
2. Click "User Management" card
3. Click "+ Add User" button
4. Fill form (name, email, role)
5. Click "Create User"
✅ Done! User receives email
```

---

## 📱 Mobile Access

Same URLs work on mobile:
- Just use your phone browser
- Navigate to localhost (if on same network)
- Or use your deployed URL

---

## 🔍 Can't Find Something?

### Check URL Bar
Current page shown in URL:
- `/dashboard/admin` = Admin Dashboard (main)
- `/dashboard/admin/services` = Service Types
- `/dashboard/admin/payment-settings` = Payment Settings

### Check Page Title
Top of page shows where you are:
- "Admin Dashboard" = Main page
- "Service Types Management" = Services page
- "Payment Settings" = Payment page

### Look for Icons
- 🏥 = Service Types
- 📱 = Payment Settings
- 👥 = Users
- 📅 = Bookings
- 🎓 = Courses

---

## 🎨 Visual Guide

### Admin Dashboard Layout
```
┌────────────────────────────────────────┐
│ ← Back to Dashboard    Admin Dashboard │
├────────────────────────────────────────┤
│                                        │
│ [👥 100]  [📅 50]  [🎓 20]  [✅ 200]   │
│  Users    Bookings  Courses Enrollments│
│                                        │
├────────────────────────────────────────┤
│                                        │
│ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ │👥 User   │ │📅 Booking│ │🎓 Course││
│ │Management│ │Management│ │Managemt ││
│ └──────────┘ └──────────┘ └─────────┘│
│                                        │
│ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ │💖 Caregiv│ │📊 Reports│ │🏥 Service││ ← NEW
│ │Management│ │Analytics │ │Types NEW││
│ └──────────┘ └──────────┘ └─────────┘│
│                                        │
│ ┌──────────┐ ┌──────────┐            │
│ │📱 Payment│ │⚙️ System │            │
│ │Settings  │ │Settings  │            │
│ │[NEW]     │ │          │            │
│ └──────────┘ └──────────┘            │
└────────────────────────────────────────┘
```

### Service Types Page
```
┌────────────────────────────────────────┐
│ Service Types Management [+ Add Service]│
├────────────────────────────────────────┤
│                                        │
│ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ │🧼        │ │⚕️        │ │💬       ││
│ │Personal  │ │Medical   │ │Companio││
│ │Care      │ │Care      │ │Care     ││
│ │$35/hour  │ │$55/hour  │ │$25/hour ││
│ │[V][E][D] │ │[V][E][D] │ │[V][E][D]││
│ └──────────┘ └──────────┘ └─────────┘│
└────────────────────────────────────────┘

[V] = View  [E] = Edit  [D] = Delete
```

### Payment Settings Page
```
┌────────────────────────────────────────┐
│ Payment Settings         [Back to Admin]│
├────────────────────────────────────────┤
│                                        │
│ 📱 Mobile Money (MoMo)                 │
│                                        │
│ ☑ Enable Mobile Money payments         │
│                                        │
│ Provider: [MTN Mobile Money        ]   │
│ Phone:    [+250 XXX XXX XXX       ]   │
│ Account:  [Business Name          ]   │
│                                        │
│ QR Code:  [Upload Image] 📤           │
│           ┌───────────┐               │
│           │ QR Image  │               │
│           │ Preview   │               │
│           └───────────┘               │
│                                        │
│ Instructions:                          │
│ [Scan QR code to pay...           ]   │
│                                        │
│ [Save Settings]                        │
└────────────────────────────────────────┘
```

---

## 💡 Pro Tips

### Bookmark These URLs
```
http://localhost:3000/dashboard/admin
http://localhost:3000/dashboard/admin/services
http://localhost:3000/dashboard/admin/payment-settings
http://localhost:3000/dashboard/admin/users
```

### Keyboard Shortcuts
- `Ctrl + Click` = Open in new tab
- `Alt + ←` = Go back
- `F5` = Refresh page

### Quick Test
After setup:
1. Add a service
2. Configure MoMo
3. Logout
4. Login as customer
5. Try booking
6. Should see your services!
7. Should see payment page!

---

**Last Updated:** July 19, 2026
**Status:** ✅ All Features Live
