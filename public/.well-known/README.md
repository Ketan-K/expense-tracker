# Android App Links - Digital Asset Links

This file enables Android App Links verification for OAuth callbacks.

## Getting SHA-256 Fingerprints

### Method 1: From GitHub Actions Workflow (EASIEST ✨)

The keystores were generated using the `Generate Android Keystores` GitHub Actions workflow, which automatically extracts and displays SHA-256 fingerprints.

**Steps:**

1. Go to your GitHub repository
2. Navigate to **Actions** tab
3. Find the **Generate Android Keystores** workflow run
4. Check the **Summary** - SHA-256 fingerprints are displayed at the top
5. **OR** download the artifact and open `KEYSTORE_CREDENTIALS.txt` - fingerprints are included

**The fingerprints are already in the correct format** (uppercase with colons).

### Method 2: From Android Studio

1. Open the project in Android Studio
2. Go to **Build > Generate Signed Bundle / APK**
3. Select **APK** and click **Next**
4. Choose the keystore file from `android-keystores/`
5. The SHA-256 fingerprint will be shown in the certificate info

### Method 3: From Built APK

1. Build the release APK
2. Upload it to Google Play Console (Internal Testing track)
3. Go to **Release > Setup > App Integrity**
4. Copy the SHA-256 fingerprint from the App signing certificate

### Method 4: Install Java and use keytool

```powershell
# Install Java (if needed)
winget install Oracle.JDK.21

# Extract fingerprint for default theme
keytool -list -v -keystore android-keystores/expense-tracker-release.keystore -storepass ExpenseTracker2026 | Select-String "SHA256:"

# Extract fingerprint for Vibe theme
keytool -list -v -keystore android-keystores/vibe-finance-release.keystore -storepass ExpenseTracker2026 | Select-String "SHA256:"
```

## Updating assetlinks.json

Replace the TODO placeholders in `assetlinks.json` with actual fingerprints:

```json
"sha256_cert_fingerprints": [
  "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B1:3F:CF:44:E5"
]
```

**Note:** Fingerprints should be in uppercase with colons, 64 hex characters total.

## Testing App Links

After deploying to Vercel with real fingerprints:

```bash
# Test if deep link opens the app
adb shell am start -a android.intent.action.VIEW -d "https://expense-tracker-io.vercel.app/api/auth/callback/google"
```

If configured correctly, it should open your app instead of the browser.

## Google OAuth Setup

Add these authorized redirect URIs in Google Cloud Console:

- `https://expense-tracker-io.vercel.app/api/auth/callback/google`
- `https://vibe-finance-io.vercel.app/api/auth/callback/google`
