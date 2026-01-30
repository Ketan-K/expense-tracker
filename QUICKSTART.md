# Quick Start Guide

## Get Running in 5 Minutes! ⚡

### Step 1: Install (30 seconds)
```bash
npm install
```

### Step 2: Setup Environment (2 minutes)

**Create `.env.local` file:**
```bash
cp .env.local.example .env.local
```

**Edit `.env.local` and add:**

1. **MongoDB URI** (Get from MongoDB Atlas):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expenses
   ```

2. **NextAuth Secret** (Generate):
   ```bash
   openssl rand -base64 32
   ```
   Copy output to:
   ```
   NEXTAUTH_SECRET=<paste-here>
   ```

3. **Google OAuth** (Get from Google Console):
   ```
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxx
   ```

4. **URL**:
   ```
   NEXTAUTH_URL=http://localhost:3000
   ```

### Step 3: Run (10 seconds)
```bash
npm run dev
```

### Step 4: Open Browser
Visit: **http://localhost:3000**

---

## Need Help Setting Up Services?

### MongoDB Atlas (Free Forever)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create account → Create cluster (choose Free M0)
3. Create database user (username + password)
4. Network Access → Add IP: `0.0.0.0/0`
5. Connect → Copy connection string
6. Replace `<username>` and `<password>` in the string

### Google OAuth (Free)
1. Go to https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret

---

## First Time Using the App

1. **Sign In** - Click "Continue with Google"
2. **Add Expense** - Click the "+" tab at bottom
3. **View Dashboard** - See your spending overview
4. **Check Reports** - View charts and export data

---

## Common Issues

**"MongoDB connection failed"**
→ Check your IP is whitelisted: `0.0.0.0/0`

**"Google OAuth error"**
→ Verify redirect URI exactly matches: `http://localhost:3000/api/auth/callback/google`

**"Module not found"**
→ Run `npm install` again

**Port 3000 in use**
→ Run on different port: `npm run dev -- -p 3001`

---

## Test Offline Feature

1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Check "Offline"
4. Add an expense
5. Uncheck "Offline" - it syncs!

---

## Next Steps

- [ ] Add some expenses
- [ ] Create custom categories
- [ ] Set monthly budgets
- [ ] Export your data
- [ ] Install as PWA app
- [ ] Deploy to Vercel

**Enjoy tracking your expenses! 💰**

For detailed documentation, see:
- SETUP.md - Full setup guide
- IMPLEMENTATION.md - Technical details
- CHECKLIST.md - Complete testing checklist
