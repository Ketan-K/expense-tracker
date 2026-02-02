# Vibe Finance - Quick Reference

## 🚀 Quick Start

```bash
# Run locally
npm run dev:vibe

# Build for production
npm run build:vibe
```

---

## 🎨 Theme Details

**Name:** Vibe Finance  
**Tagline:** Money Moves Only 💸  
**Colors:** Purple (#8B5CF6) → Pink (#EC4899)  
**Fonts:** Space Grotesk + Inter  
**Database:** VibeFinanceDB_v1

---

## 📝 Gen Z Terminology

### Navigation

- Dashboard → **Feed**
- Expenses → **Spent**
- Income → **Gains**
- Loans → **IOUs**
- Contacts → **Squad**
- Profile → **Settings**

### Actions

- Add → **Drop**
- Edit → **Update**
- Delete → **Remove**
- Save → **Lock In**
- Cancel → **Nah**

### Money Terms

- Surplus → **You're Up 📈**
- Deficit → **You're Down 📉**
- Budget → **Spending Cap**
- Total Spent → **Total Burned 🔥**
- Total Income → **Total Secured 💰**

### Greetings

- Good Morning → **Morning Vibes ☀️**
- Good Afternoon → **Afternoon Check 🌤️**
- Good Evening → **Evening Recap 🌙**

---

## ⚙️ Environment Variables (Vercel)

```env
NEXT_PUBLIC_THEME=vibe
MONGODB_URI=mongodb+srv://...mongodb.net/vibe-finance
NEXTAUTH_URL=https://vibe-finance.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
GOOGLE_CLIENT_ID=<new-oauth-client>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<new-oauth-secret>
ADMIN_EMAILS=your-email@example.com
```

---

## 📁 Key Files

```
src/themes/vibe/
├── config.ts        # Theme & terminology config
└── theme.css        # Colors & fonts

src/lib/
└── terminology.ts   # Terminology utility

package.json         # Added vibe scripts
```

---

## ✅ Deployment Steps

1. **Create MongoDB database:** `vibe-finance`
2. **Set up Google OAuth** (new project)
3. **Create Vercel project:** `vibe-finance`
4. **Add environment variables**
5. **Set build command:** `npm run build:vibe`
6. **Deploy and test**
7. **Run `/admin` → Ensure Indexes**

---

## 🔍 Testing Checklist

- [ ] Theme loads (purple-pink gradient)
- [ ] Branding shows "Vibe Finance"
- [ ] Navigation uses Gen Z terms
- [ ] Greetings show with emojis
- [ ] Google OAuth works
- [ ] Offline mode works
- [ ] Separate database confirmed

---

## 📚 Documentation

- **Full Guide:** `VIBE-FINANCE-DEPLOYMENT.md`
- **Summary:** `VIBE-FINANCE-SUMMARY.md`
- **Assets:** `src/themes/vibe/assets/README.md`

---

## 🆘 Common Issues

**Theme not loading?**

```bash
# Check environment variable
echo $NEXT_PUBLIC_THEME  # Should be "vibe"

# Clear cache and rebuild
rm -rf .next
npm run build:vibe
```

**OAuth error?**

- Check redirect URI: `https://your-domain.com/api/auth/callback/google`
- No trailing slash!

**Wrong database?**

- Verify `MONGODB_URI` ends with `/vibe-finance`
- Check browser IndexedDB shows `VibeFinanceDB_v1`

---

## 🎯 Success!

When working correctly:
✅ Purple-pink theme everywhere  
✅ "Feed" instead of "Dashboard"  
✅ "Morning Vibes ☀️" greeting  
✅ "Drop" button to add expenses  
✅ Separate data from main app

Visit: http://localhost:3000 (local)  
Or: https://vibe-finance.vercel.app (production)
