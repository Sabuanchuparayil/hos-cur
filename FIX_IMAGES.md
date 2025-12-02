# Fix: Product Images Not Showing

## Problem
Product images are showing as black rectangles on the homepage instead of placeholder images.

## Root Cause
Existing products in the database don't have `ProductMedia` entries, or the media URLs are empty/invalid.

## Solution

### Step 1: Run the Image Update Script

This script will add placeholder images to all products that don't have images:

```bash
cd backend
npm run update-images
```

**Note**: Make sure your `DATABASE_URL` environment variable is set in `backend/.env`

### Step 2: Verify Images Are Added

After running the script, you should see output like:
```
✅ Successfully processed X products:
   - Created: X new images
   - Updated: X existing images
```

### Step 3: Refresh the Frontend

1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check the homepage - images should now display

## What the Script Does

1. Fetches all products from the database
2. For each product:
   - Generates a themed placeholder image URL based on fandom
   - Creates a `ProductMedia` entry if one doesn't exist
   - Updates existing media if URL is invalid
   - Skips products that already have custom images

## Image URL Format

The script generates placeholder images using `via.placeholder.com`:
- **Format**: `https://via.placeholder.com/800x800/{bgColor}/{textColor}?text={productName}`
- **Themed by Fandom**: Each fandom has custom colors
- **Size**: 800x800 pixels

## Troubleshooting

### If images still don't show:

1. **Check browser console** for CORS or network errors
2. **Verify database**: Check that `ProductMedia` table has entries
3. **Check API response**: Verify `/products` endpoint returns media URLs
4. **Test placeholder URL**: Try opening a placeholder URL directly in browser

### Manual Database Check

You can verify images in the database:
```sql
SELECT p.id, p.name, pm.url 
FROM "Product" p 
LEFT JOIN "ProductMedia" pm ON p.id = pm."productId" 
LIMIT 10;
```

## Alternative: Reseed Database

If the script doesn't work, you can reseed the database (this will reset all data):

```bash
cd backend
npm run prisma:seed
```

**Warning**: This will delete and recreate all products, users, and other data!

