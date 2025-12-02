# Image Setup Documentation

## Overview
This document describes how product images are stored and managed in the House of Spells e-commerce platform.

## Image Storage

### Storage Method
- **Type**: URL-based storage (no local file storage)
- **Location**: Image URLs are stored in the `ProductMedia` database table
- **Service**: Currently using `via.placeholder.com` for placeholder images

### Database Schema
Images are stored in the `ProductMedia` table with the following structure:
```prisma
model ProductMedia {
  id        Int    @id @default(autoincrement())
  productId Int
  type      String @default("image") // image, video, image_360
  url       String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

## Image URLs

### Current Implementation
Product images use placeholder.com with themed colors based on the product's fandom:

- **Harry Potter**: `https://via.placeholder.com/800x800/4a0202/ffffff?text=PRODUCT_NAME`
- **Lord of the Rings**: `https://via.placeholder.com/800x800/1a1a1a/d4af37?text=PRODUCT_NAME`
- **Other Fandoms**: `https://via.placeholder.com/800x800/1a1a2e/e94560?text=PRODUCT_NAME`

### Image Format
- **Size**: 800x800 pixels
- **Format**: PNG (via placeholder.com)
- **Text**: Product name (English) encoded in URL

## Adding Images to Products

### Method 1: Using the Seed Script
The seed script (`backend/prisma/seed.js`) automatically generates appropriate placeholder images for all products based on their fandom and name.

### Method 2: Using the Update Script
Run the Node.js script to update existing products:
```bash
cd backend
npm run add-images
```

**Note**: This script requires the `DATABASE_URL` environment variable to be set.

### Method 3: Manual SQL Update
Use the SQL script (`backend/scripts/update-product-images.sql`) to update images directly in the database.

## Categories

### Category Images
Categories are not stored as separate entities. Instead:
- **Fandom categories** are displayed using dynamically generated SVG images (see `src/components/FeaturedPhantoms.tsx`)
- **Sub-categories** are text-based filters, not visual categories

The `FeaturedFandoms` component generates SVG images on-the-fly with themed colors for each fandom.

## API Response

The API returns product images in the following format:
```json
{
  "media": [
    {
      "type": "image",
      "url": "https://via.placeholder.com/800x800/4a0202/ffffff?text=Product+Name"
    }
  ]
}
```

The `formatProduct` function in `backend/src/routes/products.js` ensures media URLs are correctly included in API responses.

## Frontend Display

### Product Cards
- **Component**: `src/components/ProductCard.tsx`
- **Image Source**: `product.media[0].url`
- **Fallback**: If image fails to load, displays a placeholder with the product name

### Product Detail Page
- **Component**: `src/components/ProductMediaGallery.tsx`
- **Features**: 
  - Main image display
  - Thumbnail gallery
  - Support for multiple media types (image, video, 360° view)
  - Error handling with fallback placeholder

### Error Handling
Both `ProductCard` and `ProductMediaGallery` include `onError` handlers that:
1. Detect when an image fails to load
2. Automatically replace with a fallback placeholder
3. Ensure the UI never shows broken image icons

## Future Improvements

### Recommended Next Steps
1. **CDN Integration**: Migrate to a CDN service (e.g., Cloudinary, AWS S3) for better performance
2. **Image Optimization**: Implement image optimization and multiple sizes (thumbnails, medium, large)
3. **Upload System**: Add an image upload interface in the admin panel
4. **Image Management**: Create a media library for reusing images across products

### Migration Path
When ready to migrate from placeholder images:
1. Upload actual product images to your chosen storage service
2. Update the `ProductMedia` table with new URLs
3. The frontend will automatically display the new images (no code changes needed)

## Storage Path Summary

- **Database Table**: `ProductMedia`
- **URL Field**: `url` (VARCHAR/TEXT)
- **Image Service**: `via.placeholder.com` (current)
- **Frontend Assets**: No local image storage (all URLs)

## Verification

To verify images are working correctly:
1. Check that all products have at least one entry in `ProductMedia`
2. Verify API responses include the `media` array with valid URLs
3. Test frontend displays images without errors
4. Check browser console for any 404 errors on image URLs

