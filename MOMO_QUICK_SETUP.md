# 🚀 MoMo Payment - Quick Setup (5 Minutes)

## Step 1: Database Setup (1 minute)
```sql
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste content from: scripts/create-payment-system.sql
4. Click RUN
5. ✅ See "Payment system created successfully!"
```

## Step 2: Configure MoMo (2 minutes)
```
1. Login as Admin
2. Go to: /dashboard/admin/payment-settings
3. Fill form:
   ✓ Provider: MTN Mobile Money
   ✓ Phone: +250 XXX XXX XXX
   ✓ Account Name: Your Business
   ✓ Upload QR Code image
   ✓ Check "Enable" box
4. Click SAVE
```

## Step 3: Add Services (2 minutes)
```
1. Go to: /dashboard/admin/services
2. Click "+ Add Service Type"
3. Add service:
   Icon: 🧼
   Name: Personal Care
   Description: Daily assistance
   Price: 35
   Active: ✓
4. Click "Create Service"
5. Repeat for 2-3 more services
```

## Step 4: Test (1 minute)
```
1. Logout and login as customer
2. Go to: /care/booking
3. See your services with icons ✓
4. Select one → See price calculate
5. Click "Proceed to Payment"
6. See MoMo QR code ✓
7. Upload test image
8. Submit booking ✓
```

## ✅ Done!

Your system now has:
- ✅ Dynamic service types
- ✅ Mobile money payments
- ✅ QR code display
- ✅ Payment proof upload
- ✅ Admin verification workflow

---

## 🎯 What Customers See

### Booking Page
```
┌─────────────────────────────────┐
│ Book a Care Service             │
├─────────────────────────────────┤
│ Select Service:                 │
│                                 │
│ ┌─────────┐  ┌─────────┐      │
│ │🧼 Personal│  │⚕️ Medical│      │
│ │Care     │  │Care     │      │
│ │$35/hour │  │$55/hour │      │
│ └─────────┘  └─────────┘      │
│                                 │
│ Date: [________]  Time: [____] │
│ Duration: [2 hours ▼]          │
│                                 │
│ 💰 Total: $70.00               │
│                                 │
│ [Proceed to Payment]           │
└─────────────────────────────────┘
```

### Payment Page
```
┌─────────────────────────────────┐
│ Pay with MTN Mobile Money       │
├─────────────────────────────────┤
│ Amount: $70.00                  │
│                                 │
│ Scan QR Code:                   │
│   ┌───────────┐                │
│   │  █▀▀█▀█  │                │
│   │  █  ▀ █  │  QR CODE       │
│   │  █▀▀▀▀█  │                │
│   └───────────┘                │
│                                 │
│ Or send to: +250 XXX XXX XXX   │
│ Name: Business Name             │
│                                 │
│ Upload Payment Proof: [Choose] │
│                                 │
│ [Back]  [Submit Booking]       │
└─────────────────────────────────┘
```

---

## 🔧 Quick Troubleshooting

### ❌ Services not showing?
→ Check service is "Active"

### ❌ Payment page not appearing?
→ Enable MoMo in payment settings

### ❌ QR code not displaying?
→ Re-upload image, check file size

### ❌ Can't upload payment proof?
→ Check storage bucket created

---

## 📞 Need Help?

See detailed guide: `ADMIN_SERVICES_AND_PAYMENTS_GUIDE.md`
