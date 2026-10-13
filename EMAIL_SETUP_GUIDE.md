# Email & Domain Configuration Guide

## 🎯 Overview
This guide will help you set up email functionality and configure your production domain (login.igenogate.com).

## ✅ What Was Fixed

### 1. Environment Configuration
- ✅ Updated `NEXT_PUBLIC_APP_URL` to `https://login.igenogate.com`
- ✅ All email links now redirect to your domain instead of localhost
- ✅ Added forgot password functionality

### 2. New Features Added
- ✅ Forgot Password page (`/auth/forgot-password`)
- ✅ Reset Password page (`/auth/reset-password`)
- ✅ Resend confirmation email button
- ✅ Domain-aware redirect URLs

---

## 🔧 Supabase Configuration Required

### Step 1: Configure Site URL in Supabase

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. Navigate to: **Authentication** → **URL Configuration**
3. Update the following fields:

   ```
   Site URL: https://login.igenogate.com
   ```

4. **Add Redirect URLs** (whitelist these URLs):
   ```
   https://login.igenogate.com/**
   https://login.igenogate.com/auth/callback
   https://login.igenogate.com/auth/reset-password
   ```

5. Click **Save**

### Step 2: Enable Email Confirmation

1. Go to: **Authentication** → **Providers** → **Email**
2. Enable **"Confirm email"** toggle
3. Set **"Email confirmation URL"**: 
   ```
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
   ```
4. Click **Save**

### Step 3: Configure SMTP (Email Sending)

You have 3 options:

#### Option A: Use Supabase Built-in Email (Development Only)
- ✅ Already configured
-  Limited to 4 emails per hour
-  Not recommended for production

#### Option B: Configure Custom SMTP (Recommended for Production)

1. Go to: **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **"Enable Custom SMTP"**
3. Enter your SMTP details:
   ```
   SMTP Host: smtp.your-provider.com
   SMTP Port: 587 (or 465 for SSL)
   Sender Email: no-reply@igenogate.com
   Sender Name: iGenoGate Care
   Username: your-smtp-username
   Password: your-smtp-password
   ```

**Popular SMTP Providers:**
- **SendGrid**: smtp.sendgrid.net (Port 587)
- **Mailgun**: smtp.mailgun.org (Port 587)
- **Amazon SES**: email-smtp.us-east-1.amazonaws.com (Port 587)
- **Gmail**: smtp.gmail.com (Port 587) - Use App Password
- **Outlook**: smtp-mail.outlook.com (Port 587)

4. Click **Save**
5. Send a test email to verify

#### Option C: Use Resend (Modern Alternative)

1. Go to: https://resend.com
2. Sign up and verify your domain
3. Get your API key
4. In Supabase, configure SMTP with Resend:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   Username: resend
   Password: your-resend-api-key
   ```

### Step 4: Customize Email Templates

1. Go to: **Authentication** → **Email Templates**
2. Customize these templates:

#### Confirm Signup Template
```html
<h2>Confirm your email</h2>
<p>Welcome to iGenoGate Care!</p>
<p>Follow this link to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

#### Reset Password Template
```html
<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

---

## 🌐 DNS Configuration (Your Domain Provider)

### Point Your Domain to Your Server

1. **Go to your DNS provider** (where you registered igenogate.com)
2. **Add/Update DNS Records:**

   For a subdomain (login.igenogate.com):
   ```
   Type: A
   Name: login
   Value: YOUR_SERVER_IP_ADDRESS
   TTL: 3600
   ```

   OR if using a CDN/hosting platform:
   ```
   Type: CNAME
   Name: login
   Value: your-app.vercel.app (or your hosting provider)
   TTL: 3600
   ```

3. **Wait for DNS propagation** (can take 5-60 minutes)
4. **Verify** by visiting: https://login.igenogate.com

---

## 🚀 Deployment Steps

### 1. Update Environment Variables in Production

Make sure your production environment has:

```bash
NEXT_PUBLIC_APP_URL=https://login.igenogate.com
NEXT_PUBLIC_SUPABASE_URL=https://ippcprgsdssnbjtpfklt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Deploy Your Application

```bash
# Build the application
npm run build

# Deploy to your hosting platform
# (Vercel, AWS, Azure, etc.)
```

### 3. Test Email Functionality

1. **Test Sign Up**:
   - Go to: https://login.igenogate.com/auth/signup
   - Create a new account
   - Check email for confirmation link
   - Click link and verify it redirects to login.igenogate.com

2. **Test Forgot Password**:
   - Go to: https://login.igenogate.com/auth/signin
   - Click "Forgot your password?"
   - Enter your email
   - Check email for reset link
   - Click link and verify it goes to login.igenogate.com

3. **Test Resend Confirmation**:
   - Go to: https://login.igenogate.com/auth/signin
   - Enter email
   - Click "Resend confirmation email"
   - Check email inbox

---

## 🐛 Troubleshooting

### Issue: Not Receiving Emails

**Check 1: Email Confirmation Enabled?**
- Go to Supabase → Authentication → Providers → Email
- Make sure "Confirm email" is ON

**Check 2: SMTP Configured?**
- Go to Project Settings → Auth → SMTP Settings
- Verify SMTP credentials are correct
- Send a test email

**Check 3: Check Spam Folder**
- Emails might be in spam/junk folder
- Add no-reply@igenogate.com to contacts

**Check 4: Rate Limits**
- Supabase free tier: 4 emails/hour
- Upgrade or use custom SMTP for more

**Check 5: Email Provider Logs**
- Check your SMTP provider dashboard for delivery logs
- Look for bounces or errors

### Issue: Email Links Redirect to Localhost

**Fix:**
1. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_URL=https://login.igenogate.com
   ```
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. Redeploy to production

### Issue: "Invalid Redirect URL" Error

**Fix:**
1. Go to Supabase → Authentication → URL Configuration
2. Add your domain to redirect URLs:
   ```
   https://login.igenogate.com/**
   ```
3. Save and try again

### Issue: Password Reset Not Working

**Check:**
1. User clicked the reset link from email
2. Link hasn't expired (expires in 1 hour)
3. Redirect URL is whitelisted in Supabase

---

## 📋 Testing Checklist

- [ ] Domain resolves to your server (ping login.igenogate.com)
- [ ] HTTPS certificate is valid
- [ ] Sign up sends confirmation email
- [ ] Confirmation link redirects to login.igenogate.com
- [ ] Forgot password sends reset email
- [ ] Reset password link redirects to login.igenogate.com
- [ ] Resend confirmation works
- [ ] All emails land in inbox (not spam)
- [ ] Email templates are customized
- [ ] SMTP provider has no errors in logs

---

## 📄 Files Modified

### Created
- `app/auth/forgot-password/page.tsx` - Forgot password page
- `app/auth/reset-password/page.tsx` - Reset password page
- `EMAIL_SETUP_GUIDE.md` - This guide

### Modified
- `.env.local` - Updated APP_URL to production domain
- `.env.example` - Added comment about production URL
- `app/auth/signup/page.tsx` - Uses env variable for redirect URL
- `app/auth/signin/page.tsx` - Added forgot password link, uses env variable

---

## 🎉 Ready to Go!

Once you've completed all the steps above:

1. ✅ Emails will be sent successfully
2. ✅ All links will point to login.igenogate.com
3. ✅ Users can reset forgotten passwords
4. ✅ Confirmation emails work properly

## 🆘 Need Help?

If you're still having issues:

1. Check Supabase logs: **Project → Logs → Auth Logs**
2. Check browser console for errors
3. Verify environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_APP_URL)`
4. Contact your SMTP provider support if emails aren't sending

---

## 🔒 Security Notes

- Never commit `.env.local` to git (it's in .gitignore)
- Use strong SMTP passwords
- Enable 2FA on your email provider
- Regularly rotate SMTP credentials
- Monitor email sending quotas
- Use HTTPS only (never HTTP for production)
