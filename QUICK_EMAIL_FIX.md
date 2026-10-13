# Quick Email Fix - Action Items

## ✅ What I Fixed in Your Code

1. **Updated domain from localhost to login.igenogate.com**
   - Changed `.env.local` file
   - All email confirmation links now use your production domain

2. **Added Forgot Password Feature**
   - New page: `/auth/forgot-password`
   - New page: `/auth/reset-password`
   - Added "Forgot your password?" link on sign-in page

3. **Fixed all redirect URLs**
   - Sign up confirmation → login.igenogate.com
   - Password reset → login.igenogate.com
   - Email callback → login.igenogate.com

---

## 🚨 YOU NEED TO DO (Required!)

### 1. Configure Supabase (Most Important!)

Go to: https://app.supabase.com → Your Project

#### A. Update Site URL
**Navigation:** Authentication → URL Configuration

```
Site URL: https://login.igenogate.com
```

#### B. Add Redirect URLs (Whitelist)
**Same page, scroll down:**

```
https://login.igenogate.com/**
https://login.igenogate.com/auth/callback
https://login.igenogate.com/auth/reset-password
```

Click **Save**

---

### 2. Enable & Configure Email

#### Option A: For Testing (Quick & Easy)
**Navigation:** Authentication → Providers → Email

1. Turn ON **"Confirm email"**
2. Click **Save**
3.  Limitation: Only 4 emails/hour

#### Option B: For Production (Recommended)
**Navigation:** Project Settings → Auth → SMTP Settings

**Quick Setup with Gmail:**
1. Enable **Custom SMTP**
2. Fill in:
   ```
   Host: smtp.gmail.com
   Port: 587
   Sender Email: your-email@gmail.com
   Sender Name: iGenoGate Care
   Username: your-email@gmail.com
   Password: [Use App Password, not regular password]
   ```
3. Click **Save**

**How to get Gmail App Password:**
1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Search for "App passwords"
4. Generate new app password
5. Copy and paste into Supabase

---

### 3. Update Your Domain DNS

**Go to your domain provider** (where you bought igenogate.com):

Add this DNS record:
```
Type: A (or CNAME)
Name: login
Value: YOUR_SERVER_IP (or hosting URL)
TTL: 3600
```

**Wait 5-60 minutes** for DNS to update.

---

### 4. Deploy Your Changes

```bash
# In your project directory
npm run build

# Then deploy to your hosting (Vercel, AWS, etc.)
```

**Important:** Make sure your production environment has:
```
NEXT_PUBLIC_APP_URL=https://login.igenogate.com
```

---

## ✅ Test Everything

After completing the above steps:

### Test 1: Sign Up
1. Go to: https://login.igenogate.com/auth/signup
2. Create account
3. ✅ Check email for confirmation
4. ✅ Click link → should go to login.igenogate.com

### Test 2: Forgot Password
1. Go to: https://login.igenogate.com/auth/signin
2. Click "Forgot your password?"
3. Enter email
4. ✅ Check email for reset link
5. ✅ Click link → should go to login.igenogate.com
6. ✅ Set new password

### Test 3: Resend Confirmation
1. Go to sign in page
2. Enter email
3. Click "Resend confirmation email"
4. ✅ Check email

---

## 🐛 Still Not Working?

### No emails arriving?

**Check 1:** Is email confirmation enabled?
- Supabase → Authentication → Providers → Email → "Confirm email" is ON

**Check 2:** Is SMTP configured?
- Supabase → Project Settings → Auth → SMTP Settings → Enabled

**Check 3:** Spam folder?
- Check your spam/junk folder

**Check 4:** Supabase logs
- Supabase → Logs → Auth Logs
- Look for errors

### Email links still go to localhost?

**Fix:**
1. Check `.env.local` has: `NEXT_PUBLIC_APP_URL=https://login.igenogate.com`
2. Restart dev server: `npm run dev`
3. Redeploy production

### "Invalid redirect URL" error?

**Fix:** Add your domain to Supabase redirect URLs (see Step 1B above)

---

## 📞 Quick Help

**Problem:** Emails not sending
**Solution:** Configure SMTP in Supabase (Step 2B above)

**Problem:** Links go to localhost
**Solution:** Update Supabase Site URL (Step 1A above)

**Problem:** "Invalid redirect" error
**Solution:** Whitelist URLs in Supabase (Step 1B above)

---

## 🎯 Priority Order

Do these in order:

1. ✅ **Configure Supabase Site URL** (Step 1A) - CRITICAL
2. ✅ **Configure Supabase Redirect URLs** (Step 1B) - CRITICAL  
3. ✅ **Enable Email / Configure SMTP** (Step 2) - CRITICAL
4. ⏳ Update DNS (Step 3) - If not done already
5. 🚀 Deploy changes (Step 4)
6. ✅ Test (Step 5)

---

**Need the detailed guide?** See `EMAIL_SETUP_GUIDE.md`
