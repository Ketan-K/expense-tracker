# Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up MongoDB Atlas:**
   - Create a free account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Create a database user with read/write permissions
   - Get your connection string from "Connect" → "Connect your application"

3. **Set up Google OAuth:**
   - Go to https://console.cloud.google.com/
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

4. **Create .env.local file:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` and add your credentials:
   - MONGODB_URI: Your MongoDB connection string
   - NEXTAUTH_SECRET: Generate with `openssl rand -base64 32`
   - GOOGLE_CLIENT_ID: From Google OAuth
   - GOOGLE_CLIENT_SECRET: From Google OAuth

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000

## MongoDB Indexes (Optional but Recommended)

Once you have some data, create these indexes for better performance:

```javascript
// In MongoDB Compass or Atlas UI
db.expenses.createIndex({ userId: 1, date: -1 })
db.expenses.createIndex({ userId: 1, category: 1 })
db.categories.createIndex({ userId: 1 })
db.budgets.createIndex({ userId: 1, month: -1 })
db.sessions.createIndex({ expires: 1 }, { expireAfterSeconds: 0 })
```

## PWA Icons

For production, add these icon files to the `public` folder:
- icon-192x192.png (192x192 pixels)
- icon-512x512.png (512x512 pixels)
- favicon.ico

You can create these from any image using online tools or:
```bash
npm install -g pwa-asset-generator
pwa-asset-generator logo.png public/icons
```

## Deployment to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com and import your repository
3. Add environment variables in Vercel dashboard (same as .env.local)
4. Update NEXTAUTH_URL to your Vercel domain
5. Update Google OAuth redirect URI to include your Vercel domain
6. Deploy!

## Testing Offline Functionality

1. Open the app in Chrome
2. Open DevTools → Application → Service Workers
3. Check "Offline" checkbox
4. Try adding expenses - they should save locally
5. Uncheck "Offline" - data should sync automatically

## Troubleshooting

**"MongoDB connection error"**
- Check your MONGODB_URI is correct
- Ensure your IP is whitelisted in MongoDB Atlas
- For Vercel, whitelist 0.0.0.0/0

**"Google OAuth error"**
- Verify redirect URI matches exactly
- Check Google Client ID and Secret are correct
- Ensure OAuth consent screen is configured

**"Data not syncing"**
- Check browser console for errors
- Verify you're logged in
- Check network tab for API call failures

**"PWA not installing"**
- Ensure you're using HTTPS (or localhost)
- Check manifest.json is accessible
- Verify service worker is registered in DevTools

Need help? Open an issue on GitHub!
