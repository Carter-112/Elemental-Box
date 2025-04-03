# Using PWA Builder with ElementalBox

## Android Package Building Issue Solution

If you encounter a 500 internal server error when building the Android package with PWA Builder, it's likely due to PWA Builder attempting to use Android SDK 35, which may not be available in their build environment.

### Using the Configuration File

1. When using PWA Builder, you have two options:

   a) **Web Interface**: 
   - After entering your site URL on PWA Builder
   - Before clicking "Build", look for "Advanced Settings" or "Configuration"
   - Upload the `pwabuilder-config.json` file provided in this repository

   b) **CLI**:
   - If using PWA Builder CLI, use the command:
   ```
   pwabuilder -m https://your-site-url/manifest.json -c ./pwabuilder-config.json
   ```

2. The configuration file sets the following Android settings:
   - `compileSdkVersion`: 34
   - `targetSdkVersion`: 34
   - `minSdkVersion`: 24

These settings ensure compatibility with the PWA Builder build environment.

## Manual Build Option

If PWA Builder still fails, download the source package and build it locally:

1. Download the generated Android source package from PWA Builder
2. Open `build.gradle` in the project
3. Modify these lines:
   ```
   compileSdkVersion 34
   defaultConfig {
       targetSdkVersion 34
       ...
   }
   ```
4. Build using Android Studio or Gradle directly

## Using Bubblewrap CLI

For more control, use Bubblewrap CLI directly:

```
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://your-site-url/manifest.json
cd twa-manifest
# Edit androidManifest.json to use SDK 34
bubblewrap build
``` 