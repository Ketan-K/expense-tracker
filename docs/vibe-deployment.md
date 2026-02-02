# Vibe Finance - Deployment Guide

## Overview

Vibe Finance is a Gen Z-focused financial wellness app built as a separate themed deployment of the expense tracker application. It features:

- **Brand Name**: Vibe Finance
- **Tagline**: Money Moves Only 💸
- **Theme**: Purple-to-pink gradient with modern Gen Z aesthetics
- **Fonts**: Space Grotesk (headings) + Inter (body)
- **Database**: Separate IndexedDB (`VibeFinanceDB_v1`) and MongoDB database

---

## Quick Start - Local Development

### Run Vibe Finance Theme Locally

```bash
# Development mode
npm run dev:vibe

# Build for production
npm run build:vibe

# Start production server
npm run start:vibe
```

The app will run with:

- Vibe Finance branding and colors
- Gen Z terminology (Feed, Spent, Gains, IOUs, Squad, etc.)
- Purple-pink gradient theme
- Separate local database (VibeFinanceDB_v1)

---

## Separate Vercel Deployment Setup

### Step 1: Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import the same GitHub repository
4. Name the project: `vibe-finance`
5. Configure root directory: `./` (same as main project)

### Step 2: Configure Environment Variables

Add these environment variables in Vercel project settings:

#### Required Variables

```env
# Theme Selection
NEXT_PUBLIC_THEME=vibe

# MongoDB Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/vibe-finance?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=https://vibe-finance.vercel.app
NEXTAUTH_SECRET=<generate-new-secret-here>

# Google OAuth Credentials (CREATE NEW ONES)
GOOGLE_CLIENT_ID=<new-vibe-finance-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<new-vibe-finance-client-secret>

# Admin Access
ADMIN_EMAILS=your-email@example.com,admin@vibefinance.com
```

#### Optional Analytics Variables

```env
# Google Analytics (optional)
NEXT_PUBLIC_GA_ID_VIBE=G-XXXXXXXXXX

# Sentry Error Tracking (optional)
NEXT_PUBLIC_SENTRY_DSN_VIBE=https://...@sentry.io/...
```

### Step 3: Configure Build Settings

**Build Command:**

```bash
npm run build:vibe
```

**Output Directory:**

```
.next
```

**Install Command:**

```bash
npm install
```

**Node Version:**

```
18.x or higher
```

### Step 4: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a **new project** named "Vibe Finance"
3. Enable Google+ API
4. Configure OAuth consent screen:
   - App name: **Vibe Finance**
   - User support email: your-email@example.com
   - App logo: Upload Vibe Finance logo
   - App domain: https://vibe-finance.vercel.app
   - Privacy Policy URL: https://vibe-finance.vercel.app/privacy
   - Terms of Service URL: https://vibe-finance.vercel.app/terms

5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Name: Vibe Finance Web Client
   - Authorized redirect URIs:
     - `https://vibe-finance.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for local dev)

6. Copy Client ID and Client Secret to Vercel environment variables

### Step 5: Create MongoDB Database

#### Option A: New MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster or use existing
3. Create a new database named `vibe-finance`
4. Create a database user with read/write access
5. Whitelist Vercel IP addresses (or use 0.0.0.0/0 for development)
6. Get connection string and add to `MONGODB_URI`

#### Option B: Separate Database in Existing Cluster

```
mongodb+srv://user:password@cluster.mongodb.net/vibe-finance?retryWrites=true&w=majority
                                                    ↑ Database name
```

### Step 6: Generate NEXTAUTH_SECRET

```bash
# Generate a secure random secret
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in Vercel environment variables.

### Step 7: Deploy

1. Push code to GitHub
2. Vercel will automatically deploy
3. Wait for deployment to complete
4. Visit your site: `https://vibe-finance.vercel.app`

### Step 8: Initialize Database Indexes

After first deployment:

1. Visit: `https://vibe-finance.vercel.app/admin`
2. Sign in with your admin email
3. Click "Ensure MongoDB Indexes"
4. Wait for confirmation

---

## Custom Domain Setup (Optional)

### Add Custom Domain

1. In Vercel project settings, go to "Domains"
2. Add your custom domain (e.g., `vibefinance.app`)
3. Follow Vercel's DNS configuration instructions
4. Update environment variables:
   - `NEXTAUTH_URL=https://vibefinance.app`
5. Update Google OAuth redirect URIs:
   - Add `https://vibefinance.app/api/auth/callback/google`

---

## Post-Deployment Tasks

### 1. Update Manifest.json for PWA

Create a theme-specific manifest by modifying `public/manifest.json`:

```json
{
  "name": "Vibe Finance",
  "short_name": "Vibe",
  "description": "Stack your cash and track your financial vibe",
  "theme_color": "#8B5CF6",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "orientation": "portrait"
}
```

### 2. Generate Brand Assets

Generate these assets for production:

**Required Files:**

- `public/favicon-vibe.ico` (16x16, 32x32, 48x48)
- `public/apple-touch-icon-vibe.png` (180x180)
- `public/og-image-vibe.png` (1200x630)
- `public/icon-192x192.png` (for PWA)
- `public/icon-512x512.png` (for PWA)

See `src/themes/vibe/assets/README.md` for generation instructions.

### 3. Test PWA Installation

1. Visit the site on mobile
2. Look for "Add to Home Screen" prompt
3. Install and verify:
   - Correct app name ("Vibe Finance")
   - Correct icon
   - Purple theme color
   - Offline functionality works

### 4. Update CORS Configuration

If using a custom domain, update `src/lib/cors.ts`:

```typescript
allowedOrigins: [
  process.env.NEXTAUTH_URL || "http://localhost:3000",
  "https://vibefinance.app",  // Add your domain
],
```

---

## Testing Checklist

Before going live, verify:

### Authentication

- [ ] Google Sign In works
- [ ] User session persists across page refreshes
- [ ] Sign out works correctly

### Branding

- [ ] App displays "Vibe Finance" in header
- [ ] Tagline shows "Money Moves Only 💸"
- [ ] Purple-pink gradient theme loads correctly
- [ ] Modern fonts (Space Grotesk + Inter) load

### Terminology

- [ ] Navigation shows: Feed, Spent, Gains, IOUs, Squad, Settings
- [ ] Greetings use Gen Z terms (Morning Vibes, etc.)
- [ ] Stats show: Total Burned, Total Secured, etc.
- [ ] Buttons use: Drop, Lock In, Nah, etc.

### Database

- [ ] Expenses save correctly
- [ ] Income records work
- [ ] Loans/IOUs function properly
- [ ] Offline mode works (IndexedDB)
- [ ] Online sync works (MongoDB)
- [ ] Data doesn't mix with main expense tracker

### PWA

- [ ] Can install as app on mobile
- [ ] Works offline
- [ ] Service worker caches correctly
- [ ] App icon displays correctly

---

## Troubleshooting

### Issue: OAuth Error "Redirect URI mismatch"

**Solution:**

1. Check Google OAuth settings
2. Ensure redirect URI exactly matches: `https://your-domain.com/api/auth/callback/google`
3. No trailing slash
4. HTTPS in production, HTTP only for localhost

### Issue: Database Connection Failed

**Solution:**

1. Check MongoDB connection string format
2. Verify database name is `vibe-finance`
3. Check Network Access in MongoDB Atlas
4. Whitelist Vercel IPs or use 0.0.0.0/0

### Issue: Theme Not Loading

**Solution:**

1. Verify `NEXT_PUBLIC_THEME=vibe` in Vercel environment variables
2. Rebuild the project
3. Clear browser cache
4. Check browser console for errors

### Issue: Wrong Database Being Used

**Solution:**

1. Check `NEXT_PUBLIC_THEME=vibe` is set
2. Verify `MONGODB_URI` points to `vibe-finance` database
3. Clear browser storage and IndexedDB
4. Hard refresh browser (Ctrl+Shift+R)

---

## Maintenance

### Updating Vibe Finance

Code updates apply automatically since it's the same codebase. Theme-specific changes:

1. Edit files in `src/themes/vibe/`
2. Update terminology in `src/themes/vibe/config.ts`
3. Commit and push to GitHub
4. Vercel auto-deploys

### Monitoring

Set up monitoring with:

- Vercel Analytics (built-in)
- Google Analytics (via `NEXT_PUBLIC_GA_ID_VIBE`)
- Sentry error tracking (via `NEXT_PUBLIC_SENTRY_DSN_VIBE`)

### Database Backups

Regular MongoDB backups recommended:

- Use MongoDB Atlas automated backups
- Or set up manual backup scripts
- Test restore procedure

---

## Cost Estimate

**Vercel (Hobby Plan - Free):**

- 1 project
- 100GB bandwidth/month
- Unlimited builds

**Vercel (Pro Plan - $20/month):**

- If you need more bandwidth
- Custom domains
- Team collaboration

**MongoDB Atlas (Free Tier - M0):**

- 512MB storage
- Shared cluster
- Good for up to ~10,000 users

**Total:** Free to start, scale as needed

---

## Support

For issues:

1. Check this deployment guide
2. Review Vercel deployment logs
3. Check MongoDB Atlas logs
4. Verify environment variables
5. Test with `npm run dev:vibe` locally first

---

## Summary

Vibe Finance is now a completely separate app with:
✅ Independent branding and design
✅ Gen Z-focused UI terminology
✅ Separate databases (IndexedDB + MongoDB)
✅ Own Google OAuth credentials
✅ Own Vercel deployment
✅ Custom domain support

Users of Vibe Finance will have a completely different experience from the default expense tracker, with no data sharing between the two apps.
