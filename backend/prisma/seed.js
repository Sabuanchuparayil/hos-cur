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

  // Create products
  const products = [
    {
      name: { en: "The Elder Wand (Collector's Edition)", es: "La Varita de Saúco (Edición Coleccionista)" },
      description: { en: "An authentic hand-painted replica of the Elder Wand, as seen in the Harry Potter films.", es: "Una réplica auténtica pintada a mano de la Varita de Saúco." },
      pricing: { GBP: 39.99, USD: 49.99, EUR: 45.99, JPY: 7000 },
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
      name: { en: 'Golden Snitch Replica', es: 'Réplica de la Snitch Dorada' },
      description: { en: 'A detailed, non-flying replica of the Golden Snitch.', es: 'Una réplica detallada y no voladora de la Snitch Dorada.' },
      pricing: { GBP: 24.99, USD: 29.99, EUR: 27.99, JPY: 4500 },
      fandom: 'Harry Potter',
      subCategory: 'Collectibles',
      sku: 'COLL-HP-SNITCH-01',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
    {
      name: { en: 'Hand of the King Pin', es: 'Pin de la Mano del Rey' },
      description: { en: 'A metal pin replica of the badge worn by the Hand of the King.', es: 'Una réplica de metal de la insignia que lleva la Mano del Rey.' },
      pricing: { GBP: 12.99, USD: 15.99, EUR: 14.99, JPY: 2200 },
      fandom: 'Game of Thrones',
      subCategory: 'Jewelry',
      sku: 'JEWEL-GOT-HOTK-PIN',
      sellerId: createdSellers[1]?.id || 2,
      fulfillmentModel: 'Seller Direct',
    },
    {
      name: { en: 'Gryffindor Scarf', es: 'Bufanda de Gryffindor' },
      description: { en: 'A high-quality, deluxe scarf in the colors of Gryffindor house.', es: 'Una bufanda de lujo de alta calidad con los colores de la casa Gryffindor.' },
      pricing: { GBP: 29.95, USD: 34.95, EUR: 32.95, JPY: 5000 },
      fandom: 'Harry Potter',
      subCategory: 'Apparel',
      sku: 'APRL-HP-GRYF-SCRF',
      barcode: '5055588636796',
      sellerId: createdSellers[0]?.id || 1,
      fulfillmentModel: 'HoS Warehouse',
    },
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });

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

