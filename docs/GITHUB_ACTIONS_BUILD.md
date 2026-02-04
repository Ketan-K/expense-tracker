# Building Android Apps with GitHub Actions

This guide explains how to build Android APKs using GitHub Actions without installing anything locally.

## 🚀 Quick Start

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Add Android build workflows"
git push origin master
```

### 2. Trigger Build

**Option A: Automatic (on every push)**

- Builds automatically when you push to `master` or `develop` branch
- Go to **Actions** tab in GitHub to see progress

**Option B: Manual Trigger**

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Build Android - Default Theme** or **Build Android - Vibe Finance** workflow
4. Click **Run workflow**
5. Choose build type: `debug` or `release`
6. Click **Run workflow** button

### 3. Download APKs

1. Wait for workflow to complete (~3-5 minutes with caching)
2. Go to the completed workflow run
3. Scroll down to **Artifacts** section
4. Download:
   - `expense-tracker-{version}-debug` - Default theme APK (e.g., `expense-tracker-1.0.0-debug`)
   - `vibe-finance-{version}-debug` - Vibe Finance theme APK (e.g., `vibe-finance-1.0.0-debug`)

**Note**: Artifacts are now named with the version from `package.json`

## 📦 What Gets Built

### Every Push to Master/Develop

- ✅ Default Theme (Debug APK) - via **Build Android - Default Theme** workflow
- ✅ Vibe Finance (Debug APK) - via **Build Android - Vibe Finance** workflow
- Artifacts available for 30 days
- APK names include version from package.json

### Manual Workflow (Run workflow button)

- Choose `debug` or `release` build type
- Select which theme to build (Default or Vibe)
- Downloads available as artifacts

### Git Tags (Releases)

When you create a tag like `v1.0.0`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Automatically:

- ✅ Builds release APKs for both themes
- ✅ Creates GitHub Release with **Create Release** workflow
- ✅ Attaches both APKs to the release (e.g., `expense-tracker-1.0.0.apk`)
- Artifacts available for 90 days

## 🔧 Workflow Configuration

The workflow files are at:

- `.github/workflows/build-android-default.yml` - Default theme builds
- `.github/workflows/build-android-vibe.yml` - Vibe Finance builds
- `.github/workflows/create-release.yml` - Automatic release creation
- `.github/workflows/generate-keystores.yml` - Keystore generation

### Build Workflows (Default & Vibe):

1. **Sets up environment**
   - Node.js 20
   - Java JDK 21 (with Gradle caching for faster builds)
   - Android SDK

2. **Extracts version**
   - Reads version from `package.json`
   - Uses version in artifact naming

3. **Validates keystore** (release builds only)
   - Decodes keystore from Base64
   - Verifies password and alias
   - Tests signing capability with jarsigner

4. **Builds APK**
   - Vibe workflow updates Android config automatically
   - Changes package name to `com.vibefinance.app`
   - Changes app name to "Vibe Finance"
   - Runs `npm run cap:sync` (or `cap:sync:vibe` for Vibe)
   - Builds with Gradle

5. **Uploads artifact**
   - Names include version (e.g., `expense-tracker-1.0.0-debug.apk`)
   - Debug builds: 30 day retention
   - Release builds: 90 day retention

### Create Release Workflow:

1. **Triggers on version tags** (e.g., `v1.0.0`)
2. **Waits for both build workflows** to complete
3. **Downloads release APKs** from both workflows
4. **Creates GitHub Release** with:
   - Release notes
   - Both APKs attached
   - Proper naming (e.g., `expense-tracker-1.0.0.apk`)

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
# Update version in package.json first
# "version": "1.0.1"

# Then create and push a version tag
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions will automatically:
# 1. Build both apps (via separate workflows)
# 2. Create a GitHub Release (via create-release.yml)
# 3. Attach both APKs to the release
```

### Manual Release Build

To manually build a release APK without creating a tag:

1. Go to **Actions** tab
2. Select **Build Android - Default Theme** or **Build Android - Vibe Finance**
3. Click **Run workflow**
4. Choose **release** as build type
5. Click **Run workflow**
6. Download the release APK from artifacts

**Note**: Release builds require keystore secrets to be configured (see [android-keystores-github.md](android-keystores-github.md))

## 🔐 Building Signed APKs (for Play Store)

Release APKs are automatically signed when you have the keystore secrets configured.

### Quick Setup

Use the automated keystore generation workflow (recommended):

1. Go to **Actions** tab
2. Select **Generate Android Keystores** workflow
3. Click **Run workflow**
4. Download the generated keystores
5. Follow instructions in [android-keystores-github.md](android-keystores-github.md) to add secrets

**Required Secrets (6 total):**

- `KEYSTORE_BASE64` - Base64 encoded keystore file
- `KEYSTORE_PASSWORD` - Password (used for both keystore and key)
- `KEY_ALIAS` - Alias name (e.g., `expense-tracker`)
- `KEYSTORE_BASE64_VIBE` - Base64 encoded Vibe keystore
- `KEYSTORE_PASSWORD_VIBE` - Vibe password
- `KEY_ALIAS_VIBE` - Vibe alias (e.g., `vibe-finance`)

See detailed setup guides:

- [Generate Keystores via GitHub Actions](android-keystores-github.md) (no Java required)
- [Manual Keystore Setup](android-signing-setup.md) (if you have Java installed)

Once secrets are configured, release builds will automatically sign APKs!

## 🎯 Workflow Triggers

We have **4 separate workflows**:

### 1. Build Android - Default Theme

- **File**: `.github/workflows/build-android-default.yml`
- **Triggers**:
  - Push to `master` or `develop` branch
  - Pull requests to `master`
  - Git tags starting with `v*`
  - Manual dispatch
- **Builds**: Default theme (Expense Tracker) only

### 2. Build Android - Vibe Finance

- **File**: `.github/workflows/build-android-vibe.yml`
- **Triggers**: Same as Default Theme
- **Builds**: Vibe Finance theme only

### 3. Create Release

- **File**: `.github/workflows/create-release.yml`
- **Triggers**: Git tags starting with `v*` only
- **Actions**:
  - Waits for both build workflows to complete
  - Downloads release APKs
  - Creates GitHub Release with both APKs attached

### 4. Generate Android Keystores

- **File**: `.github/workflows/generate-keystores.yml`
- **Triggers**: Manual dispatch only
- **Actions**: Generates signing keystores without local Java installation

## 📊 Monitoring Builds

### View Build Status

1. Go to **Actions** tab
2. See all workflow runs (separated by workflow)
3. Click on a run to see details
4. View logs for each step

### Build Time

- **First build**: ~8-10 minutes (downloads dependencies)
- **Subsequent builds**: ~3-5 minutes (uses Gradle cache)
- **Both themes in parallel**: ~3-5 minutes (workflows run simultaneously)

### Performance Optimizations

✅ **Gradle caching** - Dependencies cached between builds  
✅ **Node modules caching** - npm dependencies cached  
✅ **Parallel builds** - Both themes build simultaneously  
✅ **Incremental builds** - Only changed code is recompiled

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
