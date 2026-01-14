# Browser Extension Distribution Guide

This guide covers how to publish your Shelf extension to browser stores so users can install it.

## Prerequisites

1. **Update production URL**: Before distribution, update the extension to use your Vercel domain instead of localhost
2. **Package the extension**: Create a zip file of the extension directory
3. **Store accounts**: Create developer accounts on the stores you want to publish to

## Step 1: Update Extension for Production

Before packaging, update the extension configuration:

1. Edit `extension/config.js`:
   - Set `PROD_URL` to your Vercel domain (e.g., `"https://shelf-app.vercel.app"`)
   - Set `ENV` to `"prod"`
2. Run the build script: `npm run build:extension`

This automatically updates all extension files (`background.js`, `popup.js`, `content.js`, `manifest.json`) with your production domain.

## Step 2: Package the Extension

Create a zip file containing all extension files (excluding development files):

```bash
cd extension
zip -r ../shelf-extension-v1.0.0.zip . -x "*.md" "*.DS_Store" "README.md" "DISTRIBUTION.md"
```

Or use the npm script:

```bash
npm run package:extension
```

## Step 3: Chrome Web Store (Chrome, Edge, Brave, Opera)

### Setup

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee
3. Click "New Item" and upload your zip file

### Required Information

- **Name**: Shelf - Save Bookmarks
- **Description**: Detailed description of what the extension does
- **Category**: Productivity
- **Screenshots**:
  - 1280x800 or 640x400 (required)
  - Show the extension in action
- **Promotional Images** (optional):
  - Small tile: 440x280
  - Marquee: 920x680
- **Privacy Policy URL**: Link to your privacy policy (required)
- **Support URL**: Link to your support/help page

### Review Process

- Initial review: 1-3 business days
- Updates: Usually faster (hours to 1 day)
- Extensions are reviewed for policy compliance

### After Approval

- Users can install from Chrome Web Store
- Updates are automatically pushed to users
- Analytics available in developer dashboard

## Step 4: Firefox Add-ons (Firefox)

### Setup

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Create a developer account (free)
3. Click "Submit a New Add-on"

### Required Information

- **Name**: Shelf - Save Bookmarks
- **Summary**: Short description (max 250 characters)
- **Description**: Full description
- **Screenshots**:
  - At least one screenshot required
  - Recommended: 1280x720 or 1920x1080
- **Privacy Policy**: Required if you collect data
- **Support Email**: Your support email

### Manifest Differences

Firefox supports Manifest V3, but you may need to:

- Test thoroughly in Firefox
- Some Chrome-specific APIs might need alternatives
- Review [Firefox extension documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

### Review Process

- Automated review: Usually within hours
- Manual review: If flagged, 1-3 days
- Generally faster than Chrome Web Store

## Step 5: Microsoft Edge Add-ons (Edge)

### Setup

1. Go to [Partner Center](https://partner.microsoft.com/dashboard)
2. Register as a developer (free)
3. Navigate to Edge Add-ons section
4. Submit your extension

### Required Information

- Similar to Chrome Web Store requirements
- Screenshots and descriptions
- Privacy policy

### Review Process

- Usually faster than Chrome (same codebase)
- 1-2 business days typically

## Step 6: Direct Distribution (Alternative)

For internal use or testing, you can distribute the extension directly:

1. Host the zip file on your website
2. Users download and install manually:
   - Chrome: Extensions → Developer mode → Load unpacked
   - Firefox: about:debugging → This Firefox → Load Temporary Add-on

**Note**: Direct distribution has limitations:

- Users must manually install updates
- Chrome shows warnings for unpacked extensions
- Not suitable for general public distribution

## Best Practices

1. **Version Management**: Update version in `manifest.json` for each release
2. **Testing**: Test thoroughly before each submission
3. **Privacy**: Have a clear privacy policy explaining data collection
4. **Support**: Provide support email or help page
5. **Updates**: Plan for regular updates and bug fixes
6. **Screenshots**: Use clear, high-quality screenshots showing key features

## Updating the Extension

When you need to update:

1. Update version in `manifest.json`
2. Update production URL if needed
3. Package new version
4. Upload to each store's developer dashboard
5. Submit for review (updates are usually faster)

## Troubleshooting

- **Rejected submissions**: Check store policies and error messages
- **Review delays**: Contact store support if review takes too long
- **Installation issues**: Test on multiple browsers before submission
