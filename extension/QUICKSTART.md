# Quick Start: Publishing Your Extension

## Before You Start

1. Deploy your Next.js app to Vercel
2. Note your production URL (e.g., `https://shelf-app.vercel.app`)

## Step 1: Configure Production URL

Edit `extension/config.js`:

```javascript
const PROD_URL = "https://your-actual-vercel-url.vercel.app";
const ENV = "prod";
```

## Step 2: Build the Extension

```bash
npm run build:extension
```

This updates all extension files with your production URL.

## Step 3: Package for Distribution

```bash
npm run package:extension
```

This creates `shelf-extension.zip` in the project root.

## Step 4: Submit to Stores

### Chrome Web Store (Recommended - covers Chrome, Edge, Brave, Opera)

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay $5 one-time registration fee
3. Click "New Item"
4. Upload `shelf-extension.zip`
5. Fill in:
   - Name: Shelf - Save Bookmarks
   - Description: Detailed description
   - Category: Productivity
   - Screenshots (required): 1280x800 or 640x400
   - Privacy Policy URL (required)
   - Support URL
6. Submit for review (1-3 business days)

### Firefox Add-ons

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Create free developer account
3. Click "Submit a New Add-on"
4. Upload `shelf-extension.zip`
5. Fill in required information
6. Submit (usually faster than Chrome, hours to 1 day)

### Edge Add-ons

1. Go to [Partner Center](https://partner.microsoft.com/dashboard)
2. Register as developer (free)
3. Navigate to Edge Add-ons
4. Upload and submit

## Testing Before Submission

1. Load the extension manually:
   - Chrome: Extensions → Developer mode → Load unpacked → Select `extension` folder
   - Firefox: about:debugging → This Firefox → Load Temporary Add-on
2. Test all features work with your production URL
3. Verify authentication flow
4. Test bookmark saving

## Updating the Extension

1. Update version in `extension/manifest.json`
2. Update `config.js` if URL changed
3. Run `npm run build:extension`
4. Run `npm run package:extension`
5. Upload new zip to store dashboards

## Need Help?

See `DISTRIBUTION.md` for detailed information about each store's requirements and review process.
