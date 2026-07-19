# Caregiver Registration System Guide

## Overview

The caregiver registration system allows administrators to create full caregiver accounts with automatic login credentials. When an admin adds a caregiver, the system creates:

1. **Auth User Account** - Enables login to the platform
2. **Profile Record** - Stores user information with caregiver role
3. **Caregiver Record** - Contains caregiver-specific data (specialization, rating, etc.)
4. **Auto-generated PIN** - 6-digit secure login password

## Features

### ✅ Admin-Initiated Account Creation
- Admins can create caregiver accounts directly from the admin dashboard
- No need for caregivers to go through signup process
- Automatic account activation with verified email

### ✅ Auto-Generated PIN System
- System generates a secure 6-digit PIN (100000-999999)
- PIN serves as the initial password for the caregiver
- Admin can choose to send PIN via email or share it manually

### ✅ Email Options
Admins have two options when creating caregiver accounts:

**Option 1: Send PIN via Email (Recommended)**
- ✅ PIN is automatically sent to caregiver's email
- ✅ Caregiver receives credentials immediately
- ✅ More secure - no manual sharing needed
- ⚠️ Requires email service configuration

**Option 2: Manual PIN Delivery**
- ✅ Admin receives PIN in a modal window
- ✅ Admin can copy PIN to clipboard
- ✅ Admin shares PIN with caregiver directly
- ⚠️ Admin must note down PIN before closing modal

### ✅ Login Flow for Caregivers

1. Caregiver receives email and PIN from admin
2. Caregiver goes to `/auth/signin`
3. Caregiver enters:
   - Email: `their-email@example.com`
   - Password: `123456` (their PIN)
4. System logs them in
5. Caregiver is redirected to `/dashboard/caregiver`

### ✅ Dashboard Access

Once logged in, caregivers can:
- View their profile and information
- Access their caregiver dashboard at `/dashboard/caregiver`
- Manage their bookings
- View their schedule
- Update their availability

## How to Use

### For Admins: Creating a Caregiver Account

1. **Navigate to Caregiver Management**
   - Go to `/dashboard/admin`
   - Click "Manage Caregivers" or go to `/dashboard/admin/caregivers`

2. **Click "Add Caregiver"**
   - Fill in caregiver details:
     - Full Name (required)
     - Email (required)
     - Phone (required)
     - Specialization (optional)

3. **Choose Email Delivery Option**
   - ✅ **Send login PIN via email** - Recommended
     - PIN will be sent automatically
     - Caregiver receives email with credentials
   - ⬜ **Uncheck to receive PIN manually**
     - You'll see PIN in a modal
     - You must share it with caregiver

4. **Click "Add Caregiver"**
   - System creates the account
   - If email option selected: PIN sent to caregiver
   - If manual option: PIN displayed in modal

5. **Note the Credentials**
   - Email: The email you entered
   - PIN: 6-digit number shown in modal
   - **Important:** Copy PIN before closing modal

### For Admins: Viewing Caregiver Credentials

After creating a caregiver, you'll see a success modal with:

```
┌─────────────────────────────────────┐
│  ✅ Caregiver Account Created!      │
├─────────────────────────────────────┤
│  Email: jane.doe@example.com        │
│  Login PIN: 123456          [Copy]  │
├─────────────────────────────────────┤
│  📧 Email Sent / ⚠️ Manual Required │
└─────────────────────────────────────┘
```

### For Caregivers: Logging In

1. **Open the Login Page**
   - Navigate to `https://yourplatform.com/auth/signin`

2. **Enter Credentials**
   - Email: Your registered email
   - Password: The 6-digit PIN provided by admin

3. **Access Dashboard**
   - After login, you'll be redirected to your caregiver dashboard
   - You can view bookings, update profile, manage availability

## Technical Implementation

### API Endpoint

**POST** `/api/admin/caregivers`

**Request Body:**
```json
{
  "full_name": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+1-555-1234",
  "specialization": "Elderly Care",
  "send_email": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Caregiver account created successfully",
  "caregiver": { /* caregiver record */ },
  "credentials": {
    "email": "jane.smith@example.com",
    "pin": "123456",
    "note": "PIN sent to caregiver email"
  }
}
```

### Database Operations

The system performs these operations in order:

1. **Create Auth User** (using Supabase Admin API)
   ```typescript
   supabaseAdmin.auth.admin.createUser({
     email: email,
     password: pin,
     email_confirm: true,
     user_metadata: {
       full_name: full_name,
       role: 'caregiver',
     },
   })
   ```

2. **Create Profile Record**
   ```sql
   INSERT INTO profiles (id, full_name, email, role)
   VALUES (auth_user_id, full_name, email, 'caregiver')
   ```

3. **Create Caregiver Record**
   ```sql
   INSERT INTO caregivers (user_id, full_name, email, phone, specialization, rating, availability)
   VALUES (auth_user_id, full_name, email, phone, specialization, 0, '[]')
   ```

### Error Handling

The system includes rollback mechanisms:
- If profile creation fails → Auth user is deleted
- If caregiver creation fails → Auth user and profile are deleted
- This ensures data consistency

### Security Features

1. **Admin-Only Access**
   - Only users with `role = 'admin'` can create caregivers
   - API checks session and role before processing

2. **Auto-Confirmed Email**
   - Caregivers don't need to verify email
   - Account is immediately active

3. **Secure PIN Generation**
   - Uses cryptographically random number generation
   - 6 digits = 1 million possible combinations

4. **Row Level Security (RLS)**
   - Caregivers can only view/edit their own data
   - Admins have full access to all caregiver records

## Email Service Configuration

### Current Setup
The system includes a placeholder email function that logs PINs to console. For production use, you should integrate a real email service.

### Recommended Email Services

1. **SendGrid** (Recommended)
   ```typescript
   import sgMail from '@sendgrid/mail';
   
   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
   
   await sgMail.send({
     to: email,
     from: 'noreply@yourplatform.com',
     subject: 'Your Caregiver Account Credentials',
     html: `
       <h2>Welcome ${fullName}!</h2>
       <p>Your caregiver account has been created.</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Login PIN:</strong> ${pin}</p>
       <p>Please login at: https://yourplatform.com/auth/signin</p>
       <p>For security, consider changing your PIN after first login.</p>
     `
   });
   ```

2. **Resend** (Modern Alternative)
   ```typescript
   import { Resend } from 'resend';
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   
   await resend.emails.send({
     from: 'noreply@yourplatform.com',
     to: email,
     subject: 'Your Caregiver Account Credentials',
     html: emailTemplate,
   });
   ```

3. **Supabase Auth Emails** (Built-in)
   - Configure email templates in Supabase dashboard
   - Use custom SMTP or Supabase's email service

### Setup Instructions

1. **Install Email Package**
   ```bash
   npm install @sendgrid/mail
   # or
   npm install resend
   ```

2. **Add API Key to .env**
   ```
   SENDGRID_API_KEY=your_api_key_here
   # or
   RESEND_API_KEY=your_api_key_here
   ```

3. **Update Email Function**
   Edit `/app/api/admin/caregivers/route.ts`
   Replace the `sendPINEmail` function with your email service implementation

## PIN Security Best Practices

### For Admins

1. **Use Email Delivery When Possible**
   - More secure than manual sharing
   - Creates audit trail
   - Reduces risk of interception

2. **If Sharing Manually**
   - Use secure channels (in-person, encrypted chat)
   - Don't send via regular SMS or email
   - Verify caregiver identity before sharing

3. **Document PIN Delivery**
   - Keep record of when PIN was shared
   - Note the delivery method used

### For Caregivers

1. **Change PIN After First Login**
   - While the system doesn't enforce this yet, it's good practice
   - Plan to implement password change feature

2. **Don't Share PIN**
   - PIN is personal login credential
   - Never share with others

3. **Store Securely**
   - Use password manager if needed
   - Don't write on easily accessible notes

## Future Enhancements

### Planned Features

1. **Force PIN Change on First Login**
   - Caregiver must set new password on first access
   - Improves security

2. **PIN Reset Functionality**
   - Admins can generate new PIN for caregiver
   - Useful if caregiver forgets PIN

3. **Email Templates**
   - Professional branded emails
   - Include onboarding instructions
   - Link to help resources

4. **SMS Delivery Option**
   - Send PIN via SMS as alternative
   - Two-factor authentication option

5. **Audit Log**
   - Track when accounts are created
   - Log PIN deliveries
   - Monitor login attempts

6. **Bulk Import**
   - CSV upload for multiple caregivers
   - Batch account creation
   - Automatic email delivery

## Troubleshooting

### Caregiver Can't Login

**Problem:** Caregiver says PIN doesn't work

**Solutions:**
1. Verify they're using correct email
2. Check if PIN was noted correctly (no spaces, correct digits)
3. Try password reset if available
4. Admin can view caregiver record in database
5. Admin can create new account if needed

### Email Not Received

**Problem:** PIN email not arriving

**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check email service logs
4. Use manual PIN delivery as backup
5. Resend if email service allows

### Account Creation Fails

**Problem:** Error when creating caregiver

**Solutions:**
1. Check if email already exists
2. Verify admin permissions
3. Check database connection
4. Review server logs for specific error
5. Ensure all required fields filled

## Database Schema

### Caregivers Table

```sql
CREATE TABLE caregivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  specialization TEXT,
  availability JSONB DEFAULT '[]',
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Support

For issues or questions:
1. Check this guide first
2. Review server logs for errors
3. Check Supabase dashboard for data
4. Contact technical support

## Summary

✅ **What This System Provides:**
- Easy caregiver onboarding by admins
- Automatic account creation
- Secure PIN generation
- Email delivery option
- Manual delivery fallback
- Immediate platform access

✅ **Benefits:**
- No signup form needed for caregivers
- Admin controls all account creation
- Caregivers get immediate access
- Secure credential delivery
- Full dashboard functionality
- Proper role-based access

✅ **Security:**
- Admin-only account creation
- Auto-confirmed email addresses
- Secure random PIN generation
- RLS policies for data protection
- Transaction rollback on failures
