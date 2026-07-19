# QR Code Format for MoMo Payments - Quick Reference

## What Gets Encoded in the QR Code

### Format:
```
tel:*182*8*1*RECIPIENT*AMOUNT%23
```

### Example:
```
tel:*182*8*1*250788123456*1000%23
```

## How It Works

### Step 1: User Scans QR Code
```
[QR Code Image]
  ↓ scan with camera
```

### Step 2: Phone Opens Dialer Automatically
```
Phone Dialer Opens With:
*182*8*1*250788123456*1000#
```

### Step 3: User Presses Call Button
```
MTN MoMo USSD Menu Opens
User confirms payment
Done! ✅
```

## Why `tel:` Link?

The `tel:` URI scheme is a standard web protocol that tells the phone to:
1. Open the phone dialer app
2. Pre-fill the number/code
3. Wait for user to press "Call"

### Standard tel: link examples:
- `tel:+250788123456` → Calls phone number
- `tel:*182*8*1*250788123456*1000%23` → Dials USSD code

## Why `%23` Instead of `#`?

In URLs/URIs, `#` has special meaning (fragment identifier), so we **URL-encode** it:
- `#` → `%23`

When the phone dialer opens, it automatically decodes `%23` back to `#`:
- QR contains: `tel:*182*8*1*250788123456*1000%23`
- Dialer shows: `*182*8*1*250788123456*1000#`

## Complete Flow Diagram

```
┌─────────────────────────────────────┐
│  Admin Configures Payment Settings  │
│  - Phone: +250 788 123 456          │
│  - Or MoMo Code: 123456             │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Customer Creates Booking           │
│  - Selects service                  │
│  - Amount calculated: RWF 1,000     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  System Generates QR Code           │
│  Content: tel:*182*8*1*...          │
│  - Recipient: 250788123456          │
│  - Amount: 1000                     │
│  - Encoded: %23 for #               │
└────────────────┬────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────────┐      ┌──────────────────┐
│ Scan QR     │  OR  │ Manual Dial      │
│ Auto-dials  │      │ Type USSD code   │
└──────┬──────┘      └────────┬─────────┘
       │                      │
       └──────────┬───────────┘
                  ▼
         ┌─────────────────┐
         │  Phone Dialer   │
         │  *182*8*1*...   │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Press Call     │
         │  Confirm Pay    │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Upload Proof   │
         │  Admin Verifies │
         │  Booking Done ✅ │
         └─────────────────┘
```

## Code Breakdown

### Phone Number Payment:
```
tel:*182*8*1*250788123456*1000%23
│   │   │ │ │             │    │
│   │   │ │ │             │    └─ URL-encoded #
│   │   │ │ │             └────── Amount (1000 RWF)
│   │   │ │ └──────────────────── Recipient phone
│   │   │ └────────────────────── Sub-option (1)
│   │   └──────────────────────── Option (8 = Send Money)
│   └──────────────────────────── Service (182 = MTN MoMo)
└──────────────────────────────── Protocol (tel: = Phone)
```

### MoMo Code Payment:
```
tel:*182*8*1*123456*1000%23
│   │   │ │ │      │    │
│   │   │ │ │      │    └─ URL-encoded #
│   │   │ │ │      └────── Amount (1000 RWF)
│   │   │ │ └───────────── MoMo code (6 digits)
│   │   │ └─────────────── Sub-option (1)
│   │   └───────────────── Option (8 = Send Money)
│   └───────────────────── Service (182 = MTN MoMo)
└───────────────────────── Protocol (tel: = Phone)
```

## Browser/Device Behavior

### On Smartphone:
1. Camera app or QR scanner reads the QR
2. Detects `tel:` URI
3. Shows prompt: "Open Phone with *182*8*1*...?"
4. User taps "Open"
5. Phone app opens with code pre-filled
6. User presses "Call"

### On Feature Phone:
- Cannot scan QR
- User sees manual USSD code displayed
- Types: `*182*8*1*250788123456*1000#`
- Presses "Call"

## Testing

### Test the QR Code:
1. Generate QR with: `tel:*182*8*1*250788123456*1000%23`
2. Open on phone camera
3. Scan QR code
4. Should see prompt to open dialer
5. Dialer should show: `*182*8*1*250788123456*1000#`
6. ✅ Success!

### Test Manual USSD:
1. See displayed code: `*182*8*1*250788123456*1000#`
2. Type on phone keypad
3. Press call
4. MTN MoMo menu should open
5. ✅ Success!

## Common Issues

### ❌ QR doesn't open dialer
- **Cause:** Missing `tel:` prefix
- **Fix:** Ensure QR encodes `tel:*182*...`

### ❌ Shows `#` in QR but doesn't dial
- **Cause:** Using `#` instead of `%23`
- **Fix:** URL-encode as `%23`

### ❌ Dialer opens but no code
- **Cause:** tel: format wrong
- **Fix:** Must be `tel:DIALCODE` (no spaces)

### ❌ Amount has decimals in dialer
- **Cause:** Not rounding amount
- **Fix:** `Math.round(amount)` before encoding

## Resources

- [RFC 3966 - tel URI Scheme](https://tools.ietf.org/html/rfc3966)
- [URL Encoding Reference](https://www.w3schools.com/tags/ref_urlencode.asp)
- MTN Mobile Money Rwanda USSD Codes

## Summary

✅ Use `tel:` URI scheme for QR codes
✅ Format: `tel:*182*8*1*RECIPIENT*AMOUNT%23`
✅ URL-encode `#` as `%23`
✅ Round amount to integer
✅ Clean recipient (remove spaces/dashes)
✅ Test on actual device
✅ Provide manual fallback (text USSD code)
