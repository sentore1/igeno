# Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### "npm install fails"

**Problem**: Package installation errors

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install
```

### "Module not found" errors

**Problem**: Missing dependencies after installation

**Solution**:
```bash
# Ensure all packages are installed
npm install

# Check if package exists in package.json
# If missing, install it:
npm install [package-name]
```

---

## Environment Variable Issues

### "Invalid API key" or "Supabase connection failed"

**Problem**: Incorrect or missing environment variables

**Solutions**:

1. Check `.env.local` exists (not `.env.example`)
2. Verify values are correct:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
   ```
3. Restart dev server after changes:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
4. Check for extra spaces or quotes
5. Verify keys from Supabase Dashboard → Settings → API

### "Environment variable not defined"

**Problem**: Variables not loading

**Solutions**:
1. File must be named `.env.local` exactly
2. Must be in project root
3. Restart dev server
4. On Windows, check file extensions (not `.env.local.txt`)

---

## Database Issues

### "relation does not exist" or "table not found"

**Problem**: Database schema not created

**Solutions**:
1. Go to Supabase Dashboard → SQL Editor
2. Create New Query
3. Copy entire `supabase-schema.sql`
4. Paste and Run
5. Check Table Editor to verify tables exist

### "Row Level Security policy violation"

**Problem**: RLS policies blocking access

**Solutions**:
1. Verify user is authenticated
2. Check RLS policies in Supabase Dashboard
3. For development, you can temporarily disable RLS:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```
   (Re-enable before production!)

### "Foreign key constraint violation"

**Problem**: Trying to insert data without required relationships

**Solution**:
- Ensure referenced records exist
- Example: Can't create booking without client_id
- Create related records first

---

## Authentication Issues

### "Email confirmation required"

**Problem**: Supabase waiting for email confirmation

**Solutions**:
1. Check email (including spam)
2. Or disable email confirmation:
   - Supabase Dashboard → Authentication → Settings
   - Set "Enable email confirmations" to OFF
   - During development only!

### "User already registered"

**Problem**: Email already in use

**Solutions**:
1. Use sign in instead
2. Or delete user from Supabase Dashboard → Authentication → Users
3. Or use different email

### "Invalid login credentials"

**Problem**: Wrong email or password

**Solutions**:
1. Verify email is correct
2. Check password (min 6 characters)
3. Reset password via Supabase Dashboard if needed
4. Check if user exists in Authentication → Users

### "Session expired"

**Problem**: User session timed out

**Solution**:
- Sign in again
- Sessions last 1 hour by default
- Configure in Supabase Dashboard → Authentication → Settings

---

## Development Server Issues

### "Port 3000 already in use"

**Problem**: Another process using port 3000

**Solutions**:

**Option 1**: Kill the process
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Or use different port
```

**Option 2**: Use different port
```bash
npm run dev -- -p 3001
```

### "npm run dev not working"

**Problem**: Dev server won't start

**Solutions**:
1. Check for syntax errors in config files
2. Verify Node.js version (18+):
   ```bash
   node --version
   ```
3. Delete `.next` folder:
   ```bash
   rmdir /s /q .next
   npm run dev
   ```

---

## Build Issues

### "Build failed" or "Type errors"

**Problem**: TypeScript compilation errors

**Solutions**:
1. Check error messages for specific files
2. Common fixes:
   ```typescript
   // Add proper types
   const [data, setData] = useState<Type[]>([]);
   
   // Handle null/undefined
   const value = data?.field ?? 'default';
   ```
3. Temporarily skip type checking (not recommended):
   ```bash
   # In next.config.ts
   typescript: { ignoreBuildErrors: true }
   ```

### "Module parse failed"

**Problem**: Syntax error or unsupported feature

**Solution**:
- Check recent code changes
- Verify imports are correct
- Check for missing closing brackets/quotes

---

## UI/Display Issues

### "Styles not applying"

**Problem**: Tailwind CSS not working

**Solutions**:
1. Check `globals.css` has Tailwind directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
2. Restart dev server
3. Clear browser cache (Ctrl+Shift+R)

### "Navigation not showing"

**Problem**: Navigation component not rendering

**Solution**:
1. Check browser console for errors
2. Verify `Navigation.tsx` exists in `components/`
3. Check it's imported in `layout.tsx`

### "Page not found (404)"

**Problem**: Route doesn't exist

**Solutions**:
1. Check file structure in `app/` folder
2. Verify file is named `page.tsx`
3. Check URL matches folder structure
4. Restart dev server

---

## Data Loading Issues

### "Data not loading" or "Infinite loading"

**Problem**: Supabase query failing

**Solutions**:
1. Open browser console (F12)
2. Check Network tab for errors
3. Common issues:
   - Table name typo
   - Wrong column name
   - RLS policy blocking
   - Not authenticated
4. Test query in Supabase Dashboard → SQL Editor

### "Cannot read property of undefined"

**Problem**: Data structure mismatch

**Solution**:
```typescript
// Use optional chaining
const value = data?.field;

// Or provide defaults
const items = data || [];
```

---

## Deployment Issues

### "Vercel deployment failed"

**Problem**: Build or deploy error

**Solutions**:
1. Check Vercel deployment logs
2. Verify environment variables set in Vercel
3. Test build locally first:
   ```bash
   npm run build
   npm start
   ```
4. Check for build errors in logs

### "Production site not working but local works"

**Problem**: Environment configuration mismatch

**Solutions**:
1. Verify all env vars set in Vercel
2. Update `NEXT_PUBLIC_APP_URL` to production URL
3. Add production URL to Supabase redirect URLs
4. Check Vercel function logs

---

## Performance Issues

### "Slow page loads"

**Solutions**:
1. Check browser Network tab
2. Optimize images
3. Add loading states
4. Consider pagination for large lists

### "High database usage"

**Solutions**:
1. Check for N+1 queries
2. Add proper indexes
3. Use `.select()` to limit columns
4. Add pagination with `.limit()`

---

## Common Error Messages

### "Failed to fetch"

**Causes**:
- Network error
- Supabase URL wrong
- CORS issue

**Solution**: Check environment variables and network

### "401 Unauthorized"

**Causes**:
- Not signed in
- Session expired
- Invalid token

**Solution**: Sign in again

### "403 Forbidden"

**Causes**:
- RLS policy denying access
- Wrong user role

**Solution**: Check RLS policies and user role

### "500 Internal Server Error"

**Causes**:
- Server-side error
- Database error
- API route error

**Solution**: Check server logs and API route code

---

## Getting Additional Help

### Browser Console

Always check browser console (F12) for:
- JavaScript errors
- Network errors
- Warning messages

### Supabase Logs

Check Supabase Dashboard → Logs for:
- Database queries
- Authentication attempts
- Errors

### Vercel Logs

In Vercel Dashboard → Deployments → [Your Deploy] → Logs

### Common Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stack Overflow](https://stackoverflow.com)
- [GitHub Issues](https://github.com/vercel/next.js/issues)

---

## Debug Checklist

When something isn't working:

- [ ] Check browser console for errors
- [ ] Verify environment variables are set
- [ ] Confirm database schema is created
- [ ] Test authentication is working
- [ ] Check network tab in dev tools
- [ ] Review recent code changes
- [ ] Restart development server
- [ ] Clear browser cache
- [ ] Check Supabase logs
- [ ] Test in incognito/private window

---

## Prevention Tips

1. **Always restart dev server** after changing env variables
2. **Check browser console** before asking for help
3. **Test queries** in Supabase SQL Editor first
4. **Use TypeScript** - catches many errors early
5. **Keep dependencies updated** (carefully)
6. **Use version control** (Git) - easy rollback
7. **Test locally** before deploying
8. **Read error messages** carefully - they usually tell you what's wrong

---

## Still Stuck?

1. Read the error message carefully
2. Search the error message online
3. Check this guide again
4. Review relevant documentation:
   - SETUP.md for setup issues
   - FEATURES.md for feature questions
   - ARCHITECTURE.md for technical questions
5. Check project code comments
6. Create minimal reproduction
7. Ask for help with specific error details

## Error Message Template

When asking for help, include:

```
**What I'm trying to do:**
[Your goal]

**What I expected:**
[Expected behavior]

**What actually happened:**
[Actual behavior]

**Error message:**
[Full error message]

**Steps taken:**
1. [Step 1]
2. [Step 2]

**Environment:**
- OS: Windows
- Node version: [run: node --version]
- Browser: [Chrome/Firefox/Safari]

**Screenshots:**
[If applicable]
```

This helps others help you faster!
