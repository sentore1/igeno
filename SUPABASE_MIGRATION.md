# Supabase SSR Migration Guide

## Changes Made

We've migrated from the deprecated `@supabase/auth-helpers-nextjs` to the modern `@supabase/ssr` package.

## Installation Steps

1. **Stop your development server** (Ctrl+C if running)

2. **Remove old dependencies and install new ones:**
```cmd
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/ssr
npm install
```

3. **Clear browser storage:**
   - Open DevTools (F12)
   - Go to Application → Storage
   - Click "Clear site data"
   - Or manually clear: Cookies, Local Storage, Session Storage

4. **Restart the development server:**
```cmd
npm run dev
```

## Updated Files

### 1. `lib/supabase-client.ts` - Client-side Supabase
Use this in **client components** (components with `"use client"`):

```typescript
import { supabase } from '@/lib/supabase-client';

// In your component
const { data, error } = await supabase.auth.signIn({ email, password });
```

### 2. `lib/supabase.ts` - Server-side Supabase
Use this in **server components** and **API routes**:

```typescript
import { createClient } from '@/lib/supabase';

// In your server component or API route
const supabase = await createClient();
const { data, error } = await supabase.auth.getUser();
```

### 3. `middleware.ts` - Updated for SSR
The middleware now properly handles cookie-based authentication with automatic session refresh.

## Usage Examples

### Client Component (Browser)
```typescript
'use client';

import { supabase } from '@/lib/supabase-client';
import { useState } from 'react';

export default function LoginForm() {
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
    } else {
      console.log('Logged in:', data.user);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      // handle login
    }}>
      {/* form fields */}
    </form>
  );
}
```

### Server Component
```typescript
import { createClient } from '@/lib/supabase';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Not logged in</div>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
    </div>
  );
}
```

### API Route
```typescript
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your API logic here
  return NextResponse.json({ data: 'success' });
}
```

## Benefits of the New Approach

1. **No more HTTP 431 errors** - Optimized cookie handling
2. **Better performance** - Automatic session refresh in middleware
3. **Type safety** - Full TypeScript support
4. **Future-proof** - Uses the officially supported package
5. **Cleaner API** - Simpler client creation

## Troubleshooting

### Still getting HTTP 431?
1. Clear browser storage completely
2. Delete `.next` folder: `Remove-Item -Recurse -Force .next`
3. Restart dev server

### TypeScript errors?
Run: `npm run build` to check for type errors

### Authentication not working?
- Check `.env.local` has correct Supabase credentials
- Verify middleware is running (check console for middleware logs)
- Clear cookies and try logging in again
