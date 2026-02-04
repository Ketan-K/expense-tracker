# Native OAuth Setup - Android App Links

This document explains how to complete the native OAuth setup for the Android app.

## ✅ What's Already Implemented

1. **@capacitor/app plugin** - Installed and configured for deep link listening
2. **App URL listener** - Scoped to sign-in page with proper cleanup
3. **Session verification** - Polls for authenticated session with timeout
4. **Error handling** - Toast notifications for failures
5. **Digital Asset Links file** - Created at `public/.well-known/assetlinks.json`
6. **Android Manifest** - Already has HTTPS deep link intent-filters configured

## ⚠️ What You Still Need to Do

### 1. Add SHA-256 Fingerprints to assetlinks.json

The `public/.well-known/assetlinks.json` file has TODO placeholders. You need to replace them with actual SHA-256 certificate fingerprints.

**Get fingerprints using one of these methods:**

#### Option A: From GitHub Actions Workflow (EASIEST ✨)

The keystores were generated using the **Generate Android Keystores** workflow, which automatically extracts SHA-256 fingerprints.

**Steps:**

1. Go to GitHub repository **Actions** tab
2. Find the **Generate Android Keystores** workflow run
3. Open the workflow run and check the **Summary**
4. SHA-256 fingerprints are displayed at the top (already formatted correctly)
5. **OR** download the artifact and open `KEYSTORE_CREDENTIALS.txt`

The fingerprints will look like:

```
14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B1:3F:CF:44:E5
```

#### Option B: From Android Studio

1. Open project in Android Studio
2. **Build > Generate Signed Bundle / APK**
3. Select APK, choose keystore from `android-keystores/`
4. Certificate info will show SHA-256 fingerprint

#### Option C: Install Java and use keytool

```powershell
# Install Java
winget install Oracle.JDK.21

# Extract fingerprint for default theme
keytool -list -v -keystore android-keystores/expense-tracker-release.keystore -storepass ExpenseTracker2026 | Select-String "SHA256:"

# Extract fingerprint for Vibe theme
keytool -list -v -keystore android-keystores/vibe-finance-release.keystore -storepass ExpenseTracker2026 | Select-String "SHA256:"
```

#### Option D: From Google Play Console

1. Upload APK to Play Console (Internal Testing)
2. **Release > Setup > App Integrity**
3. Copy SHA-256 from App signing certificate

**Update assetlinks.json format:**

```json
"sha256_cert_fingerprints": [
  "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B1:3F:CF:44:E5"
]
```

### 2. Configure Google OAuth Console

Add these **authorized redirect URIs** to your Google Cloud Console OAuth client:

- `https://expense-tracker-io.vercel.app/api/auth/callback/google`
- `https://vibe-finance-io.vercel.app/api/auth/callback/google`

**Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. **APIs & Services > Credentials**
4. Click your OAuth 2.0 Client ID
5. Add the URIs above to **Authorized redirect URIs**
6. Save

### 3. Deploy to Vercel

The `assetlinks.json` file must be accessible at:

- `https://expense-tracker-io.vercel.app/.well-known/assetlinks.json`
- `https://vibe-finance-io.vercel.app/.well-known/assetlinks.json`

**Deploy:**

```powershell
git add .
git commit -m "Add native OAuth with Android App Links"
git push
```

### 4. Test Android App Links

After deployment, verify App Links are working:

```bash
# Install the app on a device/emulator
# Then test the deep link
adb shell am start -a android.intent.action.VIEW -d "https://expense-tracker-io.vercel.app/api/auth/callback/google"
```

**Expected behavior:** App opens instead of browser

### 5. Test OAuth Flow

1. Open the app on Android device
2. Tap the "Continue with Google" button
3. Complete OAuth in the in-app browser
4. **App should automatically close browser and redirect to dashboard**

**Debug mode:** Tap the logo 7 times to enable debug console and see OAuth flow logs

## 📋 Troubleshooting

### Deep link opens browser instead of app

- **Cause:** App Links not verified
- **Fix:** Check SHA-256 fingerprints match in assetlinks.json
- **Verify:** Access `https://your-domain.vercel.app/.well-known/assetlinks.json` in browser

### "Authentication timeout" error

- **Cause:** Session not established within 10 seconds
- **Fix:** Check Google OAuth redirect URIs are correct
- **Debug:** Enable debug mode and check logs

### Browser doesn't close automatically

- **Cause:** This is expected - users must close it manually
- **When closed:** Deep link callback triggers and app redirects to dashboard
- **Note:** This is standard behavior for Capacitor Browser plugin

### "redirect_uri_mismatch" error

- **Cause:** Google OAuth console missing HTTPS redirect URIs
- **Fix:** Add both Vercel domains to authorized redirect URIs

## 🔒 Security Notes

- SHA-256 fingerprints verify app authenticity
- Android automatically verifies App Links on install
- HTTPS deep links are more secure than custom schemes
- No separate Android OAuth client needed (uses Web client)

## 📚 Additional Resources

- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [Capacitor App Plugin](https://capacitorjs.com/docs/apis/app)
- [NextAuth.js OAuth Providers](https://next-auth.js.org/providers/google)
