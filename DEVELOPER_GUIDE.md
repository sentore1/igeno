# Developer Guide

Quick reference for developers working on the Care & Igeno Platform.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
copy .env.example .env.local
# Add your Supabase credentials to .env.local

# Run database schema
# Copy supabase-schema.sql to Supabase SQL Editor and execute

# Start development
npm run dev
```

---

## 📁 Project Structure

```
care-igeno-platform/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── signin/
│   │   └── signup/
│   ├── care/                     # Division A - Care
│   │   ├── booking/
│   │   └── page.tsx
│   ├── academy/                  # Division B - Academy
│   │   ├── courses/
│   │   │   ├── [id]/            # Dynamic route
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── dashboard/                # Dashboards
│   │   ├── admin/               # Admin pages
│   │   │   ├── users/
│   │   │   ├── bookings/
│   │   │   ├── courses/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── profile/                  # User profile
│   ├── api/                      # API routes
│   │   └── notifications/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── Navigation.tsx
│   └── LoadingSpinner.tsx
├── lib/                          # Utilities
│   ├── supabase-client.ts       # Supabase client
│   ├── auth.ts                  # Auth helpers
│   └── types.ts                 # TypeScript types
├── scripts/                      # Scripts
│   └── seed-sample-data.sql
└── [configs]                     # Config files
```

---

## 🗄️ Database Schema

### Main Tables

```
profiles          → User profiles (extends auth.users)
clients           → Client information
caregivers        → Caregiver profiles
bookings          → Service bookings
courses           → Academy courses
lessons           → Course lessons
resources         → Lesson resources
enrollments       → User course enrollments
quizzes           → Lesson quizzes
quiz_attempts     → Quiz submissions
certificates      → Course certificates
payments          → Payment records
notifications     → User notifications
```

### Key Relationships

```sql
auth.users (1) ←→ (1) profiles
profiles (1) ←→ (1) clients
profiles (1) ←→ (1) caregivers
clients (1) ←→ (N) bookings
caregivers (1) ←→ (N) bookings
profiles (N) ←→ (N) courses (via enrollments)
courses (1) ←→ (N) lessons
lessons (1) ←→ (N) resources
lessons (1) ←→ (N) quizzes
```

---

## 🔑 Authentication

### Client-Side Auth

```typescript
import { createBrowserClient } from '@/lib/supabase-client';

const supabase = createBrowserClient();

// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Sign out
await supabase.auth.signOut();
```

### Protected Routes

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/signin');
    }
  };
  checkAuth();
}, []);
```

### Role Check

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (profile?.role !== 'admin') {
  router.push('/dashboard');
}
```

---

## 📊 Data Fetching

### Basic Query

```typescript
const { data, error } = await supabase
  .from('courses')
  .select('*')
  .eq('is_published', true)
  .order('created_at', { ascending: false });
```

### With Relationships

```typescript
const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    clients (
      full_name,
      email
    )
  `)
  .eq('status', 'pending');
```

### Insert Data

```typescript
const { data, error } = await supabase
  .from('bookings')
  .insert({
    client_id: clientId,
    service_type: 'Personal Care',
    scheduled_date: '2026-07-20',
    scheduled_time: '10:00',
    duration: 120,
  });
```

### Update Data

```typescript
const { error } = await supabase
  .from('bookings')
  .update({ status: 'confirmed' })
  .eq('id', bookingId);
```

### Delete Data

```typescript
const { error } = await supabase
  .from('courses')
  .delete()
  .eq('id', courseId);
```

---

## 🎨 Styling Guide

### Tailwind CSS Classes

#### Colors
```tsx
// Primary (Blue)
bg-blue-600 text-white hover:bg-blue-700

// Secondary (Purple - Academy)
bg-purple-600 text-white hover:bg-purple-700

// Success (Green)
bg-green-600 text-white hover:bg-green-700

// Danger (Red)
bg-red-600 text-white hover:bg-red-700

// Gray
bg-gray-200 text-gray-700 hover:bg-gray-300
```

#### Components

**Button:**
```tsx
<button className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">
  Click Me
</button>
```

**Card:**
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  Card content
</div>
```

**Badge:**
```tsx
<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
  Badge
</span>
```

**Input:**
```tsx
<input
  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
  type="text"
/>
```

---

## 🔨 Common Patterns

### Loading State

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  // Fetch data
  setLoading(false);
};

if (loading) {
  return <LoadingSpinner />;
}
```

### Error Handling

```typescript
const [error, setError] = useState('');

try {
  // Operation
  setError('');
} catch (err: any) {
  setError(err.message || 'An error occurred');
}

// Display
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <p className="text-red-800">{error}</p>
  </div>
)}
```

### Success Message

```typescript
const [success, setSuccess] = useState(false);

// After success
setSuccess(true);
setTimeout(() => {
  router.push('/dashboard');
}, 2000);

// Display
{success && (
  <div className="bg-green-50 border border-green-200 rounded-md p-4">
    <p className="text-green-800">Success!</p>
  </div>
)}
```

---

## 🎯 Adding New Features

### 1. New Page

```bash
# Create file
app/your-feature/page.tsx
```

```typescript
export default function YourFeature() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Your Feature</h1>
      {/* Content */}
    </div>
  );
}
```

### 2. New API Route

```bash
# Create file
app/api/your-endpoint/route.ts
```

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Logic
    return NextResponse.json({ data: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3. New Component

```bash
# Create file
components/YourComponent.tsx
```

```typescript
interface Props {
  title: string;
}

export default function YourComponent({ title }: Props) {
  return (
    <div>
      <h2>{title}</h2>
    </div>
  );
}
```

### 4. New Database Table

1. Add SQL to `supabase-schema.sql`:
```sql
CREATE TABLE public.your_table (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
```

2. Add TypeScript type to `lib/types.ts`:
```typescript
export interface YourTable {
  id: string;
  name: string;
  created_at: string;
}
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Sign up with different roles
- [ ] Sign in and out
- [ ] Create bookings
- [ ] Enroll in courses
- [ ] Test admin pages (users, bookings, courses)
- [ ] Update profile
- [ ] Test on mobile
- [ ] Test in different browsers

### Test Users

Create test accounts for each role:
- admin@test.com (Admin)
- trainer@test.com (Trainer)
- student@test.com (Student)
- caregiver@test.com (Caregiver)
- client@test.com (Client)

---

## 🐛 Debugging

### Common Issues

**Environment variables not working:**
```bash
# Restart dev server
npm run dev
```

**Database errors:**
- Check Supabase Dashboard → Logs
- Verify table names and columns
- Check RLS policies

**Authentication issues:**
- Check session in browser DevTools
- Verify Supabase credentials
- Check auth.users in Supabase

### Debug Tools

**Browser Console:**
```bash
# Open DevTools
F12 or Ctrl+Shift+I

# Check:
- Console for errors
- Network tab for API calls
- Application tab for storage
```

**Supabase Dashboard:**
- Table Editor → View data
- Logs → See queries
- Authentication → Check users

---

## 📦 Deployment

### Build

```bash
npm run build
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Set in Vercel Dashboard:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
```

---

## 🔐 Security Best Practices

### Never Commit
- `.env.local`
- Service role keys
- Passwords
- API secrets

### Always
- Use environment variables
- Validate user input
- Check authentication
- Verify role permissions
- Sanitize data

### RLS Policies
```sql
-- Users can read own data
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all
CREATE POLICY "Admins can view all"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

### Project Docs
- `README.md` - Overview
- `GETTING_STARTED.md` - Quick start
- `ARCHITECTURE.md` - Technical details
- `FEATURES.md` - Feature list
- `TROUBLESHOOTING.md` - Common issues

---

##  Pro Tips

1. **Use TypeScript**: Let it catch errors early
2. **Keep components small**: Easier to maintain
3. **Reuse components**: DRY principle
4. **Test frequently**: Don't wait until the end
5. **Check console**: Errors show there first
6. **Use Tailwind**: Faster than custom CSS
7. **Follow patterns**: Match existing code style
8. **Document complex logic**: Help future you
9. **Git commit often**: Save your progress
10. **Read error messages**: They usually tell you what's wrong

---

## 🎓 Learning Path

### Week 1: Setup & Basics
- Set up development environment
- Understand project structure
- Make small changes
- Test features

### Week 2: Feature Development
- Add new components
- Create new pages
- Work with database
- Implement features

### Week 3: Advanced
- Build complex features
- Add admin functionality
- Implement integrations
- Deploy to production

---

## ✅ Code Review Checklist

Before committing:
- [ ] Code compiles without errors
- [ ] TypeScript types are correct
- [ ] No console.log statements (except for debugging)
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Mobile responsive
- [ ] Tested in browser
- [ ] Follows project patterns
- [ ] Comments for complex logic

---

**Happy Coding!** 🚀

For questions or issues, refer to project documentation or check `TROUBLESHOOTING.md`.
