# S3 Integration - TODO (Paused)

## Current Status
S3 integration has been paused. The project currently uses placeholder.com for product images, which works well for development and testing.

## What's Been Prepared

### Files Created (Ready for Future Use)
1. **`backend/src/utils/s3Service.js`** - S3 service utilities
   - `uploadImageToS3()` - Upload images to S3
   - `generateProductImage()` - Generate product images using SVG + Sharp
   - `generateCategoryImage()` - Generate category images
   - `deleteImageFromS3()` - Delete images from S3
   - `getPresignedUrl()` - Get temporary access URLs

2. **`backend/src/routes/media.js`** - Media upload endpoints
   - `POST /media/upload` - Upload image files
   - `POST /media/generate-product` - Generate and upload product images
   - `POST /media/generate-category` - Generate and upload category images

3. **Route Integration** - Media routes are registered in `backend/src/index.js`

### Dependencies Installed
- `@aws-sdk/client-s3` ✅
- `@aws-sdk/s3-request-presigner` ✅
- `sharp` - Still needs to be installed (for image generation)

## Current Image Setup (Working)

### Placeholder Images
- **Service**: `via.placeholder.com`
- **Format**: `https://via.placeholder.com/800x800/{bgColor}/{textColor}?text={productName}`
- **Themed by Fandom**: Each fandom has custom colors
- **Location**: URLs stored in `ProductMedia` table

### Seed Script
The seed script (`backend/prisma/seed.js`) automatically generates placeholder images for all products based on:
- Product name
- Fandom (for color theme)
- Sub-category

## To Complete S3 Integration Later

### Step 1: Install Remaining Dependencies
```bash
cd backend
npm install sharp
```

### Step 2: Set Up AWS Credentials
Add to `backend/.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

### Step 3: Create S3 Bucket
1. Go to AWS Console → S3
2. Create a new bucket
3. Configure CORS (for frontend access):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```
4. Set bucket policy for public read access (if needed)

### Step 4: Run Migration Script
Create and run a script to:
1. Generate images for all existing products
2. Upload to S3
3. Update database with S3 URLs

### Step 5: Update Frontend
No changes needed - frontend already handles image URLs correctly!

## Current Working Solution

The placeholder.com solution is:
- ✅ Simple and reliable
- ✅ No setup required
- ✅ Works immediately
- ✅ Themed by fandom
- ✅ No storage costs

You can continue using this until ready for S3 migration.

