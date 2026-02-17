# Famous Finds - Mobile App Build & Submission Guide

## Overview

The Famous Finds web app is wrapped as a native mobile app using **Capacitor 8**. This guide covers building, signing, and submitting to both Google Play and Apple App Store.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18–22 | Build toolchain |
| Xcode | 15+ | iOS builds (macOS only) |
| Android Studio | Hedgehog+ | Android builds |
| CocoaPods | latest | iOS dependency management |
| Java JDK | 17 | Android builds |

---

## Project Configuration

- **App ID (Android):** `com.myfamousfinds.app`
- **App Name:** Famous Finds
- **Bundle ID (iOS):** `com.myfamousfinds.app`
- **Web Directory:** `out` (Next.js static export)

Configuration file: `capacitor.config.ts`

---

## 1. Initial Setup (One-Time)

### Install Dependencies

```bash
npm install
```

### Add Native Platforms

```bash
# Add iOS project
npx cap add ios

# Add Android project
npx cap add android
```

This creates `ios/` and `android/` directories with native project files.

---

## 2. Building the App

### Step 1: Static Export

```bash
npm run build:static
```

This runs `NEXT_EXPORT=true next build`, producing a static site in `out/`.

> **Note:** Server-side features (API routes, SSR) are not available in the mobile app. The mobile app operates as a static client connecting to your hosted API.

### Step 2: Sync to Native Projects

```bash
npx cap sync
```

This copies the `out/` directory into the native projects and installs native plugins.

### Combined Command

```bash
npm run mobile:build
```

Runs both steps above in sequence.

---

## 3. iOS (Apple App Store)

### Open in Xcode

```bash
npm run mobile:ios
# or: npx cap open ios
```

### Configure Signing

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the **App** target
3. Go to **Signing & Capabilities**
4. Select your **Team** (Apple Developer account required)
5. Set **Bundle Identifier** to `com.myfamousfinds.app`
6. Xcode will auto-manage provisioning profiles

### App Icons (iOS)

1. In Xcode, open `Assets.xcassets > AppIcon`
2. Drag the icons from `public/icons/` into the appropriate slots
3. Or use a tool like [App Icon Generator](https://www.appicon.co/) with the 512x512 icon

### Splash Screen

Configured in `capacitor.config.ts`:
- Background color: `#111827` (dark navy)
- Duration: 2000ms
- Immersive mode enabled

To customize the splash image:
1. Place your splash image in `ios/App/App/Assets.xcassets/Splash.imageset/`
2. Update `Contents.json` accordingly

### Build for Release

1. In Xcode, select **Product > Scheme > App**
2. Select **Any iOS Device** as the build target
3. Go to **Product > Archive**
4. Once archived, click **Distribute App**
5. Choose **App Store Connect** distribution
6. Follow the upload wizard

### App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app:
   - **Platform:** iOS
   - **Name:** Famous Finds
   - **Bundle ID:** com.myfamousfinds.app
   - **SKU:** famousfinds-ios
3. Fill in required metadata:
   - **Description:** Shop authenticated luxury bags, watches, jewelry, and fashion
   - **Category:** Shopping
   - **Keywords:** luxury, resale, designer, bags, watches, jewelry, fashion, authenticated
   - **Screenshots:** Required for 6.7" (iPhone 15 Pro Max) and 6.5" (iPhone 11 Pro Max)
   - **App Icon:** 1024x1024 PNG (no alpha)
   - **Privacy Policy URL:** `https://www.myfamousfinds.com/privacy`
   - **Support URL:** `https://www.myfamousfinds.com/contact`

### Required for Review

- [ ] Demo account credentials (if login required)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Export compliance (typically "No" for encryption)

---

## 4. Android (Google Play)

### Open in Android Studio

```bash
npm run mobile:android
# or: npx cap open android
```

### Configure Signing

#### Create a Keystore (One-Time)

```bash
keytool -genkey -v -keystore famousfinds-release.keystore \
  -alias famousfinds \
  -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANT:** Store this keystore file securely. You cannot update the app without it.

#### Configure Gradle Signing

Edit `android/app/build.gradle`:

```groovy
android {
    signingConfigs {
        release {
            storeFile file('famousfinds-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'famousfinds'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

> **Tip:** Use environment variables or `local.properties` for passwords instead of hardcoding.

### App Icons (Android)

1. In Android Studio, right-click `res` > **New > Image Asset**
2. Select **Launcher Icons**
3. Use `public/icons/icon-512x512.png` as the source
4. Generate all density variants

### Build AAB (App Bundle)

```bash
cd android
./gradlew bundleRelease
```

The signed AAB file will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Google Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app:
   - **App name:** Famous Finds
   - **Default language:** English (US)
   - **App type:** App
   - **Free or paid:** Free
3. Complete the setup checklist:
   - **Store listing:**
     - Short description (80 chars): "Shop authenticated luxury fashion, bags, watches & jewelry"
     - Full description: detailed app description
     - Screenshots: Phone (min 2), 7-inch tablet, 10-inch tablet
     - Feature graphic: 1024x500 PNG
     - App icon: 512x512 PNG
   - **Content rating:** Complete the questionnaire
   - **Target audience:** 18+ (luxury marketplace)
   - **Privacy policy:** `https://www.myfamousfinds.com/privacy`
4. Upload the AAB:
   - Go to **Release > Production**
   - Create a new release
   - Upload `app-release.aab`
   - Add release notes
   - Review and roll out

---

## 5. Push Notifications Setup

### Firebase Cloud Messaging (Android)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add Android app with package name `com.myfamousfinds.app`
3. Download `google-services.json` to `android/app/`
4. FCM is already configured via `@capacitor/push-notifications`

### Apple Push Notification Service (iOS)

1. In Apple Developer portal, create an APNs key:
   - Go to **Keys > Create a Key**
   - Enable **Apple Push Notifications service (APNs)**
   - Download the `.p8` key file
2. Add push notification capability in Xcode:
   - Select App target > **Signing & Capabilities**
   - Click **+ Capability > Push Notifications**
3. Upload the APNs key to Firebase for unified push delivery

---

## 6. Environment Variables

For mobile builds, ensure these are set in your `.env` or build config:

```env
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_API_BASE=https://www.myfamousfinds.com
```

The mobile app will call your hosted API endpoints for all server-side operations (PayPal, Firestore, etc.).

---

## 7. Testing

### iOS Simulator

```bash
npx cap run ios
```

### Android Emulator

```bash
npx cap run android
```

### Physical Device Testing

1. Connect device via USB
2. Enable developer mode on the device
3. Run `npx cap run ios --target=<device-id>` or `npx cap run android --target=<device-id>`

---

## 8. Update Workflow

When you make changes to the web app:

```bash
# 1. Build the static export
npm run build:static

# 2. Sync changes to native projects
npx cap sync

# 3. Open and build in IDE
npx cap open ios    # or android
```

For minor web-only changes, you can also use Capacitor's live reload during development:

```bash
npx cap run ios --livereload --external
```

---

## 9. Checklist Before Submission

### Both Platforms
- [ ] App icon at all required sizes
- [ ] Splash screen configured
- [ ] Privacy policy page live at public URL
- [ ] Terms of service page live at public URL
- [ ] All API endpoints accessible from mobile app
- [ ] Push notifications tested
- [ ] Deep links configured (if applicable)
- [ ] Analytics tracking verified

### iOS Specific
- [ ] Screenshots for required device sizes (6.7", 6.5")
- [ ] App Store description and keywords
- [ ] Age rating questionnaire completed
- [ ] Export compliance answered
- [ ] Review notes with demo credentials

### Android Specific
- [ ] Signed AAB (not APK) for Play Store
- [ ] Feature graphic (1024x500)
- [ ] Content rating questionnaire
- [ ] Data safety form completed
- [ ] Target API level meets Play Store requirements (API 34+)

---

## 10. Useful Commands Reference

| Command | Description |
|---------|-------------|
| `npm run mobile:build` | Build static export + sync to native |
| `npm run mobile:ios` | Build + open iOS in Xcode |
| `npm run mobile:android` | Build + open Android in Android Studio |
| `npx cap sync` | Sync web assets to native projects |
| `npx cap run ios` | Run on iOS simulator |
| `npx cap run android` | Run on Android emulator |
| `npx cap doctor` | Check Capacitor environment health |
