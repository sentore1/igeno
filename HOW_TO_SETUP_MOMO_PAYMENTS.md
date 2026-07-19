# How to Setup Mobile Money (MoMo) Payments

## Overview
Your platform already has a complete Mobile Money payment system. You just need to configure it in the Admin Settings.

## Why QR Code and Phone Number Weren't Showing
The payment system was built but **not configured yet**. Once you add your MoMo details in Admin Settings, they will automatically appear on the payment page.

---

## Step-by-Step Setup Guide

### Step 1: Run Database Script (If Not Already Done)
If you haven't created the payment system tables yet, run this SQL script in Supabase:

**Location:** `scripts/create-payment-system.sql`

**To run:**
1. Go to Supabase Dashboard
2. Click on "SQL Editor"
3. Copy and paste the contents of `create-payment-system.sql`
4. Click "Run" or press `Ctrl+Enter`

This creates:
- `payment_settings` table
- Payment-related columns in `bookings` table
- `payment-proofs` storage bucket
- Necessary security policies

---

### Step 2: Access Admin Payment Settings

1. **Login as Admin** to your platform
2. Navigate to: **Dashboard → Admin → Payment Settings**
   - Direct URL: `http://localhost:3000/dashboard/admin/payment-settings`

---

### Step 3: Configure Mobile Money Settings

Fill in the form with your MoMo details:

#### 1. **Enable Mobile Money Payments**
- ✅ Check the box: "Enable Mobile Money payments"

#### 2. **Provider Name**
- Enter your provider name
- Example: `MTN Mobile Money` or `Airtel Money` or `Orange Money`

#### 3. **Phone Number** ⭐ (This is what was missing!)
- Enter your MoMo phone number
- Example: `+250 788 123 456`
- This is where customers will send payments

#### 4. **Account Name**
- Enter your business or personal name
- Example: `iGenoGate Care Services`
- This helps customers verify they're sending to the right account

#### 5. **QR Code Image** ⭐ (This is what was missing!)
- Click "Choose File"
- Upload your MoMo QR code image (PNG, JPG, etc.)
- **How to get your MoMo QR code:**
  - Open your Mobile Money app (MTN, Airtel, Orange)
  - Go to "Receive Money" or "My QR Code"
  - Take a screenshot of your QR code
  - Save it as an image file
  - Upload it here

#### 6. **Payment Instructions**
- Add custom instructions for your customers
- Example:
  ```
  1. Scan the QR code above OR send payment to the phone number
  2. Enter the amount shown
  3. Complete the transaction
  4. Take a screenshot of your payment confirmation
  5. Upload the screenshot below
  ```

#### 7. **Click "Save Settings"**

---

### Step 4: What Customers Will See

After you configure the settings, when customers book a service, they will see:

1. **Service Details Page** - They select service, date, time, duration
2. **Payment Page** - Shows:
   - ✅ Your QR Code (customers can scan with their phone)
   - ✅ Your Phone Number (customers can manually send money)
   - ✅ Account Name (for verification)
   - ✅ Amount to pay
   - ✅ Upload Payment Proof button
   
3. **Confirmation Page** - After upload, shows "Payment Verification Pending"

---

## How the Payment Flow Works

### For Customers:
1. Book a service (choose service type, date, time)
2. See payment page with your QR code and phone number
3. Pay using their MoMo app (scan QR or send to phone)
4. Upload screenshot of payment confirmation
5. Get booking confirmation with "Payment Pending Verification" status

### For Admin:
1. Receive booking notification
2. Check the payment proof screenshot
3. Verify payment in your MoMo account
4. Update booking status to "confirmed" if payment is valid

---

## Preview Feature

The admin payment settings page has a **Preview Section** at the bottom that shows exactly how the payment page will look to customers. This updates in real-time as you fill in the form.

---

## Troubleshooting

### QR Code Not Showing
- ✅ Make sure you uploaded the QR code image
- ✅ Check "Enable Mobile Money payments" is checked
- ✅ Click "Save Settings"
- ✅ Refresh the booking page

### Phone Number Not Showing
- ✅ Make sure you entered the phone number
- ✅ Click "Save Settings"
- ✅ Refresh the booking page

### Payment Settings Page Not Loading
- ✅ Make sure you're logged in as **admin**
- ✅ Make sure the database script (`create-payment-system.sql`) was run
- ✅ Check browser console for errors

---

## Security Features

✅ **Secure Storage** - Payment proofs are stored securely in Supabase Storage
✅ **Privacy** - Only admins and the user who uploaded can see payment proofs
✅ **Verification** - All payments must be manually verified by admin
✅ **Audit Trail** - All payment activities are logged with timestamps

---

## Database Structure

### payment_settings Table
```
- id (UUID)
- payment_method (VARCHAR) - 'momo'
- is_active (BOOLEAN) - Enable/disable MoMo
- settings (JSONB) - Contains:
  - provider (string) - "MTN Mobile Money"
  - qr_code_url (string) - URL to uploaded QR image
  - phone_number (string) - "+250 XXX XXX XXX"
  - account_name (string) - "Your Name"
  - instructions (string) - Payment instructions
```

### bookings Table (Updated)
```
New columns:
- payment_status (VARCHAR) - 'pending', 'pending_verification', 'verified', 'failed'
- payment_method (VARCHAR) - 'momo'
- payment_amount (DECIMAL)
- payment_proof_url (TEXT) - URL to uploaded payment screenshot
- payment_verified_at (TIMESTAMP)
- payment_verified_by (UUID) - Admin who verified
```

---

## Quick Access Links

- **Admin Dashboard:** `/dashboard/admin`
- **Payment Settings:** `/dashboard/admin/payment-settings`
- **Booking Page (Customer View):** `/care/booking`

---

## Need Help?

If you encounter any issues:
1. Check the browser console for errors (F12)
2. Verify the database script was run successfully
3. Make sure your admin account has the 'admin' role
4. Ensure all files are saved and the development server is running

---

## Next Steps

After setting up MoMo payments:
1. ✅ Test the booking flow yourself
2. ✅ Make a test booking with a small amount
3. ✅ Verify the payment proof upload works
4. ✅ Check the admin dashboard to see the booking
5. ✅ Practice verifying payments

---

**Remember:** The QR code and phone number will only show on the customer payment page AFTER you configure them in Admin Settings!
