# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies (1 minute)

```bash
npm install
```

## 2. Set Up Supabase (2 minutes)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Enter project name, database password
4. Wait for project setup

### Get Credentials
1. Go to **Settings** → **API**
2. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key

## 3. Configure Environment (30 seconds)

```bash
# Copy the example file
copy .env.example .env.local

# Edit .env.local with your Supabase credentials
```

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Set Up Database (1 minute)

1. Open Supabase dashboard → **SQL Editor**
2. Click **New Query**
3. Copy entire `supabase-schema.sql` file
4. Paste and click **Run**

✅ All tables created!

## 5. Start Development Server (30 seconds)

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

## 6. Create Account

1. Go to **http://localhost:3000/auth/signup**
2. Fill in form (use **Administrator** role for full access)
3. Sign in

## That's It!

You now have:
- ✅ Full authentication system
- ✅ Care service booking
- ✅ Learning management system
- ✅ Role-based dashboards
- ✅ Complete database structure

## What to Do Next?

### Test the Platform
- Book a care service
- Browse academy courses
- Check your dashboard

### Add Sample Data
Use Supabase Table Editor to add:
- Sample courses
- Caregiver profiles
- Test bookings

### Customize
- Update branding in components
- Modify colors in Tailwind
- Add your logo

### Deploy
See DEPLOYMENT.md for production deployment

## Need Help?

- **Setup Issues?** → See SETUP.md
- **Features?** → See FEATURES.md
- **Deployment?** → See DEPLOYMENT.md
- **Supabase?** → [Supabase Docs](https://supabase.com/docs)
- **Next.js?** → [Next.js Docs](https://nextjs.org/docs)

## Common Issues

**"Can't connect to Supabase"**
- Check your .env.local has correct credentials
- Restart dev server: `npm run dev`

**"Tables don't exist"**
- Run supabase-schema.sql in SQL Editor
- Verify tables in Table Editor

**"Authentication not working"**
- Check Supabase → Authentication is enabled
- Verify environment variables are correct
