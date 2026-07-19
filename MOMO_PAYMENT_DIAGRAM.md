# Mobile Money Payment Flow Diagram

## Current Issue
```
❌ NO QR CODE DISPLAYED
❌ NO PHONE NUMBER SHOWN
```

**Why?** → Payment settings not configured in admin panel

---

## Solution: Configure in Admin Settings

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
│                                                             │
│  Go to: /dashboard/admin/payment-settings                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ☑ Enable Mobile Money Payments                       │ │
│  │                                                         │ │
│  │  Provider Name:    [MTN Mobile Money____________]      │ │
│  │                                                         │ │
│  │  Phone Number:     [+250 788 123 456___________]  ⭐   │ │
│  │                                                         │ │
│  │  Account Name:     [iGenoGate Care Services____]       │ │
│  │                                                         │ │
│  │  QR Code:          [Choose File: momo_qr.png___]  ⭐   │ │
│  │                    [Upload your MoMo QR code]           │ │
│  │                                                         │ │
│  │  Instructions:     [________________________]          │ │
│  │                    [________________________]          │ │
│  │                                                         │ │
│  │                    [Save Settings]                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Payment Flow

### Step 1: Customer Books Service
```
┌─────────────────────────────────────────┐
│     BOOKING PAGE (Customer View)        │
│                                         │
│  📅 Select Service Type                 │
│  📅 Choose Date & Time                  │
│  ⏱️  Select Duration (1-8 hours)        │
│  💵 See Estimated Cost                  │
│                                         │
│         [Proceed to Payment]            │
└─────────────────────────────────────────┘
```

### Step 2: Payment Page (After Setup)
```
┌─────────────────────────────────────────┐
│   PAY WITH MTN MOBILE MONEY             │
│                                         │
│   Amount to pay: RWF 32432.00          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      📱 QR CODE IMAGE           │   │  ← Shows after upload
│  │      [Your uploaded QR]         │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Or send payment to:                    │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃  +250 788 123 456              ┃   │  ← Shows after setup
│  ┃  iGenoGate Care Services       ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                         │
│  📸 Upload Payment Proof *              │
│     [Choose File: payment_proof.jpg]    │
│                                         │
│         [Submit Booking]                │
└─────────────────────────────────────────┘
```

### Step 3: Confirmation
```
┌─────────────────────────────────────────┐
│              ✅ SUCCESS!                 │
│                                         │
│   Booking Confirmed!                    │
│                                         │
│   ⏳ Payment Verification Pending       │
│                                         │
│   Your payment proof has been           │
│   submitted. An admin will verify       │
│   it shortly.                           │
│                                         │
│   Redirecting to dashboard...           │
└─────────────────────────────────────────┘
```

---

## How to Get Your MoMo QR Code

### For MTN Mobile Money:
```
1. Open MTN MoMo App
   ↓
2. Tap "Receive Money" or "My QR Code"
   ↓
3. Your QR code will be displayed
   ↓
4. Take a screenshot (Windows: Win + Shift + S)
   ↓
5. Save the image
   ↓
6. Upload in Admin Payment Settings
```

### For Airtel Money / Orange Money:
```
1. Open your mobile money app
   ↓
2. Look for "My QR Code" or "Receive Money"
   ↓
3. Take screenshot of QR code
   ↓
4. Upload in Admin Settings
```

---

## Admin Verification Process

```
┌─────────────────────────────────────────┐
│       ADMIN BOOKINGS PAGE               │
│                                         │
│  📋 New Booking #123                    │
│     Status: Pending                     │
│     Payment: Pending Verification       │
│                                         │
│     [View Payment Proof] ←─ Click       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🖼️ Payment Screenshot          │   │
│  │                                 │   │
│  │  Shows customer's payment       │   │
│  │  confirmation from MoMo app     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Check your MoMo account:               │
│  ✅ Did you receive RWF 32432.00?      │
│  ✅ From this customer?                │
│                                         │
│     [✓ Verify Payment]                 │
│     [✗ Reject Payment]                 │
└─────────────────────────────────────────┘
```

---

## What Gets Stored

### In Database:
```
payment_settings table:
┌────────────────────────────────────┐
│ payment_method: "momo"            │
│ is_active: true                   │
│ settings: {                       │
│   provider: "MTN Mobile Money"    │
│   phone_number: "+250788123456"   │
│   account_name: "iGenoGate"       │
│   qr_code_url: "https://..."      │  ← URL to uploaded QR
│   instructions: "..."             │
│ }                                 │
└────────────────────────────────────┘

bookings table:
┌────────────────────────────────────┐
│ payment_status: "pending_verification" │
│ payment_method: "momo"            │
│ payment_amount: 32432.00          │
│ payment_proof_url: "https://..."  │  ← Customer's screenshot
│ payment_verified_at: null         │
│ payment_verified_by: null         │
└────────────────────────────────────┘
```

---

## Quick Checklist

Before going live:

- [ ] Run `create-payment-system.sql` in Supabase
- [ ] Login as admin
- [ ] Navigate to `/dashboard/admin/payment-settings`
- [ ] Get your MoMo QR code screenshot
- [ ] Upload QR code image
- [ ] Enter phone number (e.g., +250 XXX XXX XXX)
- [ ] Enter account name
- [ ] Enter provider name (e.g., MTN Mobile Money)
- [ ] Add payment instructions
- [ ] Check "Enable Mobile Money payments"
- [ ] Click "Save Settings"
- [ ] Test booking flow as a customer
- [ ] Verify payment proof upload works
- [ ] Practice verifying payments in admin dashboard

---

## File Locations

**Admin Settings Page:**
`app/dashboard/admin/payment-settings/page.tsx`

**Booking Page (Customer):**
`app/care/booking/page.tsx`

**Database Script:**
`scripts/create-payment-system.sql`

**Setup Guide:**
`HOW_TO_SETUP_MOMO_PAYMENTS.md`

---

## Expected Result

### Before Setup:
```
❌ "Or send payment to: [EMPTY]"
❌ No QR code visible
❌ "Scan QR code or send payment to the number above" (but nothing to scan)
```

### After Setup:
```
✅ "Or send payment to: +250 788 123 456"
✅ QR code image displayed prominently
✅ Account name shown
✅ Custom instructions displayed
✅ Upload payment proof button works
```

---

## Security Notes

🔒 **Only admins** can access `/dashboard/admin/payment-settings`
🔒 **Payment proofs** stored securely in Supabase Storage
🔒 **Only the user who uploaded** and **admins** can view payment proofs
🔒 **All payments** must be manually verified by admin before confirmation
🔒 **Audit trail** maintained with timestamps and admin IDs

---

## Support

If QR code or phone number still not showing after setup:

1. ✅ Clear browser cache
2. ✅ Refresh the page (Ctrl + F5)
3. ✅ Check browser console (F12) for errors
4. ✅ Verify settings were saved (check Supabase `payment_settings` table)
5. ✅ Make sure `is_active` is `true`
6. ✅ Restart development server
