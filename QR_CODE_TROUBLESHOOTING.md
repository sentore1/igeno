# QR Code Not Showing - Troubleshooting Guide

## ✅ Quick Checklist

### 1. Configure Payment Settings (REQUIRED)

**Go to Admin Dashboard → Payment Settings** (`/dashboard/admin/payment-settings`)

Fill in **Mobile Money Settings**:
- **Account Name**: e.g., "iGenoGate Academy"
- **Phone Number**: e.g., "+250788123456" or "0788123456"
- **Is Active**: ✅ Check this box
- Click **"Save MoMo Settings"**

Without these settings, QR code will NOT generate!

### 2. Check Browser Console

1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for errors related to:
   - `QR generation error`
   - `Failed to generate QR code`
   - `QR code not in response`

### 3. Test QR Code Generation

Open this URL in browser:
```
http://localhost:3000/api/generate-qr
```

Make a POST request with:
```json
{
  "phoneNumber": "+250788123456",
  "amount": 1000
}
```

**Expected response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "paymentData": {...}
}
```

### 4. Verify Payment Modal Behavior

When you click "Enroll Now" on a paid course:

**Should see:**
1. Payment modal opens
2. Mobile Money tab is default
3. Either:
   - ✅ QR Code appears (48x48 image)
   - ⏳ "Generating QR code..." placeholder
   - ⚠️ "Mobile Money Not Configured" warning

**Should NOT see:**
- Empty space where QR code should be
- Broken image icon
- No QR section at all

## 🔧 Common Issues & Fixes

### Issue 1: No QR Code Section at All

**Cause**: Payment settings not configured

**Fix**:
1. Go to `/dashboard/admin/payment-settings`
2. Configure Mobile Money settings
3. Make sure "Is Active" is checked
4. Save settings

### Issue 2: "Generating..." Shows Forever

**Cause**: QR API failing

**Check**:
```bash
# Check if API route exists
ls app/api/generate-qr/route.ts

# Check server logs for errors
# Look in terminal where dev server is running
```

**Fix**:
- Check console for error messages
- Verify phone number format is correct
- Restart dev server

### Issue 3: Broken Image Icon

**Cause**: QR code data URL not valid

**Fix**:
- Check browser console for "Failed to load image" errors
- Verify API is returning valid base64 image data
- Test QR generation API directly

### Issue 4: Payment Modal Doesn't Open

**Cause**: Course not configured as paid

**Fix**:
1. Go to Admin → Course Management
2. Edit the course
3. Set:
   - `price` > 0 (e.g., 10000)
   - `is_free` = false
   - `requires_payment` = true
4. Save course

## 📝 Test Flow

### Step-by-Step Test:

1. **Configure Settings**
   ```
   Admin Dashboard → Payment Settings
   - Account Name: "Test Academy"
   - Phone: "+250788123456"
   - Is Active: ✅
   - Save
   ```

2. **Create Paid Course**
   ```
   Admin Dashboard → Courses → Edit Course
   - Price: 10000
   - Is Free: false
   - Requires Payment: true
   - Save
   ```

3. **Test Enrollment**
   ```
   - Go to course detail page
   - Click "Enroll Now"
   - Should see payment modal
   - Mobile Money tab active
   - QR Code should appear within 2-3 seconds
   ```

4. **Verify QR Code**
   ```
   - QR code is 48x48 pixels
   - Has white padding around it
   - Shows "Scan with your MoMo app" below
   - Account name and phone number displayed
   - Payment instructions visible
   ```

## 🐛 Debug Mode

Add this to `CoursePaymentModal.tsx` after `loadPaymentSettings()`:

```typescript
useEffect(() => {
  console.log('Payment Modal Debug:', {
    momoSettings,
    qrCodeUrl,
    coursePrice,
    paymentMethod
  });
}, [momoSettings, qrCodeUrl, coursePrice, paymentMethod]);
```

This will log payment settings and QR status to console.

## 📸 Expected Result

When working correctly, you should see:

```
┌─────────────────────────────────┐
│  Mobile Money Payment           │
├─────────────────────────────────┤
│  Scan QR Code to Pay            │
│  ┌───────────────────────┐     │
│  │                       │     │
│  │    [QR CODE IMAGE]    │     │
│  │                       │     │
│  └───────────────────────┘     │
│  Scan with your MoMo app        │
├─────────────────────────────────┤
│  Account Name: iGenoGate        │
│  Phone: +250788123456           │
│  Amount: 10,000 RWF             │
├─────────────────────────────────┤
│  Instructions:                  │
│  1. Dial *182#...               │
│  2. Select "Send Money"...      │
│  ...                            │
└─────────────────────────────────┘
```

## 🆘 Still Not Working?

1. Check all settings are saved
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache
4. Restart dev server
5. Check console for any errors
6. Verify `qrcode` package is installed: `npm list qrcode`

## ✅ Payment Proof Upload

The payment proof upload is **already working**! It's below the transaction reference field:

```
Payment Proof (Optional but Recommended)
[Choose File] No file chosen

Upload a screenshot or photo of your payment confirmation

✓ File selected: screenshot.png  (shows after selection)
```

Users can upload:
- Images (PNG, JPG, etc.)
- PDF files
- Maximum recommended size: 5MB

Files are stored in Supabase Storage bucket: `course-payments`
