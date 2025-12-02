const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');
const { uploadImageToS3, generateProductImage, generateCategoryImage } = require('../utils/s3Service');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /media/upload
 * Upload an image file to S3
 */
router.post(
  '/upload',
  authenticate,
  authorize(['admin', 'seller', 'catalog_manager']),
  writeLimiter,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Generate unique key based on timestamp and original filename
      const timestamp = Date.now();
      const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `products/${timestamp}-${sanitizedFilename}`;

      // Upload to S3
      const url = await uploadImageToS3(req.file.buffer, key, req.file.mimetype);

      res.json({
        success: true,
        url,
        key,
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image: ' + error.message });
    }
  }
);

/**
 * POST /media/generate-product
 * Generate a dummy product image and upload to S3
 */
router.post(
  '/generate-product',
  authenticate,
  authorize(['admin', 'catalog_manager']),
  writeLimiter,
  async (req, res) => {
    try {
      const { productName, fandom, productId } = req.body;

      if (!productName || !fandom) {
        return res.status(400).json({ error: 'productName and fandom are required' });
      }

      // Generate image
      const imageBuffer = await generateProductImage(productName, fandom);

      // Generate S3 key
      const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const key = `products/${productId || 'new'}-${sanitizedName}.png`;

      // Upload to S3
      const url = await uploadImageToS3(imageBuffer, key, 'image/png');

      res.json({
        success: true,
        url,
        key,
      });
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ error: 'Failed to generate image: ' + error.message });
    }
  }
);

/**
 * POST /media/generate-category
 * Generate a category/fandom image and upload to S3
 */
router.post(
  '/generate-category',
  authenticate,
  authorize(['admin', 'catalog_manager']),
  writeLimiter,
  async (req, res) => {
    try {
      const { fandomName } = req.body;

      if (!fandomName) {
        return res.status(400).json({ error: 'fandomName is required' });
      }

      // Generate image
      const imageBuffer = await generateCategoryImage(fandomName);

      // Generate S3 key
      const sanitizedName = fandomName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const key = `categories/${sanitizedName}.png`;

      // Upload to S3
      const url = await uploadImageToS3(imageBuffer, key, 'image/png');

      res.json({
        success: true,
        url,
        key,
      });
    } catch (error) {
      console.error('Category image generation error:', error);
      res.status(500).json({ error: 'Failed to generate category image: ' + error.message });
    }
  }
);

module.exports = router;

