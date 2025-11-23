# Installing Inbox as a Native App on iOS

Your app is now configured as a Progressive Web App (PWA) that can be installed on iOS devices as a native-like app.

## How to Install on iOS

1. **Open Safari** on your iPhone or iPad
   - Navigate to your deployed app URL
   - Note: Must use Safari browser (not Chrome or other browsers)

2. **Tap the Share button** 
   - Look for the share icon (square with an arrow pointing up) at the bottom of the screen

3. **Select "Add to Home Screen"**
   - Scroll down in the share menu
   - Tap "Add to Home Screen"

4. **Confirm Installation**
   - You'll see the app icon and name
   - Tap "Add" in the top right corner

5. **Launch the App**
   - The app icon will appear on your home screen
   - Tap it to launch the app in full-screen mode
   - It will look and feel like a native iOS app!

## Features

✅ **Runs in full-screen mode** - No browser UI  
✅ **Appears on home screen** - With custom app icon  
✅ **Works offline** - Service worker caches assets  
✅ **Safe area support** - Respects iPhone notch and home indicator  
✅ **Native-like experience** - Standalone display mode  

## Technical Details

### Files Added/Modified:
- `public/manifest.json` - PWA manifest with app metadata
- `public/sw.js` - Service worker for offline functionality
- `public/icon-*.png` - App icons in various sizes
- `index.html` - Added iOS-specific meta tags and manifest link
- `src/main.jsx` - Service worker registration
- `src/index.css` - iOS safe area and PWA styles

### iOS-Specific Meta Tags:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Inbox">
<link rel="apple-touch-icon" sizes="180x180" href="./icon-180.png">
```

## Customization

### Replace App Icons
The current icons are placeholder designs. To use your own icons:

1. Create PNG images in these sizes:
   - 152x152 (iPad)
   - 167x167 (iPad Pro)
   - 180x180 (iPhone)
   - 192x192 (Android)
   - 512x512 (Android, high-res)

2. Replace the files in `public/` directory:
   - `icon-152.png`
   - `icon-167.png`
   - `icon-180.png`
   - `icon-192.png`
   - `icon-512.png`

### Update App Name
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "YourApp",
  ...
}
```

Also update in `index.html`:
```html
<meta name="apple-mobile-web-app-title" content="Your App Name">
<title>Your App Name</title>
```

### Change Theme Color
Edit `public/manifest.json` and `index.html`:
```json
"theme_color": "#your-color"
```

```html
<meta name="theme-color" content="#your-color">
```

## Testing

Before deploying, test the PWA:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Preview the production build:**
   ```bash
   npm run preview
   ```

3. **Test on a real iOS device** using Safari

## Deployment

Deploy your app to a hosting service with HTTPS (required for PWAs):
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

Make sure the `base` in `vite.config.js` matches your deployment path.

## Troubleshooting

**App doesn't install:**
- Ensure you're using Safari (not Chrome)
- Check that the site is served over HTTPS
- Verify manifest.json is accessible

**Icons don't appear:**
- Check that icon files exist in the public directory
- Verify file paths in manifest.json match your deployment base path

**App doesn't work offline:**
- Check browser console for service worker errors
- Verify service worker is registered successfully
- Clear cache and reinstall the app
