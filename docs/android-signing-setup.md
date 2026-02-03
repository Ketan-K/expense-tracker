# Android App Signing Setup

This guide explains how to create keystores and configure GitHub Secrets for signing your Android apps.

## Prerequisites

- Java JDK installed (version 21 recommended)
- Access to your GitHub repository settings

## Step 1: Generate Keystores

### For Default Theme (Expense Tracker)

```bash
keytool -genkey -v -keystore expense-tracker-release.keystore -alias expense-tracker -keyalg RSA -keysize 2048 -validity 10000
```

When prompted, provide:

- **Keystore password**: Choose a strong password (save this!)
- **Key password**: Can be same as keystore password or different (save this!)
- **Name**: Your name or company name
- **Organizational Unit**: Your team/department
- **Organization**: Your company name
- **City/Locality**: Your city
- **State/Province**: Your state
- **Country Code**: Two-letter country code (e.g., US, IN, UK)

### For Vibe Finance Theme (Optional - use separate keystore)

```bash
keytool -genkey -v -keystore vibe-finance-release.keystore -alias vibe-finance -keyalg RSA -keysize 2048 -validity 10000
```

**Note**: You can use the same keystore for both apps if you prefer. Just use different aliases.

## Step 2: Convert Keystores to Base64

### Windows (PowerShell)

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("expense-tracker-release.keystore")) | Set-Clipboard
```

### Linux/Mac

```bash
base64 expense-tracker-release.keystore | pbcopy  # Mac
base64 expense-tracker-release.keystore | xclip   # Linux
```

## Step 3: Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

### For Default Theme (Expense Tracker)

1. **KEYSTORE_BASE64**
   - Value: Paste the base64 string from Step 2

2. **KEYSTORE_PASSWORD**
   - Value: The keystore password you entered

3. **KEY_ALIAS**
   - Value: `expense-tracker` (or whatever alias you used)

4. **KEY_PASSWORD**
   - Value: The key password you entered

### For Vibe Finance Theme (if using separate keystore)

1. **KEYSTORE_BASE64_VIBE**
   - Value: Base64 of vibe-finance-release.keystore

2. **KEYSTORE_PASSWORD_VIBE**
   - Value: Vibe Finance keystore password

3. **KEY_ALIAS_VIBE**
   - Value: `vibe-finance`

4. **KEY_PASSWORD_VIBE**
   - Value: Vibe Finance key password

**Note**: If you're using the same keystore for both apps, you don't need the `_VIBE` variants. The workflow will fall back to the default secrets.

## Step 4: Secure Your Keystore

⚠️ **IMPORTANT**:

- **Never commit keystores to Git**
- Keep a backup of your keystores in a secure location (password manager, encrypted drive)
- If you lose the keystore, you cannot update the app on Play Store
- The keystore is already added to `.gitignore`

## Step 5: Test Signing

Trigger a release build in GitHub Actions:

1. Go to **Actions** tab
2. Select "Build Android Apps" workflow
3. Click "Run workflow"
4. Choose "release" as build type
5. Click "Run workflow"

The workflow will:

- Decode the keystore from the secret
- Sign the APK with your credentials
- Upload the signed APK as an artifact

## Step 6: Verify Signed APK

Download the artifact from GitHub Actions and verify the signature:

```bash
# Check if APK is signed
jarsigner -verify -verbose -certs app-release.apk

# View signing certificate details
keytool -printcert -jarfile app-release.apk
```

## Keystore Information Reference

Keep this information in a secure password manager:

```
Default Theme (Expense Tracker)
- Keystore file: expense-tracker-release.keystore
- Keystore password: [YOUR_PASSWORD]
- Key alias: expense-tracker
- Key password: [YOUR_KEY_PASSWORD]

Vibe Finance Theme
- Keystore file: vibe-finance-release.keystore (or same as above)
- Keystore password: [YOUR_PASSWORD]
- Key alias: vibe-finance (or expense-tracker if shared)
- Key password: [YOUR_KEY_PASSWORD]
```

## Play Store Preparation

For Play Store submission, you'll need:

1. Signed APK or AAB (Android App Bundle)
2. App icons (512x512 PNG)
3. Feature graphic (1024x500 PNG)
4. Screenshots (at least 2, max 8)
5. Privacy policy URL
6. App description and details

To build AAB instead of APK:

```bash
./gradlew bundleRelease
```

## Troubleshooting

### "KEYSTORE_BASE64 secret not found"

- Make sure you added the secret in GitHub repository settings
- Secret names are case-sensitive

### "Keystore was tampered with, or password was incorrect"

- Check that KEYSTORE_PASSWORD and KEY_PASSWORD match what you used during creation
- Verify the base64 encoding didn't get corrupted

### APK shows as unsigned

- Run `jarsigner -verify app-release.apk`
- Check GitHub Actions logs for signing errors
