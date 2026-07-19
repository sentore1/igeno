# Setup Guide

Follow these steps to set up the Care & Igeno Platform.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git (optional)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (takes ~2 minutes)
3. Go to **Settings** → **API** to find your credentials:
   - Project URL
   - Anon/Public Key
   - Service Role Key (under "Service role")

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   copy .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 4: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the schema

This will create all necessary tables:
- User profiles
- Clients and caregivers
- Bookings
- Courses and lessons
- Enrollments
- Quizzes
- Certificates
- Payments
- Notifications

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Optional: Configure email templates in **Authentication** → **Email Templates**

## Step 6: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Create Your First Admin Account

1. Go to [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)
2. Fill in the form and select **Administrator** as role
3. Check your email for verification (if enabled)
4. Sign in at [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin)

## Verification

Test that everything works:

1. ✅ Homepage loads correctly
2. ✅ You can sign up and sign in
3. ✅ Dashboard displays your role
4. ✅ Care services page loads
5. ✅ Academy page loads

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file has the correct Supabase credentials
- Make sure you copied the **Anon key**, not the JWT secret
- Restart the dev server after changing environment variables

### Database errors
- Verify you ran the entire `supabase-schema.sql` script
- Check the Supabase dashboard → **Table Editor** to confirm tables exist

### Authentication not working
- Check Supabase dashboard → **Authentication** → **Settings**
- Ensure email confirmation is set to your preference
- Check spam folder for verification emails

## Next Steps

- Customize the branding and styling
- Add sample data (courses, caregivers)
- Configure payment processing
- Set up email notifications
- Deploy to production

## Production Deployment

### Recommended Platforms
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Railway**

### Pre-deployment Checklist
1. Set production environment variables
2. Update `NEXT_PUBLIC_APP_URL` to your production URL
3. Configure Supabase redirect URLs for production
4. Enable RLS policies in production
5. Test authentication flow
6. Set up custom domain

## Support

For issues or questions:
- Check the README.md
- Review Supabase documentation
- Review Next.js documentation
