# Final MoMo Payment Implementation

## Summary
The MoMo payment system now correctly uses `tel:` URI QR codes that auto-dial USSD payment codes. Admin chooses **EITHER** phone number **OR** MoMo code (not both).

## Key Features

### 1. **QR Code Format**
```
tel:*182*8*1*RECIPIENT*AMOUNT#
```
- **RECIPIENT** = MoMo code (preferred) OR phone number
- **AMOUNT** = Payment amount (rounded to integer)
- `#` encoded as `%23` in URL

### 2. **Priority System**
**MoMo Code takes priority over Phone Number:**
- ✅ If MoMo code provided → QR uses MoMo code
- ✅ If no MoMo code → QR uses phone number
- ✅ Only ONE method shown to customer

### 3. **Admin Setup**
Admin configures **ONE** of these:
- **Option 1:** Phone Number (e.g., `+250 788 123 456`)
- **Option 2:** MoMo Code (e.g., `123456`) ⭐ **RECOMMENDED**

If both are configured, **MoMo code takes priority**.

## Complete Flow

### Admin Configuration:
```
1. Go to Payment Settings
2. Choose ONE option:
   - Phone Number: +250 788 123 456
   - MoMo Code: 123456 (RECOMMENDED)
3. Add account name and instructions
4. Save
```

### Customer Payment Experience:
```
1. Customer creates booking
2. Payment page shows:
   ┌─────────────────────────────┐
   │   📱 SCAN QR CODE           │
   │   [QR CODE IMAGE]           │
   │   Encodes: tel:*182*8*1*... │
   └─────────────────────────────┘
   
   ┌─────────────────────────────┐
   │  📱 OR DIAL THIS CODE:      │
   │                             │
   │  *182*8*1*123456*1000#     │
   │                             │
   │  Press dial/call button     │
   └─────────────────────────────┘

3. Customer chooses:
   - SCAN QR → Phone opens dialer automatically
   - TYPE CODE → Manual dial
   
4. Confirm payment on phone
5. Upload proof screenshot
6. Done!
```

## Implementation Details

### QR Code Generator (`lib/qrcode-generator.ts`)
```typescript
// Format tel: URI
function formatMoMoQRData(data: MoMoPaymentData): string {
  const cleanRecipient = data.phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  const roundedAmount = Math.round(data.amount);
  
  // Returns: tel:*182*8*1*RECIPIENT*AMOUNT%23
  return `tel:*182*8*1*${cleanRecipient}*${roundedAmount}%23`;
}
```

### Priority Logic (Both Admin & Customer Pages)
```typescript
// MoMo code takes priority
const recipient = momoSettings.settings.momo_code || momoSettings.settings.phone_number;
```

### Display Logic (Customer Page)
```typescript
// Show ONLY the active method
{momoSettings.settings.momo_code ? (
  <div>MoMo Code: *182*8*1*{momo_code}*{amount}#</div>
) : momoSettings.settings.phone_number ? (
  <div>Phone: *182*8*1*{phone}*{amount}#</div>
) : null}
```

## Examples

### Example 1: Using MoMo Code
**Admin Config:**
- MoMo Code: `123456`
- Phone: (empty or ignored)

**Generated QR:**
```
tel:*182*8*1*123456*5000%23
```

**Customer Sees:**
```
QR Code: [Scannable]
USSD: *182*8*1*123456*5000#
```

**When Scanned:** Phone opens with `*182*8*1*123456*5000#`

---

### Example 2: Using Phone Number
**Admin Config:**
- MoMo Code: (empty)
- Phone: `+250 788 123 456`

**Generated QR:**
```
tel:*182*8*1*250788123456*5000%23
```

**Customer Sees:**
```
QR Code: [Scannable]
USSD: *182*8*1*250788123456*5000#
```

**When Scanned:** Phone opens with `*182*8*1*250788123456*5000#`

---

### Example 3: Both Configured (MoMo Code Wins)
**Admin Config:**
- MoMo Code: `123456` ✅ **USED**
- Phone: `+250 788 123 456` ❌ **IGNORED**

**Generated QR:**
```
tel:*182*8*1*123456*5000%23
```

**Customer Sees:**
```
QR Code: [Scannable]
USSD: *182*8*1*123456*5000#  (MoMo code only)
```

## UI/UX Design

### Admin Payment Settings Page

```
┌──────────────────────────────────────────┐
│ ⚠️ Choose Payment Method                 │
│                                          │
│ Select ONE method below.                 │
│ If both provided, MoMo Code will be used│
│                                          │
│ ┌──────────┐  ┌──────────────────────┐ │
│ │ Option 1 │  │ Option 2 ⭐           │ │
│ │  Phone   │  │  MoMo Code (PREFERRED)│ │
│ └──────────┘  └──────────────────────┘ │
└──────────────────────────────────────────┘

Phone Number (Option 1)
┌────────────────────────────────────┐
│ +250 788 123 456                   │
└────────────────────────────────────┘

MoMo Code (Option 2) [RECOMMENDED]
┌────────────────────────────────────┐
│ 123456                             │
└────────────────────────────────────┘

QR Code will use this if provided

[PREVIEW SECTION]
┌────────────────────────────────────┐
│ [QR CODE]                          │
│ QR encodes: tel:*182*8*1*123456*  │
│             1000#                   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📱 Or dial this code:              │
│                                    │
│  *182*8*1*123456*1000#            │
└────────────────────────────────────┘
```

### Customer Booking Page

```
┌──────────────────────────────────────────┐
│ Pay with MTN Mobile Money                │
│ Amount: RWF 5,000                        │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 📱 Scan QR Code to Auto-Dial       │  │
│ │                                    │  │
│ │       [QR CODE IMAGE]              │  │
│ │                                    │  │
│ │ QR dials: *182*8*1*123456*5000#   │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 📱 Or dial this code manually:     │  │
│ │                                    │  │
│ │  Using MoMo Code:                  │  │
│ │  *182*8*1*123456*5000#            │  │
│ │                                    │  │
│ │  Press dial/call button            │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Payment Details:                         │
│ MoMo Code: 123456                        │
│ iGenoGate Platform                       │
│ Amount: RWF 5,000                        │
└──────────────────────────────────────────┘
```

## Benefits

✅ **Correct Format** - Uses `tel:` URI for auto-dial
✅ **Simple Choice** - Admin picks ONE method
✅ **Clear Priority** - MoMo code preferred over phone
✅ **No Confusion** - Customer sees only ONE option
✅ **Works on All Phones** - QR scan OR manual dial
✅ **Auto-Dial** - QR opens dialer automatically
✅ **Rwanda Standard** - Uses `*182*8*1*...` format

## Testing Checklist

### Admin Side:
- [ ] Configure MoMo code only
- [ ] Preview shows correct QR with MoMo code
- [ ] Configure phone only
- [ ] Preview shows correct QR with phone
- [ ] Configure both
- [ ] Verify MoMo code takes priority in preview

### Customer Side:
- [ ] Create booking with MoMo code configured
- [ ] Scan QR - should open dialer with MoMo code
- [ ] See only ONE USSD option (MoMo code)
- [ ] Create booking with phone configured
- [ ] Scan QR - should open dialer with phone
- [ ] See only ONE USSD option (phone)

### QR Code Testing:
- [ ] Scan with smartphone camera
- [ ] Should prompt to open phone/dialer app
- [ ] Dialer should show: `*182*8*1*RECIPIENT*AMOUNT#`
- [ ] Hash symbol (#) should appear correctly
- [ ] Amount should be rounded integer

## Technical Notes

### URL Encoding:
- `#` → `%23` (required for tel: URI)
- Spaces, dashes, parentheses removed from recipient
- Amount rounded to integer

### Priority Logic:
```javascript
// Everywhere in the code:
const recipient = momo_code || phone_number;
```

### USSD Code Components:
- `*182*` = MTN MoMo service
- `8` = Send Money option
- `1` = Sub-option
- `RECIPIENT` = MoMo code or phone
- `AMOUNT` = Payment amount (integer)
- `#` = Terminator

## Files Modified

1. ✅ `lib/qrcode-generator.ts` - tel: URI generation
2. ✅ `app/dashboard/admin/payment-settings/page.tsx` - Choice UI, priority logic
3. ✅ `app/care/booking/page.tsx` - Single option display
4. ✅ `scripts/add-momo-code-field.sql` - Database support

## Migration

Run SQL script:
```bash
# Execute in Supabase SQL Editor
scripts/add-momo-code-field.sql
```

Then configure admin settings to use MoMo code (recommended) or phone number.

---

**Status:** ✅ Complete and Ready to Use
**Version:** Final
**Date:** 2026-07-19
