# Generate Android Keystores

This directory contains a script to automatically generate signing keystores for your Android apps.

## Quick Start

Run this command in PowerShell:

```powershell
.\scripts\generate-keystores.ps1
```

## What the script does:

1. ✅ Creates `android-keystores/` directory
2. ✅ Generates secure random passwords
3. ✅ Creates `expense-tracker-release.keystore` for Default theme
4. ✅ Creates `vibe-finance-release.keystore` for Vibe Finance theme
5. ✅ Converts both keystores to Base64
6. ✅ Saves all credentials to `KEYSTORE_CREDENTIALS.txt`
7. ✅ Opens the credentials file for you to copy

## After running the script:

1. Open the generated `android-keystores/KEYSTORE_CREDENTIALS.txt` file
2. Copy each secret value to GitHub:
   - Go to your repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Add each secret as shown in the credentials file
3. Backup the entire `android-keystores/` folder to a secure location
4. Test by running a release build in GitHub Actions

## Default Values Used:

- **App Name (CN)**: Expense Tracker / Vibe Finance
- **Organization**: K-Tech Solutions
- **Organizational Unit**: Development
- **City**: Pune
- **State**: Maharashtra
- **Country**: IN (India)
- **Validity**: 10,000 days (~27 years)
- **Key Algorithm**: RSA
- **Key Size**: 2048 bits

These values are fine for testing and Play Store submission. You can edit the script if you want to change them.

## Security Notes:

⚠️ The generated files are automatically excluded from Git via `.gitignore`

⚠️ Never commit keystores or the credentials file to version control

⚠️ If you lose the keystore, you cannot update your app on Play Store

⚠️ Keep backups in multiple secure locations (password manager, encrypted drive, etc.)
