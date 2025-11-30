const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const roles = [
    { name: 'admin', description: 'Full system access', permissions: ['*'] },
    { name: 'seller', description: 'Seller dashboard access', permissions: ['products:read', 'products:write', 'orders:read', 'analytics:read'] },
    { name: 'customer', description: 'Customer access', permissions: ['products:read', 'orders:read', 'reviews:write'] },
    { name: 'finance_manager', description: 'Financial operations', permissions: ['financials:*', 'transactions:*', 'sellers:read'] },
    { name: 'order_manager', description: 'Order management', permissions: ['orders:*', 'returns:*'] },
    { name: 'catalog_manager', description: 'Product catalog management', permissions: ['products:*', 'categories:*'] },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }
  console.log('✅ Roles created');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const superAdminPassword = await bcrypt.hash('Admin@123', 10);
  
  const users = [
    // Super Admin - Stephen Sam
    { name: 'Stephen Sam', email: 'stephensam13@gmail.com', role: 'admin', phone: '', password: superAdminPassword },
    // Other users
    { name: 'Albus Dumbledore', email: 'admin@hogwarts.edu', role: 'admin', phone: '123-456-7890' },
    { name: 'Ollivander', email: 'seller@diagonalley.com', role: 'seller', phone: '123-456-7891' },
    { name: 'Harry Potter', email: 'customer@hogwarts.edu', role: 'customer', phone: '123-456-7892' },
    { name: 'Garrick Ollivander', email: 'ollivanders@example.com', role: 'seller' },
    { name: 'Tom Riddle', email: 'borgin.burkes@example.com', role: 'seller' },
  ];

  const createdUsers = [];
  for (const user of users) {
    const userPassword = user.password || hashedPassword;
    const { password: _, ...userData } = user; // Remove password from user data
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { ...userData, password: userPassword },
      create: { ...userData, password: userPassword, loyaltyPoints: user.role === 'customer' ? 150 : 0 },
    });
    createdUsers.push(created);
  }
  console.log('✅ Users created');

  // Create address for Harry Potter
  const harryUser = createdUsers.find(u => u.email === 'customer@hogwarts.edu');
  if (harryUser) {
    await prisma.address.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: harryUser.id,
        isDefault: true,
        firstName: 'Harry',
        lastName: 'Potter',
        addressLine1: 'The Cupboard Under the Stairs, 4 Privet Drive',
        city: 'Little Whinging',
        postalCode: 'KT23 6RL',
        country: 'GB',
      },
    });
  }

  // Create sellers
  const sellerUser = createdUsers.find(u => u.email === 'seller@diagonalley.com');
  const sellers = [
    {
      name: 'Ollivanders',
      businessName: 'Ollivanders Wand Shop',
      contactEmail: 'seller@diagonalley.com',
      type: 'authorized',
      status: 'approved',
      isVerified: true,
      payoutsEnabled: true,
      userId: sellerUser?.id,
    },
    {
      name: 'Borgin and Burkes',
      businessName: 'Borgin and Burkes',
      contactEmail: 'borgin.burkes@example.com',
      type: 'independent',
      status: 'approved',
      isVerified: false,
      payoutsEnabled: false,
    },
  ];

  const createdSellers = [];
  for (const seller of sellers) {
    const created = await prisma.seller.upsert({
      where: { id: createdSellers.length + 1 },
      update: seller,
      create: {
        ...seller,
        theme: { activeTheme: 'default', customizations: {} },
        financials: {
          balance: { GBP: 250, USD: 300, EUR: 275 },
          pendingBalance: { GBP: 50, USD: 60, EUR: 55 },
          totalEarnings: { GBP: 1500, USD: 1800, EUR: 1650 },
        },
        performance: { totalSales: 45, totalOrders: 30, averageRating: 4.5 },
      },
    });
    createdSellers.push(created);
  }
  console.log('✅ Sellers created');

  // Create products - OLD SITE products from screenshots
  const products = [
    // Existing products
    {
      name: { en: "The Elder Wand (Collector's Edition)", es: "La Varita de Saúco (Edición Coleccionista)" },
      description: { en: "An authentic hand-painted replica of the Elder Wand, as seen in the Harry Potter films. A meticulous recreation of the most powerful wand ever created.", es: "Una réplica auténtica pintada a mano de la Varita de Saúco." },
      pricing: { GBP: 34.99, USD: 44.99, EUR: 39.99, JPY: 6500 },
      rrp: { GBP: 45.00, USD: 55.00, EUR: 50.00, JPY: 7500 },
      tradePrice: { GBP: 25.00, USD: 30.00, EUR: 28.00, JPY: 4500 },
      fandom: 'Harry Potter',
      subCategory: 'Wands',
      sku: 'WAND-HP-ELDR-01-CE',
      barcode: '5055588636789',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    {
      name: { en: 'Gryffindor Scarf', es: 'Bufanda de Gryffindor' },
      description: { en: 'A high-quality, lambswool scarf in the iconic Gryffindor house colors of red and gold. Perfect for showing your house pride.', es: 'Una bufanda de lujo de alta calidad con los colores de la casa Gryffindor.' },
      pricing: { GBP: 24.99, USD: 29.99, EUR: 27.99, JPY: 4500 },
      fandom: 'Harry Potter',
      subCategory: 'Apparel',
      sku: 'APRL-HP-GRYF-SCRF',
      barcode: '5055588636796',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    // NEW products from OLD SITE screenshots
    {
      name: { en: "Gandalf's Staff", es: "Bastón de Gandalf" },
      description: { en: "A full-size, illuminated replica of Gandalf the White's staff. A powerful and authentic artifact for any collector.", es: "Una réplica de tamaño completo e iluminada del bastón de Gandalf el Blanco." },
      pricing: { GBP: 89.99, USD: 109.99, EUR: 99.99, JPY: 15000 },
      rrp: { GBP: 120.00, USD: 145.00, EUR: 130.00, JPY: 20000 },
      fandom: 'Lord of the Rings',
      subCategory: 'Weapon Replicas',
      sku: 'WEP-LOTR-GANDALF-STAFF',
      barcode: '5055588636801',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    {
      name: { en: 'Sting Sword Replica', es: 'Réplica de la Espada Sting' },
      description: { en: "An authentic replica of Bilbo and Frodo Baggins's elven blade, Sting. The blade glows when orcs are near (effect included).", es: "Una réplica auténtica de la hoja élfica Sting de Bilbo y Frodo Bolsón." },
      pricing: { GBP: 79.99, USD: 99.99, EUR: 89.99, JPY: 13000 },
      rrp: { GBP: 95.00, USD: 120.00, EUR: 110.00, JPY: 16000 },
      fandom: 'Lord of the Rings',
      subCategory: 'Weapon Replicas',
      sku: 'WEP-LOTR-STING-01',
      barcode: '5055588636802',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    {
      name: { en: 'The One Ring Replica', es: 'Réplica del Anillo Único' },
      description: { en: 'A gold-plated tungsten replica of The One Ring, inscribed with the Black Speech of Mordor. The perfect collectible for any LOTR fan.', es: 'Una réplica de tungsteno chapado en oro del Anillo Único, inscrito con el Lenguaje Negro de Mordor.' },
      pricing: { GBP: 49.99, USD: 59.99, EUR: 54.99, JPY: 8000 },
      rrp: { GBP: 65.00, USD: 75.00, EUR: 70.00, JPY: 10000 },
      fandom: 'Lord of the Rings',
      subCategory: 'Jewelry',
      sku: 'JEWEL-LOTR-ONERING-01',
      barcode: '5055588636803',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    {
      name: { en: 'Funko Pop! Harry Potter', es: 'Funko Pop! Harry Potter' },
      description: { en: 'The classic Harry Potter Funko Pop! vinyl figure, featuring his iconic round glasses and scar. A must-have for any collector.', es: 'La figura clásica de vinilo Funko Pop! de Harry Potter, con sus icónicas gafas redondas y cicatriz.' },
      pricing: { GBP: 12.99, USD: 15.99, EUR: 14.99, JPY: 2200 },
      fandom: 'Harry Potter',
      subCategory: 'Toys',
      sku: 'TOY-HP-FUNKO-HP-01',
      barcode: '5055588636804',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    {
      name: { en: "Marauder's Map Replica", es: "Réplica del Mapa del Merodeador" },
      description: { en: "A full-size, foldable parchment replica of the famed Marauder's Map. Reveal all the secrets of Hogwarts with this authentic collectible.", es: "Una réplica de pergamino plegable de tamaño completo del famoso Mapa del Merodeador." },
      pricing: { GBP: 34.99, USD: 42.99, EUR: 39.99, JPY: 6000 },
      rrp: { GBP: 45.00, USD: 55.00, EUR: 50.00, JPY: 7500 },
      fandom: 'Harry Potter',
      subCategory: 'Collectibles',
      sku: 'COLL-HP-MARAUDER-MAP',
      barcode: '5055588636805',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    {
      name: { en: 'Slytherin Locket', es: 'Medallón de Slytherin' },
      description: { en: "A detailed replica of Salazar Slytherin's locket, a Horcrux of Lord Voldemort. Features green crystal detailing and authentic design.", es: "Una réplica detallada del medallón de Salazar Slytherin, un Horrocrux de Lord Voldemort." },
      pricing: { GBP: 49.99, USD: 59.99, EUR: 54.99, JPY: 8000 },
      rrp: { GBP: 65.00, USD: 75.00, EUR: 70.00, JPY: 10000 },
      fandom: 'Harry Potter',
      subCategory: 'Jewelry',
      sku: 'JEWEL-HP-SLYTH-LOCKET',
      barcode: '5055588636806',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    {
      name: { en: 'Time Turner Necklace', es: 'Collar del Giratiempo' },
      description: { en: "A functional, spinning replica of Hermione Granger's Time Turner. Plated in 24 karat gold, it makes for a magical collectible.", es: "Una réplica funcional y giratoria del Giratiempo de Hermione Granger." },
      pricing: { GBP: 45.00, USD: 54.99, EUR: 49.99, JPY: 7500 },
      rrp: { GBP: 60.00, USD: 70.00, EUR: 65.00, JPY: 9500 },
      fandom: 'Harry Potter',
      subCategory: 'Jewelry',
      sku: 'JEWEL-HP-TIMETURNER-01',
      barcode: '5055588636807',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
    createdProducts.push(created);

    // Add media
    await prisma.productMedia.upsert({
      where: { id: created.id },
      update: {},
      create: {
        productId: created.id,
        type: 'image',
        url: `https://images.unsplash.com/photo-${1593344484962 + created.id}-796d9221915c?q=80&w=800`,
      },
    });

    // Add inventory
    await prisma.inventoryItem.upsert({
      where: { id: created.id },
      update: {},
      create: {
        productId: created.id,
        centreId: 'main',
        name: 'Main Warehouse',
        stock: Math.floor(Math.random() * 100) + 10,
      },
    });
  }
  console.log('✅ Products created');

  // Create reviews for products (to show ratings in OLD SITE)
  const harryUser = createdUsers.find(u => u.email === 'customer@hogwarts.edu');
  if (harryUser && createdProducts.length > 0) {
    const reviews = [
      { productSku: 'WAND-HP-ELDR-01-CE', rating: 5, comment: 'Amazing quality! Looks exactly like the movie prop.' },
      { productSku: 'APRL-HP-GRYF-SCRF', rating: 4, comment: 'Great scarf, very warm and comfortable.' },
      { productSku: 'JEWEL-LOTR-ONERING-01', rating: 5, comment: 'Perfect replica! The inscription is beautifully detailed.' },
      { productSku: 'COLL-HP-MARAUDER-MAP', rating: 5, comment: 'Incredible detail! A must-have for any Potterhead.' },
      { productSku: 'WEP-LOTR-STING-01', rating: 5, comment: 'Beautiful sword replica, the glow effect is amazing!' },
      { productSku: 'WEP-LOTR-GANDALF-STAFF', rating: 5, comment: 'Stunning staff replica, perfect for display.' },
    ];

    for (const review of reviews) {
      const product = createdProducts.find(p => p.sku === review.productSku);
      if (product) {
        // Check if review already exists
        const existingReview = await prisma.review.findFirst({
          where: {
            productId: product.id,
            userId: harryUser.id,
          },
        });

        if (!existingReview) {
          await prisma.review.create({
            data: {
              productId: product.id,
              userId: harryUser.id,
              userName: harryUser.name,
              rating: review.rating,
              comment: review.comment,
              isVerifiedPurchase: true,
            },
          });
        }
      }
    }
    console.log('✅ Reviews created');
  }

  // Create carriers
  const carriers = [
    {
      name: 'Royal Owl Mail',
      code: 'ROM',
      trackingUrl: 'https://tracking.royalowlmail.com/{trackingNumber}',
      isActive: true,
      services: ['standard', 'express', 'overnight'],
    },
    {
      name: 'Floo Network Express',
      code: 'FNE',
      trackingUrl: 'https://floo.network/track/{trackingNumber}',
      isActive: true,
      services: ['standard', 'express'],
    },
    {
      name: 'Muggle Post',
      code: 'MP',
      trackingUrl: 'https://mugglepost.co.uk/track/{trackingNumber}',
      isActive: true,
      services: ['standard'],
    },
  ];

  for (const carrier of carriers) {
    await prisma.carrier.upsert({
      where: { code: carrier.code },
      update: carrier,
      create: carrier,
    });
  }
  console.log('✅ Carriers created');

  // Create default theme
  await prisma.themeConfiguration.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Default Theme',
      description: 'The classic House of Spells theme',
      isDefault: true,
      isCustom: false,
      isPremium: false,
      layout: 'standard',
      variables: {
        '--bg-primary': '#1a1a2e',
        '--bg-secondary': '#16213e',
        '--accent': '#e94560',
        '--text-primary': '#ffffff',
      },
    },
  });

  await prisma.themeConfiguration.upsert({
    where: { id: 'enchanted' },
    update: {},
    create: {
      id: 'enchanted',
      name: 'Enchanted Forest',
      description: 'A magical forest theme with deep greens',
      isDefault: false,
      isCustom: false,
      isPremium: true,
      price: 49.99,
      layout: 'enchanted',
      variables: {
        '--bg-primary': '#0d1b0d',
        '--bg-secondary': '#1a2f1a',
        '--accent': '#7cb342',
        '--text-primary': '#e8f5e9',
      },
    },
  });
  console.log('✅ Themes created');

  // Create some promotions
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      description: 'Welcome discount - 10% off your first order',
      validFrom: now,
      validTo: nextMonth,
      isActive: true,
    },
  });

  await prisma.promotion.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      code: 'FREESHIP',
      type: 'freeShipping',
      description: 'Free shipping on orders over £50',
      minPurchase: 50,
      validFrom: now,
      validTo: nextMonth,
      isActive: true,
    },
  });
  console.log('✅ Promotions created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

