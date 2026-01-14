# Chrome Web Store Submission Checklist

## Pre-Submission Steps

### 1. Update Production URL
Edit `extension/config.js`:
- Set `PROD_URL` to your actual Vercel domain
- Set `ENV` to `"prod"`

### 2. Build & Package
```bash
npm run build:extension
npm run package:extension
```

This creates `shelf-extension.zip` in the project root.

### 3. Test Locally (Important!)
Before submitting, test the extension:
1. Chrome → Extensions → Developer mode → Load unpacked
2. Select the `extension` folder
3. Test all features with your production URL
4. Verify authentication works
5. Test bookmark saving

## Chrome Web Store Submission

### Required Information

1. **Name**: Shelf - Save Bookmarks
2. **Description** (up to 132 characters for short, unlimited for detailed):
   ```
   Save any webpage to your Shelf bookmarks with one click. 
   Organize and search your bookmarks with semantic search powered by AI.
   ```
3. **Category**: Productivity
4. **Language**: English (and any others you support)

### Required Assets

1. **Screenshots** (at least one, recommended 2-5):
   - Size: 1280x800 or 640x400 pixels
   - Show the extension in action
   - Examples:
     - Extension popup/overlay saving a bookmark
     - Main Shelf app interface
     - Search functionality
     - Context menu options

2. **Promotional Images** (optional but recommended):
   - Small tile: 440x280 pixels
   - Marquee: 920x680 pixels

3. **Privacy Policy URL** (REQUIRED):
   - Must be publicly accessible
   - Explain what data you collect
   - Example: `https://your-app.vercel.app/privacy`

4. **Support URL** (recommended):
   - Help page or support email
   - Example: `https://your-app.vercel.app/support`

### Submission Steps

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **"New Item"**
3. Upload `shelf-extension.zip`
4. Fill in all required fields:
   - Name
   - Description (short and detailed)
   - Category
   - Screenshots
   - Privacy Policy URL
   - Support URL
5. Review all information
6. Click **"Submit for Review"**

### Review Process

- **Initial review**: 1-3 business days
- **Updates**: Usually faster (hours to 1 day)
- You'll receive email notifications about status changes

### Common Rejection Reasons

- Missing privacy policy
- Vague or incomplete description
- Poor quality screenshots
- Extension doesn't work as described
- Violates Chrome Web Store policies

### After Approval

- Extension goes live immediately
- Users can install from Chrome Web Store
- Updates are automatically pushed to users
- Analytics available in dashboard

## Quick Commands

```bash
# Update config.js first, then:
npm run build:extension
npm run package:extension

# Test locally:
# Chrome → Extensions → Developer mode → Load unpacked → Select extension folder
```
