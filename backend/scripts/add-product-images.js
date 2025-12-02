require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Image mapping for products based on their fandom and subCategory
// Using placeholder.com for reliable placeholder images
const getProductImageUrl = (product) => {
  const { fandom, subCategory, name } = product;
  const nameEn = typeof name === 'object' ? name.en : name || '';
  
  // Create a unique identifier for consistent images
  const imageId = `${fandom}-${subCategory}-${nameEn}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  
  // Use placeholder.com with themed colors based on fandom
  const fandomColors = {
    'Harry Potter': { bg: '4a0202', text: 'ffffff' },
    'Lord of the Rings': { bg: '1a1a1a', text: 'd4af37' },
    'Game of Thrones': { bg: '2c1810', text: 'c9a961' },
    'Star Wars': { bg: '000000', text: 'ffd700' },
    'Marvel Cinematic Universe': { bg: '1a1a2e', text: 'e94560' },
    'Fantastic Beasts': { bg: '2d1b1b', text: 'd4a574' },
    'DC Universe': { bg: '0a0a0a', text: '0066cc' },
    'Doctor Who': { bg: '003d6b', text: 'ffffff' },
    'Studio Ghibli': { bg: '8b9dc3', text: 'ffffff' },
  };
  
  const colors = fandomColors[fandom] || { bg: '1a1a2e', text: 'e94560' };
  
  // Create a short label for the image
  const label = nameEn.length > 30 ? nameEn.substring(0, 30) + '...' : nameEn;
  const encodedLabel = encodeURIComponent(label);
  
  // Use placeholder.com with custom text and colors
  // Format: https://via.placeholder.com/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=TEXT
  return `https://via.placeholder.com/800x800/${colors.bg}/${colors.text}?text=${encodedLabel}`;
};

async function main() {
  console.log('🖼️  Adding images to all products...');
  
  try {
    // Get all products
    const products = await prisma.product.findMany({
      include: {
        media: true,
      },
    });
    
    console.log(`Found ${products.length} products`);
    
    let updated = 0;
    let created = 0;
    
    for (const product of products) {
      // Check if product already has media
      if (product.media && product.media.length > 0) {
        // Check if the URL is a valid placeholder or needs updating
        const existingUrl = product.media[0].url;
        if (existingUrl && !existingUrl.includes('via.placeholder.com') && !existingUrl.includes('placeholder.com')) {
          // Skip if it already has a valid image URL
          console.log(`✓ Product ${product.id} (${product.sku}) already has a valid image`);
          continue;
        }
      }
      
      // Generate image URL
      const imageUrl = getProductImageUrl(product);
      
      // Delete existing media for this product
      await prisma.productMedia.deleteMany({
        where: { productId: product.id },
      });
      
      // Create new media entry
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          type: 'image',
          url: imageUrl,
        },
      });
      
      const productName = typeof product.name === 'object' ? product.name.en : product.name;
      console.log(`✓ Added image for product ${product.id}: ${productName}`);
      
      if (product.media && product.media.length > 0) {
        updated++;
      } else {
        created++;
      }
    }
    
    console.log(`\n✅ Successfully processed ${products.length} products:`);
    console.log(`   - Created: ${created} new images`);
    console.log(`   - Updated: ${updated} existing images`);
    console.log('\n🎉 All products now have images!');
    
  } catch (error) {
    console.error('❌ Error adding images:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

