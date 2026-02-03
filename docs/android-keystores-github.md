# Generate Android Keystores (No Local Java Required)

This guide shows how to generate Android signing keystores using GitHub Actions, so you don't need to install Java locally.

## Quick Start

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Generate Android Keystores** workflow (left sidebar)
4. Click **Run workflow** button (top right)
5. Click **Run workflow** (green button)
6. Wait ~1 minute for completion

## Download Your Keystores

1. After workflow completes, scroll down to **Artifacts** section
2. Download **android-keystores.zip**
3. Extract the zip file to a secure location
4. Open **KEYSTORE_CREDENTIALS.txt**

## Add Secrets to GitHub

The credentials file contains all the values you need. Copy them to GitHub:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret from the credentials file:

### For Default Theme (Expense Tracker)

- **Name**: `KEYSTORE_BASE64`  
  **Value**: Copy the entire Base64 string from credentials file
- **Name**: `KEYSTORE_PASSWORD`  
  **Value**: Copy the password from credentials file
- **Name**: `KEY_ALIAS`  
  **Value**: `expense-tracker`
- **Name**: `KEY_PASSWORD`  
  **Value**: Copy the key password from credentials file

### For Vibe Finance Theme

- **Name**: `KEYSTORE_BASE64_VIBE`  
  **Value**: Copy the entire Base64 string from credentials file
- **Name**: `KEYSTORE_PASSWORD_VIBE`  
  **Value**: Copy the password from credentials file
- **Name**: `KEY_ALIAS_VIBE`  
  **Value**: `vibe-finance`
- **Name**: `KEY_PASSWORD_VIBE`  
  **Value**: Copy the key password from credentials file

## Test the Signing

1. Go to **Actions** tab
2. Select **Build Android Apps** workflow
3. Click **Run workflow**
4. Choose **release** as build type
5. Click **Run workflow**
6. Download the signed APKs from artifacts

## Security Notes

⚠️ **Important**:

- The artifact is automatically deleted after 7 days
- Download and backup the keystores immediately
- Store them in a password manager or encrypted drive
- Never commit keystores to Git
- If you lose the keystore, you cannot update your app on Play Store

## Regenerate Keystores

If you need to regenerate (e.g., you lost the download):

1. Run the workflow again
2. You can optionally provide custom passwords instead of auto-generated ones
3. Download the new artifact
4. Update the GitHub Secrets with the new values

**Note**: If you already published an app with the old keystore, you MUST keep using that keystore. Regenerating will create a new keystore that cannot update existing apps.

## Custom Passwords (Optional)

When running the workflow, you can optionally provide your own passwords:

- Click **Run workflow**
- Enter **Keystore Password** (optional)
- Enter **Key Password** (optional)
- If left empty, secure random passwords are generated automatically

## Keystore Details

Generated keystores have:

- **Organization**: K-Tech Solutions
- **Location**: Pune, Maharashtra, India
- **Validity**: 10,000 days (~27 years)
- **Algorithm**: RSA 2048-bit
- **Aliases**: expense-tracker, vibe-finance
