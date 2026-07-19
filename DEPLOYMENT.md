# Deployment Guide

Deploy your Care & Igeno Platform to production.

## Recommended: Vercel Deployment

Vercel is the easiest way to deploy Next.js applications.

### Prerequisites
- GitHub/GitLab/Bitbucket account
- Supabase project set up
- Code pushed to Git repository

### Steps

#### 1. Push to Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

#### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your Git repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

#### 3. Add Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### 4. Configure Supabase for Production

In your Supabase dashboard:

1. **Authentication** → **URL Configuration**
   - Add your Vercel URL to **Redirect URLs**:
     ```
     https://your-domain.vercel.app/**
     ```

2. **API Settings**
   - Verify RLS policies are enabled
   - Review security rules

#### 5. Deploy
- Vercel will auto-deploy on every push to main branch
- Or click **Deploy** in Vercel dashboard

#### 6. Verify Deployment
1. Visit your deployed URL
2. Test sign up/sign in
3. Test care booking
4. Test course browsing
5. Check dashboard

✅ **You're live!**

---

## Alternative: Netlify

### Deploy to Netlify

1. Push code to Git
2. Go to [netlify.com](https://netlify.com)
3. Click **Add new site** → **Import from Git**
4. Select repository
5. Configure build:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variables (same as Vercel)
7. Deploy

---

## Alternative: AWS Amplify

### Deploy to AWS Amplify

1. Push code to Git
2. Go to AWS Amplify Console
3. Click **New app** → **Host web app**
4. Connect repository
5. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
6. Add environment variables
7. Deploy

---

## Custom Domain

### Vercel
1. Go to project **Settings** → **Domains**
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

### Update Supabase
- Add custom domain to Supabase redirect URLs
- Update `NEXT_PUBLIC_APP_URL` environment variable

---

## Production Checklist

### Before Deployment
- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Test authentication locally
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors
- [ ] .env.local not committed (in .gitignore)

### After Deployment
- [ ] Site loads correctly
- [ ] Authentication works
- [ ] Database connections work
- [ ] All pages accessible
- [ ] Forms submit correctly
- [ ] Mobile responsive
- [ ] SSL certificate active (HTTPS)

### Security
- [ ] RLS policies tested
- [ ] Service role key is secret
- [ ] CORS configured correctly
- [ ] Rate limiting considered
- [ ] Error messages don't expose sensitive info

### Performance
- [ ] Images optimized
- [ ] Lighthouse score checked
- [ ] Core Web Vitals acceptable
- [ ] API response times reasonable

---

## Database Production Setup

### Supabase Production

1. **Create Production Project**
   - Separate project from development
   - Use strong database password
   - Enable connection pooling

2. **Run Migrations**
   - Execute `supabase-schema.sql` in production
   - Verify all tables created

3. **Configure Backups**
   - Automatic daily backups (included)
   - Consider point-in-time recovery

4. **Security**
   - Review RLS policies
   - Enable realtime only where needed
   - Set up monitoring

---

## Monitoring & Maintenance

### Error Tracking
Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for usage stats

### Uptime Monitoring
- **Vercel Analytics** (built-in)
- **UptimeRobot** (external)
- **StatusCake**

### Performance Monitoring
- Vercel Speed Insights
- Google PageSpeed Insights
- Lighthouse CI

---

## Scaling Considerations

### Database
- **Supabase Pro** for more connections
- **Connection pooling** for high traffic
- **Read replicas** for read-heavy workloads

### Application
- **Vercel Edge Functions** for global performance
- **CDN** for static assets
- **Redis** for caching (if needed)

### Cost Optimization
- Monitor Supabase usage
- Optimize queries
- Use indexes appropriately
- Cache where possible

---

## Rollback Procedure

If deployment has issues:

### Vercel
1. Go to **Deployments**
2. Find previous working deployment
3. Click **...** → **Promote to Production**

### Database
1. Restore from Supabase backup
2. Or use point-in-time recovery

---

## CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test # if you have tests
      # Vercel handles deployment automatically
```

---

## Support & Resources

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Production Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## Getting Help

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables
4. Test Supabase connection
5. Review Supabase logs
