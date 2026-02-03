# Building Android Apps with GitHub Actions

This guide explains how to build Android APKs using GitHub Actions without installing anything locally.

## 🚀 Quick Start

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Add Android build workflow"
git push origin main
```

### 2. Trigger Build

**Option A: Automatic (on every push)**

- Builds automatically when you push to `main` or `develop` branch
- Go to **Actions** tab in GitHub to see progress

**Option B: Manual Trigger**

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Build Android Apps** workflow
4. Click **Run workflow**
5. Choose build type: `debug` or `release`
6. Click **Run workflow** button

### 3. Download APKs

1. Wait for workflow to complete (~5-10 minutes)
2. Go to the completed workflow run
3. Scroll down to **Artifacts** section
4. Download:
   - `expense-tracker-default-debug` - Default theme APK
   - `vibe-finance-debug` - Vibe Finance theme APK

## 📦 What Gets Built

### Every Push to Main/Develop

- ✅ Default Theme (Debug APK)
- ✅ Vibe Finance (Debug APK)
- Artifacts available for 30 days

### Manual Workflow (Run workflow button)

- Choose `debug` or `release` build type
- Downloads available as artifacts

### Git Tags (Releases)

When you create a tag like `v1.0.0`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Automatically:

- ✅ Builds release APKs for both themes
- ✅ Creates GitHub Release
- ✅ Attaches APKs to the release
- Artifacts available for 90 days

## 🔧 Workflow Configuration

The workflow file is at: `.github/workflows/build-android.yml`

### What it does:

1. **Sets up environment**
   - Node.js 18
   - Java JDK 17
   - Android SDK

2. **Builds Default Theme**
   - Runs `npm run cap:sync`
   - Builds APK with `gradlew assembleDebug`
   - Uploads as artifact

3. **Builds Vibe Finance**
   - Updates Android config files automatically
   - Changes package name to `com.vibefinance.app`
   - Changes app name to "Vibe Finance"
   - Runs `npm run cap:sync:vibe`
   - Builds APK
   - Uploads as artifact

4. **Creates Release** (on tags only)
   - Downloads all artifacts
   - Creates GitHub release
   - Attaches both APKs

## 📱 Installing on Phone

### Download from GitHub

1. Go to **Actions** tab
2. Click on latest successful workflow run
3. Download the APK artifact
4. Unzip the downloaded file
5. Transfer `app-debug.apk` to your phone

### Install on Android

**Method 1: Direct Download**

1. On your phone, go to the GitHub Actions page
2. Download the APK directly
3. Tap to install (allow "Install from Unknown Sources")

**Method 2: File Transfer**

1. Download APK on computer
2. Send via email/Google Drive/Bluetooth
3. Open on phone and install

**Method 3: USB Cable**

```bash
# Download APK from GitHub Actions
# Then on your computer:
adb install app-debug.apk
```

## 🏷️ Creating Releases

### Automatic Release on Tag

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Build both apps
# 2. Create a GitHub Release
# 3. Attach APKs to the release
```

### Manual Release Creation

1. Go to **Releases** in GitHub
2. Click **Draft a new release**
3. Choose or create a tag (e.g., `v1.0.1`)
4. Workflow will build APKs automatically
5. APKs will be attached to the release

## 🔐 Building Signed APKs (for Play Store)

To build signed release APKs in GitHub Actions:

### 1. Generate Signing Key Locally

```bash
keytool -genkey -v -keystore expense-tracker-release.keystore -alias expense-tracker -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Encode Keystore to Base64

**Windows (PowerShell):**

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("expense-tracker-release.keystore")) | Out-File keystore.txt
```

**macOS/Linux:**

```bash
base64 -i expense-tracker-release.keystore -o keystore.txt
```

### 3. Add GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

- `KEYSTORE_BASE64` - Content of `keystore.txt`
- `KEYSTORE_PASSWORD` - Your keystore password
- `KEY_ALIAS` - `expense-tracker`
- `KEY_PASSWORD` - Your key password

### 4. Update Workflow

Add this step before the "Build Release APK" step:

```yaml
- name: Decode Keystore
  if: github.event.inputs.build_type == 'release' || startsWith(github.ref, 'refs/tags/')
  run: |
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/expense-tracker-release.keystore
    echo "storePassword=${{ secrets.KEYSTORE_PASSWORD }}" > android/keystore.properties
    echo "keyPassword=${{ secrets.KEY_PASSWORD }}" >> android/keystore.properties
    echo "keyAlias=${{ secrets.KEY_ALIAS }}" >> android/keystore.properties
    echo "storeFile=expense-tracker-release.keystore" >> android/keystore.properties
```

And update build.gradle to use the keystore (see main android-build.md).

Then the workflow will produce signed APKs ready for Play Store!

## 🎯 Workflow Triggers

The workflow runs on:

1. **Push to main/develop** - Builds debug APKs
2. **Pull Request** - Validates build works
3. **Manual trigger** - Run anytime from Actions tab
4. **Git tags (v\*)** - Builds release APKs and creates GitHub Release

## 📊 Monitoring Builds

### View Build Status

1. Go to **Actions** tab
2. See all workflow runs
3. Click on a run to see details
4. View logs for each step

### Build Time

- First build: ~10-15 minutes (downloads dependencies)
- Subsequent builds: ~5-8 minutes (uses cache)

### Troubleshooting

**Build Failed?**

1. Click on the failed workflow
2. Expand the failed step
3. Read error logs
4. Common issues:
   - Dependency resolution
   - Android SDK version mismatch
   - Gradle build errors

**Can't Download Artifacts?**

- Debug artifacts expire after 30 days
- Release artifacts expire after 90 days
- Create a new build if expired

## 🔄 Updating Builds

### Update Default Theme

```bash
# Make changes to code
git add .
git commit -m "Update default theme"
git push origin main

# GitHub Actions builds automatically
```

### Update Vibe Finance

Same as above - the workflow automatically configures Vibe theme during build.

### Update Both

Both apps are built on every push, so one push updates both!

## 🚢 Play Store Deployment

### Using GitHub Actions APKs

1. Trigger release build (tag with `v1.0.0`)
2. Download signed AAB from artifacts
3. Upload to Play Console

### For AAB Format (recommended for Play Store)

Update workflow to build bundle instead of APK:

```yaml
- name: Build Release Bundle
  run: |
    cd android
    ./gradlew bundleRelease --stacktrace
```

Then upload path: `android/app/build/outputs/bundle/release/app-release.aab`

## 🎉 Benefits of GitHub Actions

✅ **No local setup required** - Everything runs in the cloud  
✅ **Consistent builds** - Same environment every time  
✅ **Automatic on push** - No manual building  
✅ **Parallel builds** - Both apps build simultaneously  
✅ **Artifact storage** - Easy download and sharing  
✅ **Release automation** - Tag = automatic release  
✅ **Free for public repos** - 2000 minutes/month for private

## 📝 Next Steps

1. ✅ Push code to GitHub
2. ✅ Go to Actions tab and watch the build
3. ✅ Download APKs when complete
4. ✅ Install on Android phone
5. ✅ Test contact sync feature
6. ✅ Create a git tag for releases
7. ✅ Add signing keys for Play Store builds

---

**No local installation needed - build in the cloud! ☁️**
