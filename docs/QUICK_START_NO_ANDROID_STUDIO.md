# 🚀 Quick Start Guide - Build Android Apps Without Android Studio

## Step-by-Step Instructions (Windows)

### 1. Install Java JDK 17

**Download:**

- Go to: https://adoptium.net/
- Download **OpenJDK 17 (LTS)** for Windows
- Run installer and complete setup

**Verify Installation:**

```powershell
java -version
# Should show: openjdk version "17.x.x"
```

---

### 2. Install Android SDK Command Line Tools

**Download Command Line Tools:**

1. Go to: https://developer.android.com/studio#command-line-tools-only
2. Download **Command line tools only** for Windows
3. Extract the zip file

**Setup Directory Structure:**

```powershell
# Create Android SDK directory
New-Item -ItemType Directory -Path "C:\Android\cmdline-tools" -Force

# Move extracted folder to:
# C:\Android\cmdline-tools\latest
```

**Set Environment Variables:**

```powershell
# Open PowerShell as Administrator and run:

# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Android", "User")

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = "$currentPath;C:\Android\cmdline-tools\latest\bin;C:\Android\platform-tools"
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")

# Restart PowerShell to apply changes
```

**Install Required SDK Packages:**

```powershell
# Accept all licenses
sdkmanager --licenses

# Install platform tools and build tools
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

---

### 3. Verify Setup

```powershell
# Check Java
java -version

# Check Android SDK
sdkmanager --version

# Check ADB (Android Debug Bridge)
adb version
```

---

### 4. Build Your App

```powershell
# Navigate to your project
cd D:\Ketan-K\expense-tracker

# Sync Capacitor
npm run cap:sync

# Build debug APK
cd android
gradlew.bat assembleDebug

# APK will be at:
# android\app\build\outputs\apk\debug\app-debug.apk
```

---

### 5. Install on Your Phone

**Method 1: USB Cable**

```powershell
# Enable USB Debugging on phone:
# Settings → About Phone → Tap "Build Number" 7 times
# Settings → Developer Options → Enable USB Debugging

# Connect phone and run:
adb devices

# Install APK
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

**Method 2: File Transfer (No Cable)**

1. Copy `app-debug.apk` to Google Drive or email to yourself
2. Download on phone
3. Tap to install (allow "Install from Unknown Sources")

---

## Build Vibe Finance Theme

### 1. Update Package Name

Edit `android\app\build.gradle`:

```groovy
android {
    namespace "com.vibefinance.app"
    defaultConfig {
        applicationId "com.vibefinance.app"
        // ... rest stays same
    }
}
```

### 2. Update App Name

Edit `android\app\src\main\res\values\strings.xml`:

```xml
<resources>
    <string name="app_name">Vibe Finance</string>
    <string name="title_activity_main">Vibe Finance</string>
    <string name="package_name">com.vibefinance.app</string>
    <string name="custom_url_scheme">com.vibefinance.app</string>
</resources>
```

### 3. Build

```powershell
npm run cap:sync:vibe
cd android
gradlew.bat assembleDebug
```

---

## Common Issues & Solutions

### "gradlew.bat is not recognized"

Make sure you're in the `android` folder:

```powershell
cd android
gradlew.bat assembleDebug
```

### "ANDROID_HOME is not set"

Restart PowerShell after setting environment variables, or set temporarily:

```powershell
$env:ANDROID_HOME = "C:\Android"
$env:Path += ";C:\Android\cmdline-tools\latest\bin;C:\Android\platform-tools"
```

### "sdkmanager: command not found"

Verify the directory structure is correct:

```
C:\Android\
  └── cmdline-tools\
      └── latest\
          └── bin\
              └── sdkmanager.bat
```

### "adb: command not found"

Install platform-tools:

```powershell
sdkmanager "platform-tools"
```

Then add to PATH:

```powershell
$env:Path += ";C:\Android\platform-tools"
```

### App shows blank screen

Check that your Vercel app is accessible by visiting the URL in a browser:

- Default: https://expense-tracker-io.vercel.app
- Vibe: https://vibe-finance-io.vercel.app

---

## Build Signed APK for Play Store

### 1. Generate Signing Key

```powershell
# Navigate to android folder
cd android

# Generate keystore
keytool -genkey -v -keystore expense-tracker-release.keystore -alias expense-tracker -keyalg RSA -keysize 2048 -validity 10000

# Answer the prompts (remember the passwords!)
```

### 2. Create keystore.properties

Create `android\keystore.properties`:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=expense-tracker
storeFile=expense-tracker-release.keystore
```

### 3. Update build.gradle

Edit `android\app\build.gradle`, add before `android {`:

```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

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

### 4. Build Release AAB

```powershell
cd android
gradlew.bat bundleRelease

# AAB will be at:
# android\app\build\outputs\bundle\release\app-release.aab
```

Upload this AAB to Google Play Console.

---

## Next Steps

1. ✅ Build debug APK
2. ✅ Test on your Android phone
3. ✅ Test contact sync feature
4. ✅ Generate signing key
5. ✅ Build release AAB
6. ✅ Submit to Play Store

---

## Need Help?

- Full documentation: [docs/android-build.md](android-build.md)
- Capacitor Docs: https://capacitorjs.com/docs
- Android Developer: https://developer.android.com/studio/build/building-cmdline
