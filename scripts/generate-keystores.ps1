# Android Keystore Generation Script
# This script generates keystores for both Default and Vibe Finance apps
# Run this script locally and DO NOT commit the generated keystores or credentials file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android Keystore Generation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if keytool is available
$keytoolPath = $null
try {
    $keytoolPath = (Get-Command keytool -ErrorAction SilentlyContinue).Source
} catch {}

if (-not $keytoolPath) {
    Write-Host "ERROR: keytool not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "keytool is part of the Java Development Kit (JDK)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install JDK 21 from:" -ForegroundColor White
    Write-Host "https://adoptium.net/temurin/releases/?version=21" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation:" -ForegroundColor White
    Write-Host "1. Add JDK bin folder to PATH (e.g., C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot\bin)" -ForegroundColor White
    Write-Host "2. Restart PowerShell" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✓ Found keytool at: $keytoolPath" -ForegroundColor Green
Write-Host ""

# Configuration
$keystoreDir = "android-keystores"
$defaultKeystoreFile = "$keystoreDir/expense-tracker-release.keystore"
$vibeKeystoreFile = "$keystoreDir/vibe-finance-release.keystore"
$credentialsFile = "$keystoreDir/KEYSTORE_CREDENTIALS.txt"

# Generate random secure passwords
function Generate-SecurePassword {
    $length = 16
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $password = -join ((1..$length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $password
}

# Create directory for keystores
Write-Host "Creating keystore directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $keystoreDir | Out-Null

# Generate passwords
$defaultKeystorePassword = Generate-SecurePassword
$defaultKeyPassword = Generate-SecurePassword
$vibeKeystorePassword = Generate-SecurePassword
$vibeKeyPassword = Generate-SecurePassword

Write-Host "Generated secure passwords" -ForegroundColor Green
Write-Host ""

# Default configuration for DN (Distinguished Name)
$dname = "CN=Expense Tracker, OU=Development, O=K-Tech Solutions, L=Pune, ST=Maharashtra, C=IN"

# Generate Default Theme Keystore
Write-Host "Generating Default Theme (Expense Tracker) keystore..." -ForegroundColor Yellow
$defaultCommand = "keytool -genkey -v -keystore `"$defaultKeystoreFile`" -alias expense-tracker -keyalg RSA -keysize 2048 -validity 10000 -storepass `"$defaultKeystorePassword`" -keypass `"$defaultKeyPassword`" -dname `"$dname`""
Invoke-Expression $defaultCommand

if (Test-Path $defaultKeystoreFile) {
    Write-Host "✓ Default theme keystore generated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate default theme keystore" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Generate Vibe Finance Theme Keystore
Write-Host "Generating Vibe Finance Theme keystore..." -ForegroundColor Yellow
$vibeDname = "CN=Vibe Finance, OU=Development, O=K-Tech Solutions, L=Pune, ST=Maharashtra, C=IN"
$vibeCommand = "keytool -genkey -v -keystore `"$vibeKeystoreFile`" -alias vibe-finance -keyalg RSA -keysize 2048 -validity 10000 -storepass `"$vibeKeystorePassword`" -keypass `"$vibeKeyPassword`" -dname `"$vibeDname`""
Invoke-Expression $vibeCommand

if (Test-Path $vibeKeystoreFile) {
    Write-Host "✓ Vibe Finance theme keystore generated successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Vibe Finance theme keystore" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Convert keystores to Base64
Write-Host "Converting keystores to Base64..." -ForegroundColor Yellow
$defaultBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $defaultKeystoreFile)))
$vibeBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $vibeKeystoreFile)))
Write-Host "✓ Base64 conversion complete" -ForegroundColor Green
Write-Host ""

# Create credentials file
Write-Host "Saving credentials to file..." -ForegroundColor Yellow

# Build the credentials content
$credentialsContent = "=" * 80 + "`n"
$credentialsContent += "ANDROID KEYSTORE CREDENTIALS`n"
$credentialsContent += "=" * 80 + "`n"
$credentialsContent += "WARNING: KEEP THIS FILE SECURE AND DO NOT COMMIT TO GIT`n`n"
$credentialsContent += "Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"

$credentialsContent += "=" * 80 + "`n"
$credentialsContent += "DEFAULT THEME (EXPENSE TRACKER)`n"
$credentialsContent += "=" * 80 + "`n`n"
$credentialsContent += "Keystore File: $defaultKeystoreFile`n"
$credentialsContent += "Key Alias: expense-tracker`n"
$credentialsContent += "Keystore Password: $defaultKeystorePassword`n"
$credentialsContent += "Key Password: $defaultKeyPassword`n`n"
$credentialsContent += "GitHub Secret: KEYSTORE_BASE64`n"
$credentialsContent += "Value (Base64):`n$defaultBase64`n`n"
$credentialsContent += "GitHub Secret: KEYSTORE_PASSWORD`n"
$credentialsContent += "Value: $defaultKeystorePassword`n`n"
$credentialsContent += "GitHub Secret: KEY_ALIAS`n"
$credentialsContent += "Value: expense-tracker`n`n"
$credentialsContent += "GitHub Secret: KEY_PASSWORD`n"
$credentialsContent += "Value: $defaultKeyPassword`n`n"

$credentialsContent += "=" * 80 + "`n"
$credentialsContent += "VIBE FINANCE THEME`n"
$credentialsContent += "=" * 80 + "`n`n"
$credentialsContent += "Keystore File: $vibeKeystoreFile`n"
$credentialsContent += "Key Alias: vibe-finance`n"
$credentialsContent += "Keystore Password: $vibeKeystorePassword`n"
$credentialsContent += "Key Password: $vibeKeyPassword`n`n"
$credentialsContent += "GitHub Secret: KEYSTORE_BASE64_VIBE`n"
$credentialsContent += "Value (Base64):`n$vibeBase64`n`n"
$credentialsContent += "GitHub Secret: KEYSTORE_PASSWORD_VIBE`n"
$credentialsContent += "Value: $vibeKeystorePassword`n`n"
$credentialsContent += "GitHub Secret: KEY_ALIAS_VIBE`n"
$credentialsContent += "Value: vibe-finance`n`n"
$credentialsContent += "GitHub Secret: KEY_PASSWORD_VIBE`n"
$credentialsContent += "Value: $vibeKeyPassword`n`n"

$credentialsContent += "=" * 80 + "`n"
$credentialsContent += "NEXT STEPS`n"
$credentialsContent += "=" * 80 + "`n`n"
$credentialsContent += "Step 1: Go to GitHub repository - Settings - Secrets and variables - Actions`n`n"
$credentialsContent += "Step 2: Add the following secrets (click 'New repository secret' for each):`n`n"
$credentialsContent += "   For Default Theme:`n"
$credentialsContent += "   - KEYSTORE_BASE64 (paste the Base64 value above)`n"
$credentialsContent += "   - KEYSTORE_PASSWORD (paste the password above)`n"
$credentialsContent += "   - KEY_ALIAS (paste: expense-tracker)`n"
$credentialsContent += "   - KEY_PASSWORD (paste the key password above)`n`n"
$credentialsContent += "   For Vibe Finance Theme:`n"
$credentialsContent += "   - KEYSTORE_BASE64_VIBE (paste the Base64 value above)`n"
$credentialsContent += "   - KEYSTORE_PASSWORD_VIBE (paste the password above)`n"
$credentialsContent += "   - KEY_ALIAS_VIBE (paste: vibe-finance)`n"
$credentialsContent += "   - KEY_PASSWORD_VIBE (paste the key password above)`n`n"
$credentialsContent += "Step 3: Backup this entire folder to a secure location`n"
$credentialsContent += "        (password manager, encrypted drive, etc.)`n`n"
$credentialsContent += "Step 4: NEVER commit the keystore files or this credentials file to Git`n`n"
$credentialsContent += "Step 5: Trigger a release build in GitHub Actions to test signing`n`n"
$credentialsContent += "=" * 80 + "`n"

$credentialsContent | Out-File -FilePath $credentialsFile -Encoding UTF8
Write-Host "✓ Credentials saved to: $credentialsFile" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUCCESS! Keystores Generated" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files created in '$keystoreDir':" -ForegroundColor White
Write-Host "  • expense-tracker-release.keystore" -ForegroundColor Green
Write-Host "  • vibe-finance-release.keystore" -ForegroundColor Green
Write-Host "  • KEYSTORE_CREDENTIALS.txt (contains all passwords and Base64)" -ForegroundColor Green
Write-Host ""
Write-Host "WARNING IMPORTANT:" -ForegroundColor Yellow
Write-Host "  1. Open KEYSTORE_CREDENTIALS.txt and copy the secrets to GitHub" -ForegroundColor White
Write-Host "  2. Backup the entire $keystoreDir folder securely" -ForegroundColor White
Write-Host "  3. DO NOT commit these files to Git (already in .gitignore)" -ForegroundColor White
Write-Host ""
Write-Host "Opening credentials file..." -ForegroundColor Yellow
Start-Process notepad.exe -ArgumentList $credentialsFile
