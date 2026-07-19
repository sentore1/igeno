# Admin Services & Payment System Guide

## Overview
Complete guide for managing service types and mobile money (MoMo) payment settings.

---

## 🎯 Part 1: Service Types Management

### What Is It?
Admins can now dynamically add, edit, and delete service types that appear in the booking form instead of hardcoded options.

### Access
**Admin Panel → Service Types Management**
Or navigate to: `/dashboard/admin/services`

### Features

#### 1. **View All Services**
- Grid view with service cards
- Shows: Icon, name, description, price, status
- Active/Inactive badge
- Quick actions on each card

#### 2. **Add New Service**
- Click **"+ Add Service Type"** button
- Fill in details:
  - **Icon**: Choose from emoji library
  - **Service Name**: e.g., "Physical Therapy"
  - **Description**: Brief explanation
  - **Price per Hour**: Optional pricing
  - **Display Order**: Controls sort order
  - **Active Status**: Enable/disable immediately

#### 3. **Edit Service**
- Click **"Edit"** on any service card
- Modify any field
- Changes reflect immediately in booking form

#### 4. **Delete Service**
- Click trash icon (🗑️) on service card
- Confirms before deletion
- Permanent action

#### 5. **Toggle Active/Inactive**
- Click **"Disable"**/**"Enable"** button
- Inactive services hidden from customers
- Can be reactivated anytime

### Example Services

```
🧼 Personal Care
Description: Assistance with daily activities
Price: $35/hour

⚕️ Medical Care  
Description: Professional medical assistance
Price: $55/hour

🚗 Transportation
Description: Transport to appointments
Price: $28/hour
```

---

## 💳 Part 2: Mobile Money (MoMo) Payment System

### What Is It?
Customers can pay for services via mobile money by:
1. Scanning QR code
2. Sending to phone number
3. Uploading payment proof
4. Admin verifies payment

### Setup Process

#### Step 1: Run SQL Script
1. Open Supabase Dashboard → SQL Editor
2. Copy content from `scripts/create-payment-system.sql`
3. Click **Run**
4. Verifies:
   - `payment_settings` table created
   - `bookings` table updated with payment columns
   - `payment-proofs` storage bucket created
   - RLS policies applied

#### Step 2: Configure MoMo Settings
1. Go to **Admin Panel → Payment Settings**
2. Fill in form:

```
Provider Name: MTN Mobile Money
Phone Number: +250 XXX XXX XXX
Account Name: Your Business Name
QR Code: Upload image file
Instructions: Custom instructions for customers
Enable: Check the box to activate
```

3. Click **Save Settings**

#### Step 3: Test
1. Go to booking page as customer
2. Select service
3. Should see payment step
4. Verify QR code displays
5. Test upload payment proof

---

## 🔄 Complete Booking Flow (With Payment)

### Customer Experience

**Step 1: Service Details**
```
1. Customer visits /care/booking
2. Sees available services (from service_types table)
3. Clicks on service card to select
4. Sees price calculation in real-time
5. Fills in date, time, duration
6. Clicks "Proceed to Payment"
```

**Step 2: Payment**
```
1. Sees MoMo payment screen
2. Views:
   - QR code image
   - Phone number
   - Account name
   - Total amount
3. Opens mobile money app
4. Scans QR code OR sends to number
5. Takes screenshot of confirmation
6. Uploads proof image
7. Clicks "Submit Booking"
```

**Step 3: Confirmation**
```
1. Booking created with status: "pending"
2. Payment status: "pending_verification"
3. Success message shown
4. Redirects to dashboard
```

### Admin Experience

**Verify Payments**
```
1. Go to Admin Panel → Bookings
2. See bookings with "pending_verification"
3. Click "View" on booking
4. See payment proof image
5. Verify it's legitimate
6. Click "Verify Payment"
7. Booking status → "confirmed"
8. Customer notified
```

---

## 📊 Database Schema

### service_types Table
```sql
id                UUID PRIMARY KEY
name              VARCHAR(255) UNIQUE
description       TEXT
icon              VARCHAR(100)
price_per_hour    DECIMAL(10, 2)
is_active         BOOLEAN
display_order     INTEGER
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### payment_settings Table
```sql
id                UUID PRIMARY KEY
payment_method    VARCHAR(50)
is_active         BOOLEAN
settings          JSONB
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### bookings Table (New Columns)
```sql
payment_status         VARCHAR(20)
payment_method         VARCHAR(50)
payment_amount         DECIMAL(10, 2)
payment_proof_url      TEXT
payment_verified_at    TIMESTAMP
payment_verified_by    UUID
```

---

## 🎨 Customization

### Add More Icons
Edit: `app/dashboard/admin/services/page.tsx`

```typescript
const iconOptions = [
  '🏥', '⚕️', '🧼', '💬', '🏡', 
  '🧹', '🚗', '💊', '🩺', '❤️',
  // Add more emojis here
];
```

### Change Payment Providers
Supports multiple payment methods:
- MoMo (Mobile Money)
- Card payments (add later)
- Bank transfer (add later)
- Cash (add later)

### Pricing Models
- **Hourly**: Set price_per_hour
- **Flat Rate**: Use fixed duration
- **Free**: Leave price empty
- **Custom**: Calculate in booking logic

---

## 🔐 Security Features

### Payment Proof Storage
- Stored in private bucket
- Users can only see their own
- Admins can see all
- Encrypted at rest

### RLS Policies
```sql
-- Users upload their own proofs
bucket_id = 'payment-proofs' AND
auth.uid()::text = (storage.foldername(name))[1]

-- Admins can view all
role = 'admin'
```

### Payment Verification
- Two-step verification
- Admin must manually verify
- Prevents fraud
- Audit trail maintained

---

## 📝 Admin Workflows

### Daily Operations

**Morning Checklist**
1. Check pending payment verifications
2. Review new service bookings
3. Verify payment proofs
4. Confirm legitimate bookings

**Add New Service**
1. Research market price
2. Create service with description
3. Set competitive price
4. Enable and test
5. Monitor bookings

**Update Pricing**
1. Review service performance
2. Adjust prices as needed
3. Click Edit → Change price
4. Save and notify customers

**Disable Unavailable Service**
1. Click service card
2. Click "Disable"
3. Service hidden from customers
4. Can re-enable anytime

---

## 📱 Mobile Money Providers

### Supported (Examples)
- MTN Mobile Money
- Orange Money
- Airtel Money
- M-Pesa
- Any QR-code based system

### Setup Requirements
1. Business MoMo account
2. QR code from provider
3. Registered phone number
4. Business verification

---

## 🚀 Quick Start Guide

### For Admins (First Time Setup)

**5-Minute Setup:**

1. **Run SQL script** (1 min)
   - Supabase → SQL Editor
   - Paste `create-payment-system.sql`
   - Run

2. **Configure MoMo** (2 min)
   - Admin → Payment Settings
   - Fill form
   - Upload QR code
   - Save

3. **Add Services** (2 min)
   - Admin → Service Types
   - Click "+ Add Service Type"
   - Add 3-4 services
   - Save each

4. **Test Booking** (1 min)
   - Open booking page
   - Select service
   - See payment flow
   - ✅ Done!

---

## 🎯 Best Practices

### Service Management
- ✅ Keep descriptions clear and concise
- ✅ Use appropriate icons
- ✅ Set competitive prices
- ✅ Review and update regularly
- ✅ Disable unavailable services
- ❌ Don't delete services with bookings

### Payment Settings
- ✅ Test QR code works before enabling
- ✅ Verify phone number is correct
- ✅ Clear instructions for customers
- ✅ Quick payment verification (<24h)
- ❌ Don't change settings during active bookings

### Security
- ✅ Verify all payment proofs manually
- ✅ Check amounts match
- ✅ Look for edited screenshots
- ✅ Keep payment settings private
- ❌ Don't share admin access

---

## 🐛 Troubleshooting

### Services Not Showing
**Problem**: Services not appearing in booking form
**Solution**:
1. Check service is Active
2. Verify RLS policies applied
3. Refresh booking page
4. Check browser console for errors

### Payment QR Code Not Displaying
**Problem**: QR code image not showing
**Solution**:
1. Verify file uploaded successfully
2. Check storage bucket is public for QR codes
3. Try re-uploading image
4. Check image URL in settings

### Payment Proof Upload Fails
**Problem**: Customer can't upload proof
**Solution**:
1. Check storage bucket exists
2. Verify RLS policies correct
3. Check file size (<5MB recommended)
4. Try different image format

### Price Not Calculating
**Problem**: Price shows $0 or incorrect
**Solution**:
1. Verify service has price_per_hour set
2. Check duration is selected
3. Refresh page
4. Clear browser cache

---

## 📚 Related Files

### Admin Pages
- `app/dashboard/admin/services/page.tsx` - Service management
- `app/dashboard/admin/payment-settings/page.tsx` - Payment settings

### Customer Pages
- `app/care/booking/page.tsx` - Booking with payment

### SQL Scripts
- `scripts/create-service-types-table.sql` - Service types setup
- `scripts/create-payment-system.sql` - Payment system setup

### Documentation
- `ADMIN_SERVICES_AND_PAYMENTS_GUIDE.md` - This file
- `MOMO_PAYMENT_FLOW.md` - Detailed payment flow

---

## ✅ Features Checklist

### Service Types
- [x] Dynamic service creation
- [x] Edit existing services
- [x] Delete services
- [x] Toggle active/inactive
- [x] Icon selection
- [x] Price per hour
- [x] Display order
- [x] Real-time booking integration

### Payment System
- [x] MoMo configuration
- [x] QR code upload
- [x] Phone number setup
- [x] Payment proof upload
- [x] Admin verification workflow
- [x] Payment status tracking
- [x] Storage with RLS
- [x] Multi-step booking flow

---

**Last Updated:** July 19, 2026
**Version:** 1.0
**Status:** ✅ Production Ready
