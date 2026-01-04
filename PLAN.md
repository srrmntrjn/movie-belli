# Movie Belli - Implementation Plan (Infrastructure-First Approach)

## 🎉 PROGRESS UPDATE (January 3, 2026)

### ✅ COMPLETED - Phase 1 Infrastructure Setup

**External Services Configured:**
- ✅ Supabase PostgreSQL database with connection pooling
- ✅ Vercel hosting and deployment (https://movie-belli.vercel.app)
- ✅ TMDB API access configured
- ✅ Google OAuth credentials created and configured
- ✅ All environment variables added to Vercel

**Application Setup:**
- ✅ Next.js 15 initialized with TypeScript, Tailwind CSS, App Router
- ✅ Prisma ORM configured with complete database schema (13 models)
- ✅ Database schema deployed to Supabase
- ✅ NextAuth.js v5 authentication implemented
- ✅ Production build verified successfully

**Pages Implemented:**
- ✅ Home page with Movie Belli branding and Google sign-in
- ✅ Protected dashboard page showing user info and infrastructure status
- ✅ NextAuth API routes configured

**CI/CD & Deployment:**
- ✅ GitHub Actions workflow configured (lint, type-check, build)
- ✅ Vercel environment variables configured
- ⏳ **NEXT**: Deploy to production and validate authentication flow

**Repository**: https://github.com/srrmntrjn/movie-belli
**Production URL**: https://movie-belli.vercel.app

---

## Overview

Building a web application (Next.js) inspired by the Beli restaurant app, but for movies. Core features: Track (watchlist/watched), Share (social features with friends), and Reviews & Ratings. Using TMDB API for movie data and social login (Google/Apple) for authentication.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Server Components + Zustand + TanStack Query

### Backend
- **Runtime**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5

### Infrastructure & Services
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL + Storage)
- **Authentication Provider**: Google OAuth
- **Movie Data**: TMDB API

## PHASE 1: Infrastructure & Production Setup (PRIORITY)

**Goal**: Set up all production infrastructure and deployment pipeline before writing any feature code.

### Step 1.1: Create and Configure External Services

**Supabase Setup**:
1. Create Supabase project at https://supabase.com
2. Note down:
   - Database URL (connection string)
   - Project URL
   - Anon public key
   - Service role key
3. Configure database settings:
   - Enable connection pooling
   - Set up database backups
   - Configure database timezone

**Vercel Setup**:
1. Create Vercel account/organization
2. Import GitHub repository
3. Configure project settings:
   - Framework preset: Next.js
   - Build command: `next build`
   - Output directory: `.next`
   - Install command: `pnpm install`
4. Set up production and preview environments
5. Configure custom domain (optional for now)

**TMDB API**:
1. Sign up at https://www.themoviedb.org/signup
2. Request API key at https://www.themoviedb.org/settings/api
3. Get both API Key (v3) and Access Token (v4)
4. Note rate limits: 40 requests per 10 seconds

**Google OAuth Setup**:
1. Go to https://console.cloud.google.com
2. Create new project "Movie Belli"
3. Enable Google+ API
4. Configure OAuth consent screen:
   - User type: External
   - App name: Movie Belli
   - Scopes: email, profile
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://your-domain.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for dev)
6. Note Client ID and Client Secret

### Step 1.2: Environment Variables Configuration

Create comprehensive `.env.example` file with all required variables:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # For Prisma migrations

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# NextAuth
NEXTAUTH_URL="https://movie-belli.vercel.app"
NEXTAUTH_SECRET="..." # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."

# TMDB API
TMDB_API_KEY="..."
TMDB_ACCESS_TOKEN="..."
```

**Action Items**:
- Create `.env.local` for local development
- Add all environment variables to Vercel project settings
- Document each variable in README
- Never commit actual values to git

### Step 1.3: Initialize Next.js Project with Production Config

**Project Initialization**:
```bash
# Create Next.js app
npx create-next-app@latest movie-belli \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

# Set up pnpm
npm install -g pnpm
pnpm install
```

**Install Core Dependencies**:
```bash
# Database & Auth
pnpm add @prisma/client @auth/prisma-adapter next-auth@beta
pnpm add -D prisma

# State & Data Fetching
pnpm add @tanstack/react-query zustand

# Forms & Validation
pnpm add react-hook-form zod @hookform/resolvers

# UI Components
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-avatar @radix-ui/react-slot
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react

# Utilities
pnpm add date-fns

# Development
pnpm add -D @types/node eslint prettier
pnpm add -D husky lint-staged
```

**Configure Production Settings**:

`next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
```

### Step 1.4: Database Setup with Prisma

**Initialize Prisma**:
```bash
npx prisma init
```

**Configure Prisma Schema** (`prisma/schema.prisma`):
- Set up all models (User, Account, Session, WatchlistItem, WatchedMovie, Rating, Review, Friendship, etc.)
- Configure proper indexes for performance
- Set up relations correctly
- Include NextAuth required models

**Database Migrations**:
```bash
# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

**Production Database Setup**:
```bash
# Deploy migrations to production
npx prisma migrate deploy
```

### Step 1.5: Configure Authentication (NextAuth.js)

**NOTE**: This section needs more detailed implementation steps. Will be expanded with specific code and configuration details.

**Create auth configuration** (`src/lib/auth.ts`):
- Configure PrismaAdapter
- Set up Google provider
- Configure session strategy
- Add custom callbacks for user data
- Set up custom sign-in page

**Create auth API route** (`src/app/api/auth/[...nextauth]/route.ts`):
- Export GET and POST handlers
- Use authOptions configuration

**Test authentication flow**:
- Local login with Google
- Verify session persistence
- Check database user creation

### Step 1.6: Configure CI/CD Pipeline

**NOTE**: This section needs more detailed implementation steps. Will be expanded with specific configuration and workflow details.

**GitHub Actions** (`.github/workflows/ci.yml`):
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run type-check
      - run: pnpm run build
```

**Vercel Deployment**:
- Auto-deploy on push to main (production)
- Deploy preview for all PRs
- Set up deployment protection rules
- Configure environment variables per environment

### Step 1.7: Create Minimal Deployable Application

**NOTE**: This section needs more detailed implementation steps. Will be expanded with specific code for pages and components.

**Goal**: Deploy a "Hello World" version with auth that proves infrastructure works.

**Required pages**:
1. `/` - Home page with "Sign in with Google" button
2. `/api/auth/[...nextauth]` - Auth endpoints
3. `/dashboard` - Protected page showing user info (proves auth works)

**Verification checklist**:
- [ ] App deploys to Vercel successfully
- [ ] Google OAuth login works in production
- [ ] User data saves to Supabase database
- [ ] Session persists across page reloads
- [ ] Environment variables are properly configured
- [ ] HTTPS works correctly
- [ ] Custom domain configured (if applicable)

### Step 1.8: Infrastructure Testing & Validation

**NOTE**: This section needs more detailed testing steps and acceptance criteria. Will be expanded with specific test cases and validation procedures.

**Database Testing**:
- [ ] Verify connection pooling works under load
- [ ] Test database migrations rollback
- [ ] Verify backup restoration process
- [ ] Check query performance with indexes

**Authentication Testing**:
- [ ] Test OAuth flow in production
- [ ] Verify session expiration and refresh
- [ ] Test logout functionality
- [ ] Check edge cases (new user, existing user)

**Deployment Testing**:
- [ ] Test preview deployments from PRs
- [ ] Verify production deployment process
- [ ] Check rollback capability
- [ ] Validate environment variable precedence

**Performance Baseline**:
- [ ] Run Lighthouse audit (target: >90)
- [ ] Measure initial page load time
- [ ] Check Time to First Byte (TTFB)
- [ ] Verify Edge Network is working

## PHASE 2: Core Feature Implementation

**NOTE**: This phase requires a more detailed plan. We will come back to create detailed implementation plans for each feature area after Phase 1 infrastructure is complete.

Once infrastructure is solid, implement features in this order:

### 2.1 TMDB Integration & Movie Discovery
- Set up TMDB API client
- Create movie search functionality
- Build movie detail pages
- Implement caching strategy

### 2.2 Track Features (Watchlist & Watched)
- Watchlist CRUD operations
- Watched movies tracking
- User dashboard with lists
- Server actions for state management

### 2.3 Ratings & Reviews
- Star rating component
- Review creation form
- Review display and listing
- Aggregate rating calculations

### 2.4 Social Features
- Friend request system
- Activity feed
- User profiles
- Friend-based recommendations

### 2.5 Polish & Optimization
- Loading states and skeletons
- Error boundaries
- Mobile responsiveness
- Accessibility improvements
- Performance optimization

## Critical Files for Phase 1

```
movie-belli/
├── .env.example                          # All environment variables documented
├── .github/workflows/ci.yml              # CI pipeline
├── next.config.js                        # Production configuration
├── prisma/
│   └── schema.prisma                     # Complete database schema
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/
│   │   │   └── route.ts                  # Auth endpoints
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Protected test page
│   │   ├── page.tsx                      # Home with login
│   │   └── layout.tsx                    # Root layout
│   └── lib/
│       ├── auth.ts                       # NextAuth configuration
│       └── prisma.ts                     # Prisma client singleton
└── README.md                             # Setup documentation
```

## Infrastructure Costs Estimate

**Free Tier (Suitable for MVP)**:
- Vercel: Free for hobby projects, $20/mo for Pro
- Supabase: Free tier includes 500MB database, 1GB storage
- TMDB API: Free with attribution
- Google OAuth: Free
- Total: $0-20/month initially

**Scaling Considerations**:
- Supabase Pro: $25/mo (8GB database, 100GB storage)
- Vercel Pro: $20/mo per member
- CDN bandwidth costs scale with usage

## Success Criteria for Phase 1

Before moving to Phase 2, verify:

- [ ] All external services created and configured
- [ ] Environment variables documented and set up
- [ ] Next.js app initialized with TypeScript + Tailwind
- [ ] Database schema deployed to Supabase
- [ ] Google OAuth working in production
- [ ] Minimal app deployed to Vercel
- [ ] User can sign in and data saves to database
- [ ] CI/CD pipeline runs successfully
- [ ] Performance baseline established (Lighthouse >90)
- [ ] Documentation updated with setup steps

## Next Steps After Infrastructure Setup

Once Phase 1 is complete and infrastructure is proven:

1. **Implement TMDB Integration**: Build movie search and detail pages
2. **Create Core UI Components**: Movie cards, navigation, layouts
3. **Build Track Features**: Watchlist and watched functionality
4. **Add Social Layer**: Friends and activity feed
5. **Polish & Launch**: Final optimizations and public release

---

**Estimated Timeline**:
- Phase 1 (Infrastructure): 2-3 days
- Phase 2-5 (Features): 4-6 weeks
- Total: ~6-7 weeks to production-ready MVP

This approach ensures we have a solid, scalable foundation before writing feature code, reducing technical debt and deployment issues later.
