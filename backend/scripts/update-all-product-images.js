require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Image URL generator function (same as in seed.js)
const getProductImageUrl = (product) => {
  const { fandom, subCategory, name } = product;
  const nameEn = typeof name === 'object' ? name.en : name || '';
  
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
  return `https://via.placeholder.com/800x800/${colors.bg}/${colors.text}?text=${encodedLabel}`;
};

async function main() {
  console.log('🖼️  Updating images for all products...');
  
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
    let skipped = 0;
    
    for (const product of products) {
      // Generate image URL
      const imageUrl = getProductImageUrl(product);
      
      // Check if product already has media
      if (product.media && product.media.length > 0) {
        // Check if URL is already a valid placeholder URL
        const existingUrl = product.media[0].url;
        if (existingUrl && existingUrl.includes('via.placeholder.com')) {
          // Update existing media with new URL (in case product name changed)
          await prisma.productMedia.update({
            where: { id: product.media[0].id },
            data: { url: imageUrl },
          });
          updated++;
          const productName = typeof product.name === 'object' ? product.name.en : product.name;
          console.log(`✓ Updated image for product ${product.id}: ${productName}`);
        } else if (existingUrl && !existingUrl.includes('via.placeholder.com')) {
          // Product has a non-placeholder image, skip it
          skipped++;
          console.log(`⊘ Skipped product ${product.id} (has custom image)`);
          continue;
        } else {
          // Empty or invalid URL, update it
          await prisma.productMedia.update({
            where: { id: product.media[0].id },
            data: { url: imageUrl },
          });
          updated++;
        }
      } else {
        // No media exists, create it
        await prisma.productMedia.create({
          data: {
            productId: product.id,
            type: 'image',
            url: imageUrl,
          },
        });
        created++;
        const productName = typeof product.name === 'object' ? product.name.en : product.name;
        console.log(`✓ Created image for product ${product.id}: ${productName}`);
      }
    }
    
    console.log(`\n✅ Successfully processed ${products.length} products:`);
    console.log(`   - Created: ${created} new images`);
    console.log(`   - Updated: ${updated} existing images`);
    console.log(`   - Skipped: ${skipped} products with custom images`);
    console.log('\n🎉 All products now have placeholder images!');
    
  } catch (error) {
    console.error('❌ Error updating images:', error);
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

