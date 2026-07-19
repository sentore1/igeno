# MoMo QR Code + USSD Code Implementation

## Overview
Updated the payment system to use BOTH QR codes with `tel:` links AND visible USSD codes for Rwanda MTN Mobile Money payments.

## Key Features

### 1. QR Code with tel: Link
- **QR Content Format:** `tel:*182*8*1*RECIPIENT*AMOUNT%23`
- **Example:** `tel:*182*8*1*250788123456*1000%23`
- **How it works:** When scanned, automatically opens phone dialer with USSD code ready to dial
- **Note:** `%23` is URL encoding for `#` symbol

### 2. Visible USSD Code
- **Display Format:** `*182*8*1*RECIPIENT*AMOUNT#`
- **Example:** `*182*8*1*250788123456*1000#`
- **Purpose:** Manual fallback for users who prefer typing or can't scan QR

## Changes Made

### 1. QR Code Generator Library
**File:** `lib/qrcode-generator.ts`

**Updated to generate tel: links:**
```typescript
// Old format (wrong):
MOMO:250788123456:32432.00:RWF:BOOK123:iGenoGate

// New format (correct):
tel:*182*8*1*250788123456*32432%23
```

**Key Changes:**
- `formatMoMoQRData()` now generates `tel:` URI
- Removes spaces/dashes from phone number
- Rounds amount to integer (USSD doesn't support decimals)
- URL-encodes `#` as `%23`
- Added `generateMoMoCodeQR()` for MoMo code support

### 2. Admin Payment Settings Page
**File:** `app/dashboard/admin/payment-settings/page.tsx`

**Added Features:**
- **Phone Number** field (optional) - for USSD: `*182*8*1*phone*amount#`
- **MoMo Code** field (optional, NEW) - for USSD: `*182*8*1*code*amount#`
- **QR Code Preview** - Shows generated QR with `tel:` link
- **USSD Code Preview** - Shows text version of codes
- Dual preview showing both scan and manual options

**Updated Logic:**
- Generates QR on phone number OR MoMo code blur
- Shows both payment options if both are configured
- Clear instructions for both methods

### 3. Customer Booking Page
**File:** `app/care/booking/page.tsx`

**Dual Display:**
1. **QR Code Section** (top)
   - Large, scannable QR code
   - "Scan QR Code to Auto-Dial" heading
   - Generated with `tel:` URI

2. **USSD Code Section** (below QR)
   - Orange/yellow gradient box
   - Large mono-spaced font
   - Both phone and MoMo code options (if configured)
   - "Or dial this code manually" heading

**Benefits:**
- Covers all user preferences (scan vs. type)
- Works on smartphones (QR) and basic phones (manual dial)
- Clear, easy-to-follow instructions

### 4. Database & Interfaces
- Added `momo_code?: string` to PaymentSettings interfaces
- No database schema change needed (JSONB already flexible)

## How It Works

### For Customers (Booking Flow):

1. **Complete booking details**
2. **On payment page, they see:**
   - 📱 **Scannable QR Code** at top
     - Encodes: `tel:*182*8*1*250788123456*1000%23`
     - Scanning opens dialer automatically
   
   - 📱 **Manual USSD Codes** below (in orange box)
     - Option 1 (Phone): `*182*8*1*250788123456*1000#`
     - Option 2 (MoMo Code): `*182*8*1*123456*1000#`
     - Clear instructions to dial

3. **Choose payment method:**
   - 🔍 Scan QR → Dialer opens automatically
   - ⌨️ Type code manually → Copy-paste or type

4. **After dialing:**
   - Confirm payment on phone
   - Upload screenshot/proof
   - Admin verifies booking

### For Admins (Setup):

1. **Admin Dashboard → Payment Settings**
2. **Configure provider:** "MTN Mobile Money"
3. **Add payment details:**
   - Phone: `+250 788 123 456` (OR)
   - MoMo Code: `123456` (OR)
   - Both options together
4. **Add account name** and instructions
5. **Preview shows:**
   - Generated QR code
   - USSD code examples
6. **Save settings**

## USSD Code Format

### Standard Format:
```
*182*8*1*RECIPIENT*AMOUNT#
```

### Components:
- `*182*8*1*` - MTN MoMo send money prefix (Rwanda)
- `RECIPIENT` - Phone number (250788123456) OR MoMo code (123456)
- `AMOUNT` - Payment amount in RWF, integer only (1000)
- `#` - USSD terminator

### QR Code tel: URI Format:
```
tel:*182*8*1*RECIPIENT*AMOUNT%23
```
- Same structure as USSD
- `%23` is URL-encoded `#` character
- When scanned, opens phone dialer with code pre-filled

### Examples:

1. **Send 1,000 RWF to phone:**
   - USSD: `*182*8*1*250788123456*1000#`
   - QR Content: `tel:*182*8*1*250788123456*1000%23`

2. **Send 32,432 RWF to MoMo code:**
   - USSD: `*182*8*1*123456*32432#`
   - QR Content: `tel:*182*8*1*123456*32432%23`

## Benefits

✅ **QR Code** - Fast, automatic, no typing errors
✅ **USSD Text** - Manual fallback, works on any phone
✅ **Dual method** - Covers all user scenarios
✅ **Correct format** - Uses `tel:` URI for Rwanda MoMo
✅ **Amount included** - No manual entry needed
✅ **Flexible** - Supports phone numbers AND MoMo codes
✅ **Clear display** - Professional, easy-to-read interface

## Technical Details

### QR Code Generation:
```typescript
// QR encodes tel: link
const qrData = `tel:*182*8*1*${cleanPhone}*${roundedAmount}%23`;

// Examples of what gets encoded:
// tel:*182*8*1*250788123456*1000%23  (phone)
// tel:*182*8*1*123456*1000%23        (MoMo code)
```

### Payment Settings Schema:
```json
{
  "provider": "MTN Mobile Money",
  "phone_number": "+250788123456",
  "momo_code": "123456",
  "account_name": "iGenoGate Platform",
  "instructions": "Scan QR or dial code to pay. Upload proof after payment."
}
```

## Migration Steps

1. **Run SQL script:**
   ```
   scripts/add-momo-code-field.sql
   ```

2. **Update payment settings:**
   - Go to Admin Dashboard → Payment Settings
   - Add MoMo code if available
   - Keep or update phone number
   - Save and check preview

3. **Test both methods:**
   - Create test booking
   - Verify QR code displays
   - Verify USSD code text displays
   - Try scanning QR (should open dialer)
   - Try manual dial

## User Experience

### Smartphone Users:
1. See QR code
2. Open camera/QR scanner
3. Scan → Dialer opens automatically with code
4. Press call to confirm
5. Upload proof

### Basic Phone Users:
1. See USSD code in orange box
2. Manually dial: `*182*8*1*...`
3. Press call
4. Upload proof (or call admin if no smartphone)

### Best User Experience:
- Large, scannable QR at top
- Clear "Or dial manually" section below
- Both methods equally visible
- No confusion about which to use
- Instructions included

## Notes

- QR codes encode `tel:*182*8*1*recipient*amount%23`
- Amounts rounded to integers (MoMo USSD doesn't support decimals)
- Display shows exact amount with decimals for clarity
- Both phone and MoMo code supported simultaneously
- Customers see both options if both configured
- QR generation is dynamic per booking with exact amount
