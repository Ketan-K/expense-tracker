# Android App Build Guide

This guide explains how to build and deploy the Expense Tracker Android apps (Default and Vibe Finance themes).

## 📱 Architecture

Both apps use **Capacitor WebView** loading from hosted Vercel URLs:

- **Default Theme**: `https://expense-tracker-io.vercel.app`
- **Vibe Finance**: `https://vibe-finance-io.vercel.app`

**Benefits:**

- Lightweight APK (~5-8MB)
- Instant updates without Play Store releases
- Native features via Capacitor plugins (contacts, status bar, splash screen)

---

## 🚀 Quick Start (Command Line Only - No Android Studio Required)

### Prerequisites

1. **Node.js 18+** and npm installed
2. **Java JDK 17** - Download from [Oracle](https://www.oracle.com/java/technologies/downloads/#java17) or [Adoptium](https://adoptium.net/)
3. **Android SDK Command Line Tools** (see installation below)
4. Apps already deployed to Vercel (see main README)

### Install Android SDK (Command Line Only)

**Windows:**

```bash
# Download Android Command Line Tools from:
# https://developer.android.com/studio#command-line-tools-only

# Extract to: C:\Android\cmdline-tools\latest

# Set environment variables (PowerShell - add to profile):
$env:ANDROID_HOME = "C:\Android"
$env:Path += ";C:\Android\cmdline-tools\latest\bin"
$env:Path += ";C:\Android\platform-tools"

# Or permanently via System Properties > Environment Variables:
# ANDROID_HOME = C:\Android
# Add to Path: C:\Android\cmdline-tools\latest\bin
# Add to Path: C:\Android\platform-tools

# Accept licenses and install required packages
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

**macOS/Linux:**

```bash
# Download and extract command line tools
cd ~/Downloads
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-*_latest.zip -d ~/Android
mkdir -p ~/Android/cmdline-tools
mv ~/Android/cmdline-tools ~/Android/cmdline-tools/latest

# Add to ~/.bashrc or ~/.zshrc:
export ANDROID_HOME=$HOME/Android
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Reload shell and install packages
source ~/.bashrc  # or source ~/.zshrc
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### Build Default Theme App (Command Line)

```bash
# Sync Capacitor plugins
npm run cap:sync

# Build debug APK
cd android
gradlew.bat assembleDebug  # Windows
./gradlew assembleDebug    # macOS/Linux

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Build Vibe Finance App (Command Line)

```bash
# First, update Android files for Vibe theme
# (see "Building Vibe Finance" section below)

# Sync with Vibe config
npm run cap:sync:vibe

# Build debug APK
cd android
gradlew.bat assembleDebug  # Windows
./gradlew assembleDebug    # macOS/Linux
```

---

## 📦 Build Configurations

### Default Theme

- **App ID**: `com.expensetracker.app`
- **App Name**: Expense Tracker
- **Server URL**: `https://expense-tracker-io.vercel.app`
- **Theme Color**: Indigo (`#6366f1`)

### Vibe Finance Theme

- **App ID**: `com.vibefinance.app`
- **App Name**: Vibe Finance
- **Server URL**: `https://vibe-finance-io.vercel.app`
- **Theme Color**: Purple (`#8B5CF6`)

---

## 🔧 Building Vibe Finance (Separate App)

To build the Vibe Finance app, you need to modify Android configuration:

### 1. Update `android/app/build.gradle`

```groovy
android {
    namespace "com.vibefinance.app"
    defaultConfig {
        applicationId "com.vibefinance.app"
        // ... rest stays same
    }
}
```

### 2. Update `android/app/src/main/res/values/strings.xml`

```xml
<resources>
    <string name="app_name">Vibe Finance</string>
    <string name="title_activity_main">Vibe Finance</string>
    <string name="package_name">com.vibefinance.app</string>
    <string name="custom_url_scheme">com.vibefinance.app</string>
</resources>
```

### 3. Generate Vibe Icons

```bash
# Generate Vibe theme icons
npm run icons:generate vibe

# Copy icons to Android res folders
# (Manual step - copy from public/ to android/app/src/main/res/mipmap-*)
```

### 4. Sync and Build

```bash
npm run cap:sync:vibe
cd android
gradlew.bat assembleDebug  # Windows
./gradlew assembleDebug    # macOS/Linux
```

---

## 🎨 App Icons & Assets

### Generating Icons

```bash
# Generate icons for default theme
npm run icons:generate

# Generate icons for Vibe theme
npm run icons:generate vibe
```

This creates:

- `favicon.ico`
- `apple-touch-icon.png` (180x180)
- `icon-192x192.png` (PWA)
- `icon-512x512.png` (PWA)

### Adding to Android

Copy generated icons to:

```
android/app/src/main/res/
  ├── mipmap-mdpi/ic_launcher.png (48x48)
  ├── mipmap-hdpi/ic_launcher.png (72x72)
  ├── mipmap-xhdpi/ic_launcher.png (96x96)
  ├── mipmap-xxhdpi/ic_launcher.png (144x144)
  └── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

---

## 📱 Features

### Native Contact Sync

Both apps include native contact sync:

1. **First Launch**: Auto-prompts for contacts permission and syncs all contacts
2. **Weekly Sync**: Auto-syncs contacts if >7 days since last sync
3. **Manual Sync**: "Sync All" button in Add Contact modal
4. **Offline Storage**: Contacts stored in IndexedDB (theme-specific)
5. **Server Sync**: Syncs to MongoDB when online via existing sync queue

**Privacy:**

- Only syncs name, phone, and email (no photos)
- Uses device contact IDs for deduplication
- Respects existing duplicate detection logic

### Status Bar Theming

- **Default**: Indigo background (`#6366f1`)
- **Vibe**: Purple background (`#8B5CF6`)
- Automatically matches app theme

### Splash Screen

- 2-second duration
- Theme-colored background
- No spinner (clean look)

---

## 🏗️ Build Types

### Debug Build (Development)

**Windows:**

```bash
cd android
gradlew.bat assembleDebug
```

**macOS/Linux:**

```bash
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

**Features:**

- Debuggable
- Not signed for production
- Can install on any device via USB/ADB

### Release Build (Play Store)

**Windows:**

```bash
cd android
gradlew.bat bundleRelease
```

**macOS/Linux:**### Release Build (Play Store)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**Requirements:**

- Signing key (see "Code Signing" below)
- Optimized and minified
- Ready for Play Store upload

---

## 🔐 Code Signing

### Generate Keystore

```bash
keytool -genkey -v -keystore expense-tracker-release.keystore -alias expense-tracker -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing

Create `android/keystore.properties`:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=expense-tracker
storeFile=../expense-tracker-release.keystore
```

Update `android/app/build.gradle`:

```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**⚠️ Important**: Never commit `keystore.properties` or `.keystore` files to git!

---

## 🚢 Play Store Deployment

### 1. Prepare Assets

- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (phone & tablet)
- Privacy policy URL
- App description from theme config

### 2. Create App Listing

- **Default**: Expense Tracker
  - Package: `com.expensetracker.app`
  - Description from `src/themes/default/config.ts`
- **Vibe Finance**: Vibe Finance
  - Package: `com.vibefinance.app`
  - Description from `src/themes/vibe/config.ts`

### 3. Upload AAB

```bash
cd android
./gradlew bundleRelease
```

Upload `app-release.aab` to Play Console.
(No Android Studio Required)

### Enable Developer Mode on Android Device

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times to enable Developer Mode
3. Go to **Settings** → **Developer Options**
4. Enable **USB Debugging**

### Test on Physical Device via USB

**Windows:**

```powershell
# Connect device via USB (enable Developer Options)
adb devices

# Install debug APK
adb install android\app\build\outputs\apk\debug\app-debug.apk

# View logs
adb logcat | Select-String "Capacitor"

# Uninstall app
adb uninstall com.expensetracker.app
```

**macOS/Linux:**

```bash
# Connect device via USB
adb devices

# Install debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep -i capacitor

# Uninstall app
adb uninstall com.expensetracker.app
```

### Test via File Transfer (No USB Cable)

1. Build APK: `cd android && gradlew.bat assembleDebug`
2. Copy `android/app/build/outputs/apk/debug/app-debug.apk` to your phone via:
   - Email attachment
   - Google Drive / Dropbox
   - Bluetooth
   - Cloud storage
3. On phone, open the APK file to install
4. Allow "Install from Unknown Sources" if prompted

## 🧪 Testing

### Test on Physical Device

````bash
# Connect device via USB (enable Developer Options)
adb dANDROID_HOME not set" or "sdkmanager not found"

**Windows (PowerShell):**
```powershell
# Set temporarily
$env:ANDROID_HOME = "C:\Android"
$env:Path += ";C:\Android\cmdline-tools\latest\bin"

# Set permanently: System Properties → Environment Variables
````

**macOS/Linux:**

```bash
# Add to ~/.bashrc or ~/.zshrc:
export ANDROID_HOME=$HOME/Android
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Reload
source ~/.bashrc
```

### "gradlew: command not found"

**Windows:** Use `gradlew.bat` instead of `./gradlew`

```bash
cd android
gradlew.bat assembleDebug
```

**macOS/Linux:** Make gradlew executable

```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

### "sync could not run--missing out directory"

This is expected when loading from remote URL. Ignore the warning or create empty `out/` folder.

### Contacts Permission Denied

Check `AndroidManifest.xml` has:

```xml
<uses-permission android:name="android.permission.READ_CONTACTS" />
```

### Status Bar Not Themed

Verify StatusBar plugin is installed:

```bash
npm install @capacitor/status-bar
npx cap sync
```

### App Loads Blank Screen

1. Check Vercel URL is accessible
2. Verify `server.url` in `capacitor.config.ts`
3. Check network connectivity
4. View logs:
   - Windows: `adb logcat | Select-String "Capacitor"`
   - macOS/Linux: `adb logcat | grep Capacitor`

### "adb: command not found"

Make sure platform-tools is in your PATH:

````bash
# Windows
$env:Path += ";C:\Android\platform-tools"

# macOS/Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools
``

---

## 🐛 Troubleshooting

### "Could not find @capacitor/android"

```bash
npm install @capacitor/android
npx cap add android
````

### "sync could not run--missing out directory"

This is expected when loading from remote URL. Ignore the warning or create empty `out/` folder.

### Contacts Permission Denied

Check `AndroidManifest.xml` has:

```xml
<uses-permission android:name="android.permission.READ_CONTACTS" />
```

### Status Bar Not Themed

Verify StatusBar plugin is installed:

```bash
npm install @capacitor/status-bar
npx cap sync
```

### App Loads Blank Screen

1. Check Vercel URL is accessible
2. Verify `server.url` in `capacitor.config.ts`
3. Check network connectivity
4. View logs: `adb logcat | grep Capacitor`

---

## 📊 Performance

### APK Size

- **Default Theme**: ~6-8MB
- **Vibe Finance**: ~6-8MB

### Load Time

- **First launch**: 2-3 seconds (network dependent)
- **Subsequent**: <1 second (cached)

### Contact Sync

- **500 contacts**: ~5-10 seconds
- **Incremental**: <2 seconds (weekly)

---

## 🔄 Update Strategy

### Web Updates (Instant)

Changes to web app (Vercel) reflect immediately in native apps without Play Store update.

### Native Updates (Play Store)

Required only for:

- Capacitor version upgrades
- New native plugins
- Android config changes
- Icon/splash screen updates

---

## 📝 Next Steps

1. ✅ Build debug APK and test on device
2. ✅ Test contact sync thoroughly
3. ✅ Generate production signing keys
4. ✅ Build release AAB
5. ✅ Create Play Store listings (2 separate apps)
6. ✅ Upload to Play Console for review
7. ✅ Monitor analytics and crashes

---

## 🆘 Support

- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio
- Play Console: https://play.google.com/console
