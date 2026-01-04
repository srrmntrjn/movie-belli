# Vercel Deployment Checklist

## Required Environment Variables

Make sure ALL of these are set in your Vercel project settings:

### Database
- ✅ `DATABASE_URL` - Direct connection (port 5432, no pgbouncer parameter)
  - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
- ✅ `DIRECT_URL` - Same as DATABASE_URL (for Prisma migrations)

### NextAuth
- ✅ `NEXTAUTH_URL` - Your production URL
  - Format: `https://your-app-name.vercel.app`
  - ⚠️ **CRITICAL**: Must match your actual Vercel deployment URL exactly
- ✅ `NEXTAUTH_SECRET` - Random secret string
  - Generate with: `openssl rand -base64 32`

### Google OAuth
- ✅ `GOOGLE_CLIENT_ID` - From Google Cloud Console
- ✅ `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
  - ⚠️ Make sure authorized redirect URI includes: `https://your-app-name.vercel.app/api/auth/callback/google`

### Optional (if used)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TMDB_API_KEY`
- `TMDB_ACCESS_TOKEN`

## Common Issues

1. **404 Error**: Usually means:
   - Missing `NEXTAUTH_URL` or it's set incorrectly
   - App is crashing on startup (check Vercel logs)
   - Database connection failing

2. **Check Vercel Logs**:
   - Go to your Vercel dashboard
   - Click on the deployment
   - Check "Runtime Logs" for errors

3. **Database Connection**:
   - Make sure `DATABASE_URL` uses port 5432 (not 6543)
   - Remove `?pgbouncer=true` parameter
   - Test connection locally first

## Verification Steps

1. ✅ Build succeeds (you've confirmed this)
2. ⚠️ Check Vercel runtime logs for errors
3. ⚠️ Verify all environment variables are set
4. ⚠️ Test the root URL: `https://your-app.vercel.app/`
5. ⚠️ Test auth endpoint: `https://your-app.vercel.app/api/auth/providers`

