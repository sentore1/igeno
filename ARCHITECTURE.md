# Platform Architecture

## Overview

The Care & Igeno Platform is built as a modern, modular web application using Next.js 16 with the App Router, TypeScript, and Supabase for backend services.

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: Next.js App Router (file-based routing)

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **API**: Next.js Route Handlers
- **Real-time**: Supabase Realtime (optional)
- **Storage**: Supabase Storage (for future file uploads)

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database Hosting**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **SSL**: Automatic via hosting platform

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  (Browser - React Components with Tailwind CSS)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │    API      │  │ Middleware  │        │
│  │  (Routes)   │  │  (Routes)   │  │  (Security) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │   Auth       │  │   Storage    │     │
│  │  Database    │  │   Service    │  │   (Future)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
care-igeno-platform/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── signin/               # Sign in page
│   │   └── signup/               # Sign up page
│   ├── care/                     # Division A - Care Management
│   │   ├── booking/              # Service booking
│   │   └── page.tsx              # Care landing page
│   ├── academy/                  # Division B - LMS
│   │   ├── courses/              # Course catalog
│   │   └── page.tsx              # Academy landing page
│   ├── dashboard/                # User dashboards
│   │   └── page.tsx              # Main dashboard
│   ├── api/                      # API routes
│   │   └── notifications/        # Notifications API
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # Reusable components
│   ├── Navigation.tsx            # Main navigation
│   └── LoadingSpinner.tsx        # Loading component
├── lib/                          # Utilities and configs
│   ├── supabase-client.ts        # Supabase client setup
│   ├── auth.ts                   # Authentication helpers
│   └── types.ts                  # TypeScript types
├── scripts/                      # Database scripts
│   └── seed-sample-data.sql      # Sample data seeder
├── supabase-schema.sql           # Database schema
├── middleware.ts                 # Next.js middleware
└── [config files]                # Various config files
```

## Data Models

### Division A (Care Management)

#### Profiles
- Extends Supabase auth.users
- Stores user role and profile info
- One-to-one with auth.users

#### Clients
- One-to-one with user profile (for client role)
- Stores client-specific information
- Links to bookings

#### Caregivers
- One-to-one with user profile (for caregiver role)
- Stores specializations and availability
- Links to bookings

#### Bookings
- Many-to-one with clients
- Many-to-one with caregivers
- Tracks service appointments

### Division B (LMS)

#### Courses
- Created by trainers
- Contains metadata and category
- Links to lessons

#### Lessons
- Belongs to one course
- Ordered content
- Can have video URL

#### Enrollments
- Many-to-many (users ↔ courses)
- Tracks progress
- Links to certificates

#### Quizzes
- Belongs to one lesson
- JSON structure for questions
- Links to attempts

#### Certificates
- One per user per completed course
- Generated upon course completion

### Shared

#### Payments
- Tracks all financial transactions
- Links to bookings or courses
- Supports multiple payment methods

#### Notifications
- User-specific messages
- Supports different types
- Read/unread status

## Authentication Flow

```
1. User visits site
2. Clicks Sign Up/Sign In
3. Enters credentials
4. Supabase Auth validates
5. Session created
6. Profile loaded from database
7. User redirected to dashboard
8. Role-based content displayed
```

## Data Flow

### Client-Side
```
Component → Supabase Client → Supabase API → Database
                ↓
         Update UI State
```

### Server-Side (API Routes)
```
Client Request → API Route → Supabase Admin Client → Database
                                      ↓
                              Return Response
```

## Security Model

### Row-Level Security (RLS)
- Enabled on all tables
- Users can only access their own data
- Admins have elevated permissions
- Policies defined in supabase-schema.sql

### Authentication
- JWT-based authentication via Supabase
- Secure HTTP-only cookies
- Session management
- Role verification

### API Security
- Bearer token authentication
- Request validation
- Error sanitization
- Rate limiting (via hosting platform)

## Database Schema

### Key Relationships

```
auth.users (Supabase)
    ↓
profiles (1:1)
    ↓
├── clients (1:1 for client role)
│   └── bookings (1:N)
│       └── caregivers (N:1)
│
├── caregivers (1:1 for caregiver role)
│   └── bookings (1:N)
│
└── enrollments (N:N with courses)
    └── courses
        └── lessons
            ├── resources
            └── quizzes
                └── quiz_attempts
```

## Scalability Considerations

### Database
- Supabase handles connection pooling
- Indexes on frequently queried columns
- Pagination for large result sets
- Consider read replicas for high traffic

### Application
- Server-side rendering for SEO
- Client-side routing for speed
- Image optimization via Next.js
- Code splitting automatic

### Caching Strategy
- Static pages cached at CDN
- API responses cached where appropriate
- Consider Redis for session storage at scale

## Development Workflow

### Local Development
```bash
1. npm install           # Install dependencies
2. Configure .env.local  # Set environment variables
3. npm run dev          # Start dev server
4. Make changes         # Edit code
5. Test locally         # Verify changes
6. Commit to Git        # Version control
```

### Deployment
```bash
1. Push to Git          # Commit changes
2. Vercel auto-deploys  # CI/CD pipeline
3. Run migrations       # Update database if needed
4. Verify deployment    # Check production
```

## Performance Optimization

### Frontend
- Lazy loading components
- Image optimization
- Minification and compression
- Tree shaking

### Backend
- Efficient database queries
- Proper indexing
- Query result caching
- Connection pooling

### Network
- CDN for static assets
- Gzip compression
- HTTP/2
- Edge functions for global performance

## Monitoring & Logging

### Application
- Vercel Analytics (page views, performance)
- Error tracking (consider Sentry)
- User analytics (consider Google Analytics)

### Database
- Supabase Dashboard (query performance)
- Connection monitoring
- Slow query logs
- Resource usage

## Future Enhancements

### Technical
- Add Redis for caching
- Implement full-text search
- Add WebSocket for real-time features
- Queue system for background jobs

### Features
- Mobile apps (React Native)
- Video streaming infrastructure
- Payment gateway integration
- Advanced reporting with data warehouse

## Testing Strategy

### Recommended Approach
- **Unit Tests**: Jest for utilities
- **Integration Tests**: Testing Library for components
- **E2E Tests**: Playwright or Cypress
- **API Tests**: Supertest for API routes

### Testing Structure (Future)
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/            # End-to-end tests
```

## Dependencies

### Core
- next: Web framework
- react: UI library
- typescript: Type safety

### Supabase
- @supabase/supabase-js: Client library
- @supabase/auth-helpers-nextjs: Auth integration

### Styling
- tailwindcss: Utility-first CSS
- postcss: CSS processing

### Development
- eslint: Code linting
- typescript: Type checking

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key
- `SUPABASE_SERVICE_ROLE_KEY`: Admin API key (server-only)
- `NEXT_PUBLIC_APP_URL`: Application URL

### Optional (Future)
- `STRIPE_SECRET_KEY`: Payment processing
- `SMTP_*`: Email configuration
- `REDIS_URL`: Caching layer

## API Design

### RESTful Principles
- Use HTTP methods correctly (GET, POST, PATCH, DELETE)
- Consistent URL structure
- JSON request/response
- Proper status codes

### Example Endpoints
```
GET    /api/notifications     # List notifications
POST   /api/notifications     # Create notification
PATCH  /api/notifications     # Update notification
```

## Deployment Architecture

### Production Setup
```
┌─────────────┐
│   Vercel    │ ← Application hosting
└─────────────┘
       │
       ↓
┌─────────────┐
│  Supabase   │ ← Database & Auth
└─────────────┘
```

### CDN & Edge
- Static assets served from edge
- API routes run on serverless functions
- Automatic scaling based on traffic

## Support & Documentation

For more details, see:
- README.md - Overview and introduction
- SETUP.md - Detailed setup instructions
- FEATURES.md - Feature documentation
- DEPLOYMENT.md - Deployment guide
- QUICKSTART.md - Quick start guide
