const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const BUCKET_REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Upload an image buffer to S3
 * @param {Buffer} imageBuffer - Image buffer to upload
 * @param {string} key - S3 object key (path)
 * @param {string} contentType - MIME type (e.g., 'image/png')
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
async function uploadImageToS3(imageBuffer, key, contentType = 'image/png') {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: imageBuffer,
    ContentType: contentType,
    ACL: 'public-read', // Make images publicly accessible
  });

  await s3Client.send(command);

  // Return public URL
  return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${key}`;
}

/**
 * Generate a dummy product image using SVG and sharp
 * @param {string} productName - Product name to display
 * @param {string} fandom - Product fandom for color theme
 * @param {number} width - Image width (default: 800)
 * @param {number} height - Image height (default: 800)
 * @returns {Promise<Buffer>} - Image buffer
 */
async function generateProductImage(productName, fandom, width = 800, height = 800) {
  // Fandom color themes
  const fandomColors = {
    'Harry Potter': { bg: '#4a0202', text: '#ffffff', accent: '#d4af37' },
    'Lord of the Rings': { bg: '#1a1a1a', text: '#d4af37', accent: '#8b7355' },
    'Game of Thrones': { bg: '#2c1810', text: '#c9a961', accent: '#8b4513' },
    'Star Wars': { bg: '#000000', text: '#ffd700', accent: '#0066cc' },
    'Marvel Cinematic Universe': { bg: '#1a1a2e', text: '#e94560', accent: '#0f3460' },
    'Fantastic Beasts': { bg: '#2d1b1b', text: '#d4a574', accent: '#8b6f47' },
    'DC Universe': { bg: '#0a0a0a', text: '#0066cc', accent: '#ff0000' },
    'Doctor Who': { bg: '#003d6b', text: '#ffffff', accent: '#00d9ff' },
    'Studio Ghibli': { bg: '#8b9dc3', text: '#ffffff', accent: '#dfe3ee' },
  };

  const colors = fandomColors[fandom] || { bg: '#1a1a2e', text: '#e94560', accent: '#0f3460' };

  // Escape HTML entities in product name
  const escapeHtml = (text) => {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  const escapedName = escapeHtml(productName);
  const escapedFandom = escapeHtml(fandom);

  // Split product name into lines (simple word wrap)
  const words = productName.split(' ');
  const lines = [];
  let currentLine = '';
  const maxCharsPerLine = 25;

  for (const word of words) {
    if ((currentLine + ' ' + word).length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Generate SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="${colors.text}" stroke-width="8"/>
      ${lines.map((line, index) => {
        const y = height / 2 - ((lines.length - 1) * 60) / 2 + index * 60;
        return `<text x="${width / 2}" y="${y}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${colors.text}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(line)}</text>`;
      }).join('')}
      <text x="${width / 2}" y="${height - 60}" font-family="Arial, sans-serif" font-size="24" fill="${colors.accent}" text-anchor="middle" dominant-baseline="middle">${escapedFandom}</text>
    </svg>
  `;

  // Convert SVG to PNG using sharp
  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

/**
 * Generate a category/fandom image using SVG and sharp
 * @param {string} fandomName - Fandom name
 * @param {number} width - Image width (default: 400)
 * @param {number} height - Image height (default: 250)
 * @returns {Promise<Buffer>} - Image buffer
 */
async function generateCategoryImage(fandomName, width = 400, height = 250) {
  const fandomColors = {
    'Harry Potter': { bg: '#4a0202', text: '#ffffff' },
    'Lord of the Rings': { bg: '#1a1a1a', text: '#d4af37' },
    'Game of Thrones': { bg: '#2c1810', text: '#c9a961' },
    'Star Wars': { bg: '#000000', text: '#ffd700' },
    'Marvel Cinematic Universe': { bg: '#1a1a2e', text: '#e94560' },
    'Fantastic Beasts': { bg: '#2d1b1b', text: '#d4a574' },
    'DC Universe': { bg: '#0a0a0a', text: '#0066cc' },
    'Doctor Who': { bg: '#003d6b', text: '#ffffff' },
    'Studio Ghibli': { bg: '#8b9dc3', text: '#ffffff' },
  };

  const colors = fandomColors[fandomName] || { bg: '#1a1a2e', text: '#e94560' };

  // Escape HTML entities
  const escapeHtml = (text) => {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  const escapedFandom = escapeHtml(fandomName);

  // Generate SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${colors.bg}"/>
      <text x="${width / 2}" y="${height / 2}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${colors.text}" text-anchor="middle" dominant-baseline="middle">${escapedFandom}</text>
    </svg>
  `;

  // Convert SVG to PNG using sharp
  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

/**
 * Delete an image from S3
 * @param {string} key - S3 object key
 */
async function deleteImageFromS3(key) {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get a presigned URL for temporary access (if needed)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
async function getPresignedUrl(key, expiresIn = 3600) {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = {
  uploadImageToS3,
  generateProductImage,
  generateCategoryImage,
  deleteImageFromS3,
  getPresignedUrl,
  BUCKET_NAME,
};

