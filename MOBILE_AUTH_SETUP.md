# Mobile Authentication Setup Guide

This guide explains how to configure token-based authentication for the Capacitor mobile app.

## Overview

The app uses **dual authentication modes**:
- **Web**: Cookie-based sessions via NextAuth
- **Mobile**: JWT token-based authentication (cookies don't work in Capacitor WebView)

---

## Environment Variables

### Required Secrets

Add these to your `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-super-secret-key-here

# Alternative name (NextAuth v5 compatibility)
AUTH_SECRET=your-super-secret-key-here

# Google OAuth Credentials
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Admin Email (optional - for admin access)
ADMIN_EMAIL=admin@yourdomain.com
```

### Secret Details

#### 1. `NEXTAUTH_SECRET` / `AUTH_SECRET`

**What it does**: 
- Signs JWT tokens for mobile authentication
- Encrypts session cookies for web
- CRITICAL for security

**How to generate**:
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# Visit: https://generate-secret.vercel.app/32
```

**Important**: 
- Use the **same value** for both `NEXTAUTH_SECRET` and `AUTH_SECRET`
- Keep this secret secure - never commit to git
- Changing this will invalidate all existing sessions and tokens

#### 2. `NEXTAUTH_URL`

**What it does**: 
- Base URL for OAuth callbacks
- Required for Google OAuth redirect

**Values**:
```bash
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://expense-tracker-io.vercel.app
```

#### 3. Google OAuth Credentials

**How to obtain**:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API" (or "Google Identity" API)
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: **Web application**
6. **CRITICAL**: Authorized redirect URIs must include:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-production-domain.com/api/auth/callback/google
   ```
   
   **Example for production:**
   ```
   https://expense-tracker-io.vercel.app/api/auth/callback/google
   ```
   
   ⚠️ **Important**: The redirect URI must **exactly match** your `NEXTAUTH_URL` + `/api/auth/callback/google`
   
   Common mistakes:
   - Missing trailing slash in base URL
   - Using `http` instead of `https` for production
   - Forgetting to add production domain after local testing

7. Copy `Client ID` → `GOOGLE_CLIENT_ID`
8. Copy `Client Secret` → `GOOGLE_CLIENT_SECRET`

#### 4. MongoDB URI

**Format**:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

Get this from your MongoDB Atlas dashboard.

---

## Mobile-Specific Configuration

### Android Deep Links (App Links)

The mobile app uses HTTPS deep links to capture OAuth callbacks.

#### 1. Configure in `capacitor.config.ts`

```typescript
{
  server: {
    url: "https://expense-tracker-io.vercel.app",
    cleartext: true,
    androidScheme: "https"
  }
}
```

#### 2. Android Manifest Configuration

Already configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="expense-tracker-io.vercel.app" />
</intent-filter>
```

#### 3. Verify Deep Links

Test that deep links work:

```bash
# Test deep link on connected Android device
adb shell am start -a android.intent.action.VIEW \
  -d "https://expense-tracker-io.vercel.app/api/auth/callback/google?code=test"
```

---

## JWT Token Configuration

### Token Expiry

Tokens expire after **30 days** by default.

To change, edit `src/app/api/auth/mobile-token/route.ts`:

```typescript
const TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds
```

### Token Storage

Mobile tokens are stored in **localStorage** at:
- Key: `auth_token` - JWT token
- Key: `auth_user` - User data (id, email, name, image, expiresAt)

To clear tokens (logout):
```javascript
localStorage.removeItem('auth_token');
localStorage.removeItem('auth_user');
```

---

## Testing Authentication

### Web (Cookie-based)

1. Visit `http://localhost:3000/auth/signin`
2. Click "Continue with Google"
3. Should redirect to Google OAuth
4. After auth, redirects to `/dashboard`
5. Session stored in `httpOnly` cookie

### Mobile (Token-based)

1. Build and run mobile app:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. In app, tap logo **7 times** to enable debug mode

3. Click "Continue with Google"

4. Debug console should show:
   ```
   🔐 Starting OAuth flow...
   📱 Fetching OAuth URL from server...
   🔗 Got URL: https://accounts.google.com/...
   ✅ In-app browser opened
   📱 Deep link received: https://...
   ✅ OAuth callback detected
   🗑️ In-app browser closed
   🔄 Exchanging session for mobile token...
   ✅ Token received, storing locally
   🎉 Authentication complete!
   ```

5. Token stored in localStorage, auto-included in all API requests

---

## API Request Headers

### Web Requests

Standard fetch:
```javascript
fetch('/api/expenses')
// Cookies automatically included
```

### Mobile Requests

Use `authFetch` utility:
```javascript
import { authFetch } from '@/lib/auth';

const response = await authFetch('/api/expenses');
// Automatically includes: Authorization: Bearer <token>
```

Or manually:
```javascript
import { getAuthHeaders } from '@/lib/auth';

fetch('/api/expenses', {
  headers: {
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  }
});
```

---

## Security Considerations

### Token Security

**Pros**:
- ✅ Works in Capacitor WebView (no cookie limitations)
- ✅ Simple to implement
- ✅ 30-day expiry provides good UX

**Cons**:
- ⚠️ Stored in localStorage (accessible to JavaScript)
- ⚠️ Less secure than httpOnly cookies
- ⚠️ Vulnerable to XSS attacks

**Mitigations**:
1. Keep dependencies updated
2. Sanitize all user input
3. Use Content Security Policy
4. Consider adding refresh tokens in future
5. Implement device fingerprinting

### Production Checklist

- [ ] Generate secure `NEXTAUTH_SECRET` (32+ characters)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Configure Google OAuth with production redirect URIs
- [ ] Test OAuth flow on actual Android device
- [ ] Verify deep links work (Android App Links)
- [ ] Test token expiry and refresh
- [ ] Monitor for XSS vulnerabilities
- [ ] Set up error tracking (Sentry, etc.)

---

## Troubleshooting

### Mobile OAuth Not Working

**Symptom**: Deep link not captured after Google sign-in

**Solutions**:
1. Check `capacitor.config.ts` has correct production URL
2. Verify Android manifest has `android:autoVerify="true"`
3. Verify Google OAuth redirect URI matches exactly
4. Enable debug mode (7 taps) and check logs
5. Test deep link with `adb shell am start`

### Token Not Included in Requests

**Symptom**: API returns 401 Unauthorized

**Solutions**:
1. Check localStorage has `auth_token` key
2. Use `authFetch()` instead of `fetch()`
3. Verify token hasn't expired (check `auth_user.expiresAt`)
4. Check server logs for token verification errors

### Session Lost After App Restart

**Symptom**: User logged out when app restarts

**Solutions**:
1. Check localStorage persistence
2. Verify token expiry (30 days)
3. Check if `clearAuthToken()` being called unexpectedly
4. Enable debug mode and check initialization logs

---

## Development vs Production

### Development (.env.local)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-only
AUTH_SECRET=development-secret-only
AUTH_GOOGLE_ID=your-dev-google-id
AUTH_GOOGLE_SECRET=your-dev-google-secret
```

### Production (Vercel Environment Variables)
```bash
NEXTAUTH_URL=https://expense-tracker-io.vercel.app
NEXTAUTH_SECRET=<secure-production-secret>
AUTH_SECRET=<secure-production-secret>
AUTH_GOOGLE_ID=<production-google-id>
AUTH_GOOGLE_SECRET=<production-google-secret>
```

**Important**: Use different Google OAuth credentials for development and production!

---

## Next Steps

1. ✅ Add environment variables to `.env.local`
2. ✅ Configure Google OAuth credentials
3. ✅ Test web authentication
4. ✅ Build mobile app and test token flow
5. ⏭️ Consider adding refresh tokens
6. ⏭️ Add biometric authentication for mobile
7. ⏭️ Implement device fingerprinting
8. ⏭️ Add session management UI

---

## Support

For issues or questions:
1. Check debug console (7 taps on logo)
2. Review server logs
3. Check browser/app console for errors
4. Verify all environment variables are set
