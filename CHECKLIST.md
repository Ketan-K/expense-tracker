# Pre-Launch Checklist

## 🔧 Before First Run

### 1. Environment Setup
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Add MongoDB Atlas connection string
- [ ] Add Google OAuth Client ID
- [ ] Add Google OAuth Client Secret
- [ ] Generate and add NEXTAUTH_SECRET (`openssl rand -base64 32`)
- [ ] Verify NEXTAUTH_URL is set to `http://localhost:3000`

### 2. External Services
- [ ] MongoDB Atlas cluster is created and running
- [ ] Database user with read/write permissions created
- [ ] IP whitelist configured (0.0.0.0/0 for development)
- [ ] Google OAuth consent screen configured
- [ ] OAuth redirect URI added: `http://localhost:3000/api/auth/callback/google`

### 3. Local Development
- [ ] Dependencies installed (`npm install`)
- [ ] No TypeScript errors (`npm run build` should work)
- [ ] Development server starts (`npm run dev`)
- [ ] Can access http://localhost:3000

## 🧪 Testing Checklist

### Authentication
- [ ] Sign in with Google works
- [ ] User redirected to dashboard after sign in
- [ ] Sign out works correctly
- [ ] Trying to access `/dashboard` without auth redirects to sign in

### Expense Management
- [ ] Can add new expense
- [ ] Expense appears in dashboard immediately
- [ ] Can view expense details
- [ ] Can edit expense
- [ ] Can delete expense
- [ ] Categories load correctly
- [ ] Quick amount buttons work

### Offline Functionality
- [ ] Add expense while offline (in DevTools)
- [ ] Expense saved to IndexedDB
- [ ] Data syncs when back online
- [ ] Sync status indicator works

### Reports & Analytics
- [ ] Charts display correctly
- [ ] Category breakdown shows percentages
- [ ] Date range filter works
- [ ] CSV export downloads
- [ ] Excel export downloads with multiple sheets

### UI/UX
- [ ] Dark mode toggle works
- [ ] Theme persists on page reload
- [ ] Mobile responsive design works
- [ ] Bottom navigation on mobile
- [ ] Sidebar navigation on desktop
- [ ] Toast notifications appear
- [ ] Loading states display

### PWA
- [ ] Service worker registers
- [ ] Manifest is accessible
- [ ] Can install as PWA (Chrome: Install button in address bar)
- [ ] Works offline after installation

## 📱 Mobile Testing

### Chrome Mobile
- [ ] Sign in works on mobile
- [ ] Add expense form is mobile-friendly
- [ ] Bottom navigation works
- [ ] Charts render correctly
- [ ] PWA installation prompt appears
- [ ] Works after installation

### Safari iOS (if available)
- [ ] Sign in works
- [ ] Add to Home Screen works
- [ ] Offline functionality works

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] No console.errors in production build
- [ ] No TypeScript errors
- [ ] All API routes have proper error handling
- [ ] Proper loading states in UI

### Security
- [ ] Environment variables not committed to git
- [ ] MongoDB connection string secure
- [ ] OAuth credentials secure
- [ ] API routes have authentication checks

### Performance
- [ ] Images optimized (if any added)
- [ ] PWA icons created (192x192, 512x512)
- [ ] Service worker caching configured
- [ ] Lighthouse score checked (optional)

### Vercel Deployment
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added to Vercel
- [ ] NEXTAUTH_URL updated to production domain
- [ ] Google OAuth redirect URI updated for production
- [ ] MongoDB IP whitelist includes 0.0.0.0/0
- [ ] Test deployment successful
- [ ] Production deployment successful

## 🎨 Optional Enhancements

### PWA Icons
- [ ] Create icon-192x192.png
- [ ] Create icon-512x512.png
- [ ] Create favicon.ico
- [ ] Update manifest colors to match brand

### MongoDB Indexes
- [ ] Create index: `expenses (userId, date)`
- [ ] Create index: `expenses (userId, category)`
- [ ] Create index: `categories (userId)`
- [ ] Create index: `budgets (userId, month)`
- [ ] Create TTL index: `sessions (expires)`

### Additional Features
- [ ] Add budget alerts
- [ ] Add expense categories customization UI
- [ ] Add data import from CSV
- [ ] Add recurring expenses
- [ ] Add receipt upload
- [ ] Add multi-currency support

## 📊 Monitoring (Post-Launch)

- [ ] Check error logs in Vercel
- [ ] Monitor MongoDB performance
- [ ] Check Google OAuth usage
- [ ] Review user feedback
- [ ] Monitor sync failures
- [ ] Check PWA installation rates

## 🐛 Known Limitations

- Sync queue retries max 3 times before giving up
- Server-wins conflict resolution (local changes may be overwritten)
- No real-time multi-device sync (requires page reload)
- PWA icons are placeholders (need custom icons)
- No email notifications for budget alerts
- No data encryption at rest (relies on MongoDB Atlas encryption)

---

**Status: Ready for Testing! ✅**

Start with the "Before First Run" section and work your way down.
