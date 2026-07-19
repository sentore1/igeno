# Getting Started - Care & Igeno Platform

Welcome! This guide will get you up and running in **5 simple steps**.

---

## 📋 Prerequisites

Before you start, make sure you have:

- [ ] **Node.js 18+** installed ([download](https://nodejs.org))
- [ ] **A code editor** (VS Code recommended)
- [ ] **A Supabase account** (free at [supabase.com](https://supabase.com))
- [ ] **Git** (optional, for version control)

---

## 🚀 5 Steps to Launch

### Step 1: Install Dependencies ⏱️ 1 minute

Open terminal in project folder and run:

```bash
npm install
```

Wait for all packages to install.

✅ **Done!** Dependencies installed.

---

### Step 2: Set Up Supabase ⏱️ 2 minutes

#### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: Care Igeno Platform
   - **Database Password**: (save this!)
   - **Region**: (choose closest to you)
4. Click **"Create new project"**
5. Wait ~2 minutes for setup

#### Get Your Keys
1. Once ready, click **"Settings"** (gear icon) → **"API"**
2. Copy these three values:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys")

✅ **Done!** Supabase project created.

---

### Step 3: Configure Environment ⏱️ 30 seconds

#### On Windows (Command Prompt or PowerShell):
```bash
copy .env.example .env.local
```

#### Then Edit `.env.local`:
Open `.env.local` in your editor and paste your Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Replace the placeholder values with your actual Supabase keys!

✅ **Done!** Environment configured.

---

### Step 4: Create Database ⏱️ 1 minute

1. Go back to Supabase Dashboard
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. Open `supabase-schema.sql` in your code editor
5. Copy the **entire contents**
6. Paste into Supabase SQL Editor
7. Click **"Run"** (or press Ctrl+Enter)

You should see: **"Success. No rows returned"**

#### Verify Tables Created:
1. Click **"Table Editor"** in left sidebar
2. You should see 13 tables:
   - profiles
   - clients
   - caregivers
   - bookings
   - courses
   - lessons
   - resources
   - enrollments
   - quizzes
   - quiz_attempts
   - certificates
   - payments
   - notifications

✅ **Done!** Database created.

---

### Step 5: Start Development Server ⏱️ 30 seconds

```bash
npm run dev
```

Wait for:
```
✓ Ready in 2.3s
○ Local:   http://localhost:3000
```

Then open **http://localhost:3000** in your browser!

✅ **Done!** Platform is running!

---

## 🎉 Success! What Now?

### Test Your Platform

#### 1. Create Your First Account
1. Click **"Sign Up"**
2. Fill in the form:
   - **Full Name**: Your Name
   - **Email**: your@email.com
   - **Password**: (min 6 characters)
   - **Role**: Select "Administrator" for full access
3. Click **"Sign up"**

#### 2. Explore Features
- ✅ Browse **Care Services**
- ✅ Check **Academy** courses
- ✅ Visit your **Dashboard**
- ✅ Try **Booking** a service

---

## 📚 What You Just Built

You now have:

✅ **Full authentication system** - Sign up, sign in, roles
✅ **Care booking system** - Schedule care services
✅ **Learning platform** - Browse and enroll in courses
✅ **User dashboard** - Personalized for each role
✅ **Database** - Complete PostgreSQL schema
✅ **Security** - Row-level security enabled

---

## 🎯 Next Steps

### Add Sample Data (Optional)
Want some test data? Run the sample data seeder:

1. Open Supabase SQL Editor
2. Open `scripts/seed-sample-data.sql`
3. Copy and paste contents
4. Click **Run**

This adds 10 sample courses to your academy!

### Customize Your Platform
1. **Branding**: Update colors, fonts, logo
2. **Content**: Add real courses and services
3. **Users**: Create test accounts with different roles
4. **Test**: Try all features

### Deploy to Production
When ready, see **DEPLOYMENT.md** for:
- Deploying to Vercel
- Setting up production database
- Configuring custom domain

---

## 📖 Documentation Quick Links

| Document | What It's For |
|----------|---------------|
| `QUICKSTART.md` | Super fast 5-minute setup |
| `SETUP.md` | Detailed setup instructions |
| `FEATURES.md` | Complete feature list |
| `ARCHITECTURE.md` | Technical documentation |
| `DEPLOYMENT.md` | Production deployment |
| `TROUBLESHOOTING.md` | Common issues & solutions |
| `PROJECT_SUMMARY.md` | Project overview |
| `STATUS.md` | Current project status |

---

## ❓ Common Questions

### "It's not working!"
1. Check `TROUBLESHOOTING.md` first
2. Verify `.env.local` has correct values
3. Make sure dev server is running
4. Check browser console (F12) for errors
5. Restart dev server

### "Where do I add courses?"
Two options:
1. **Database**: Use Supabase Table Editor
2. **Admin UI**: Build course management pages (coming soon)

For now, use the Table Editor:
1. Go to Supabase → Table Editor → `courses`
2. Click **"Insert row"**
3. Fill in course details

### "How do I change the design?"
- **Colors**: Edit Tailwind classes in components
- **Layout**: Modify components in `components/`
- **Pages**: Edit files in `app/` folder
- **Styles**: Update `app/globals.css`

### "Can I use this in production?"
**Yes!** This is production-ready. Just:
1. Deploy to Vercel (see DEPLOYMENT.md)
2. Use production Supabase project
3. Set up proper monitoring
4. Add your real content

---

## 🆘 Need Help?

### Check These First:
1. ✅ `.env.local` exists and has correct keys
2. ✅ Database schema was run successfully
3. ✅ Dev server is running (`npm run dev`)
4. ✅ Browser console has no errors (F12)
5. ✅ Using supported browser (Chrome, Firefox, Edge, Safari)

### Still Stuck?
1. Read `TROUBLESHOOTING.md`
2. Check browser console for errors
3. Verify Supabase connection
4. Test in incognito mode
5. Restart everything

---

##  Pro Tips

### Development
- **Auto-reload**: Changes auto-refresh the browser
- **Console**: Keep browser console open (F12)
- **Network tab**: Monitor API calls
- **Supabase logs**: Check Supabase Dashboard → Logs

### Best Practices
- **Commit often**: Use Git to save progress
- **Test changes**: Verify before deploying
- **Read docs**: Check documentation when stuck
- **Start simple**: Add features gradually

---

## 🎓 Learning Path

### Day 1 (Today!)
- [x] Set up development environment
- [x] Create first account
- [x] Explore the platform

### Week 1
- [ ] Customize branding
- [ ] Add sample data
- [ ] Test all features
- [ ] Create different user roles

### Week 2
- [ ] Add real content (courses, services)
- [ ] Set up production environment
- [ ] Deploy to Vercel
- [ ] Test in production

### Month 1
- [ ] Launch to users
- [ ] Gather feedback
- [ ] Add requested features
- [ ] Monitor usage

---

## ✨ You're All Set!

**Congratulations!** 🎉 Your Care & Igeno Platform is now running!

You have successfully:
- ✅ Installed all dependencies
- ✅ Set up Supabase
- ✅ Configured environment
- ✅ Created database
- ✅ Started development server

**Now start building something amazing!** 🚀

---

## 📞 Quick Reference

### Commands
```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### URLs
- **Local**: http://localhost:3000
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

### Files
- **Environment**: `.env.local`
- **Database Schema**: `supabase-schema.sql`
- **Sample Data**: `scripts/seed-sample-data.sql`

---

**Happy Building!** 🎨

If you get stuck, remember: `TROUBLESHOOTING.md` is your friend!
