# Using PWA Builder with ElementalBox

## Android Package Building Solution

The error you encountered (`Internal Server Error: Status code: 500`) is because PWA Builder is trying to use Android SDK 35, which isn't available in their build environment. 

We've created multiple configuration files to ensure compatibility - **at least one of these should work with PWA Builder**.

## Option 1: Using the Web Interface

When using PWA Builder's web interface (pwabuilder.com):

1. Enter your site URL
2. Before clicking "Build", look for "Advanced Options", "Settings", or a similar section
3. **Upload one of these configuration files** (try in this order):
   - `pwabuilder.json` (most likely to work)
   - `android-config.json`
   - `pwabuilder-config.json`

## Option 2: Using PWA Builder CLI

If using the command line:

```powershell
# Try one of these commands:
pwabuilder -m https://your-site-url/manifest.json -c ./pwabuilder.json
pwabuilder -m https://your-site-url/manifest.json -c ./android-config.json
pwabuilder -m https://your-site-url/manifest.json -c ./pwabuilder-config.json
```

## Option 3: Download and Modify Source Package

If PWA Builder allows you to download the Android source package:

1. Download the package
2. Open `build.gradle` and modify:
   ```
   compileSdkVersion 34  // Change from 35 to 34
   defaultConfig {
       targetSdkVersion 34  // Change from 35 to 34
       ...
   }
   ```
3. Build using Android Studio or Gradle:
   ```powershell
   ./gradlew bundleRelease
   ```

## Option 4: Use Bubblewrap CLI Directly

For more control:

```powershell
# Install bubblewrap
npm install -g @bubblewrap/cli

# Initialize project
bubblewrap init --manifest https://your-site-url/manifest.json

# Edit androidManifest.json in the created folder to use SDK 34
# Look for compileSdkVersion and targetSdkVersion and set to 34

# Build
cd twa-manifest
bubblewrap build
```

All configuration files in this project specify Android SDK 34, which is available in the PWA Builder environment. 