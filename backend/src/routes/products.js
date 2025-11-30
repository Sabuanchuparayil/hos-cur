const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { cacheMiddleware, clearResourceCache } = require('../utils/cache');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Helper to format product response
const formatProduct = (product) => {
  const totalStock = product.hasVariations && product.variations
    ? product.variations.reduce((total, v) => total + v.inventory.reduce((sum, loc) => sum + loc.stock, 0), 0)
    : product.inventory.reduce((sum, loc) => sum + loc.stock, 0);

  // Calculate average rating and review count
  const reviews = product.reviews || [];
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    pricing: product.pricing,
    rrp: product.rrp,
    tradePrice: product.tradePrice,
    media: product.media.map(m => ({ type: m.type, url: m.url })),
    taxonomy: {
      fandom: product.fandom,
      subCategory: product.subCategory,
    },
    sku: product.sku,
    barcode: product.barcode,
    inventory: product.inventory.map(i => ({
      centreId: i.centreId,
      name: i.name,
      stock: i.stock,
    })),
    sellerId: product.sellerId,
    hasVariations: product.hasVariations,
    variations: product.variations?.map(v => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      optionValues: v.optionValues,
      inventory: v.inventory.map(i => ({
        centreId: i.centreId,
        name: i.name,
        stock: i.stock,
      })),
    })),
    fulfillmentModel: product.fulfillmentModel,
    stock: totalStock,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    reviewCount: reviewCount,
  };
};

// GET /products - Get all products with pagination and caching
router.get('/', 
  optionalAuth,
  cacheMiddleware((req) => {
    const { fandom, category, sellerId, page, limit } = req.query;
    return `products:list:${fandom || 'all'}:${category || 'all'}:${sellerId || 'all'}:${page || 1}:${limit || 20}`;
  }, 300), // Cache for 5 minutes
  async (req, res) => {
    try {
      const { fandom, category, sellerId, search } = req.query;
      const { skip, limit } = req.pagination;

      const where = {};
      if (fandom) where.fandom = fandom;
      if (category) where.subCategory = category;
      if (sellerId) where.sellerId = parseInt(sellerId);

      // Get total count for pagination
      const total = await req.prisma.product.count({ where });

      // Fetch products with optimized query (select only needed fields)
      // Include reviews for average rating calculation
      const products = await req.prisma.product.findMany({
        where,
        include: {
          media: { select: { type: true, url: true } },
          inventory: { select: { centreId: true, name: true, stock: true } },
          variations: {
            select: {
              id: true,
              sku: true,
              name: true,
              optionValues: true,
              inventory: { select: { centreId: true, name: true, stock: true } },
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              userId: true,
              userName: true,
              comment: true,
              date: true,
              isVerifiedPurchase: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      let formattedProducts = products.map(formatProduct);

      // Simple search filter (consider moving to database query for better performance)
      if (search) {
        const searchLower = search.toLowerCase();
        formattedProducts = formattedProducts.filter(p => {
          const nameEn = p.name?.en?.toLowerCase() || '';
          const descEn = p.description?.en?.toLowerCase() || '';
          return nameEn.includes(searchLower) || descEn.includes(searchLower) || p.sku.toLowerCase().includes(searchLower);
        });
      }

      // Return paginated response
      res.paginate(formattedProducts, total);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }
);

// GET /products/:id - Get single product
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const product = await req.prisma.product.findUnique({
      where: { id },
      include: {
        media: true,
        inventory: true,
        variations: {
          include: { inventory: true },
        },
        seller: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(formatProduct(product));
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /products - Create product
router.post('/', authenticate, authorize(['admin', 'seller', 'catalog_manager']), writeLimiter, async (req, res) => {
  try {
    const {
      name,
      description,
      pricing,
      rrp,
      tradePrice,
      media,
      taxonomy,
      sku,
      barcode,
      inventory,
      sellerId,
      hasVariations,
      variations,
      fulfillmentModel,
    } = req.body;

    // For sellers, use their own seller ID
    let finalSellerId = sellerId;
    if (req.user.role === 'seller') {
      const seller = await req.prisma.seller.findUnique({
        where: { userId: req.user.id },
      });
      if (seller) {
        finalSellerId = seller.id;
      }
    }

    const product = await req.prisma.product.create({
      data: {
        name,
        description,
        pricing,
        rrp,
        tradePrice,
        fandom: taxonomy?.fandom || 'Other',
        subCategory: taxonomy?.subCategory || 'Other',
        sku,
        barcode,
        sellerId: finalSellerId,
        hasVariations: hasVariations || false,
        fulfillmentModel: fulfillmentModel || 'HoS Warehouse',
        media: {
          create: media?.map(m => ({ type: m.type || 'image', url: m.url })) || [],
        },
        inventory: {
          create: inventory?.map(i => ({
            centreId: i.centreId || 'main',
            name: i.name || 'Main Warehouse',
            stock: i.stock || 0,
          })) || [{ centreId: 'main', name: 'Main Warehouse', stock: 0 }],
        },
      },
      include: {
        media: true,
        inventory: true,
        variations: {
          include: { inventory: true },
        },
      },
    });

    // Create variations if provided
    if (hasVariations && variations?.length > 0) {
      for (const v of variations) {
        await req.prisma.productVariation.create({
          data: {
            productId: product.id,
            sku: v.sku,
            name: v.name,
            optionValues: v.optionValues,
            inventory: {
              create: v.inventory?.map(i => ({
                centreId: i.centreId || 'main',
                name: i.name || 'Main Warehouse',
                stock: i.stock || 0,
              })) || [],
            },
          },
        });
      }
    }

    // Fetch complete product
    const completeProduct = await req.prisma.product.findUnique({
      where: { id: product.id },
      include: {
        media: true,
        inventory: true,
        variations: {
          include: { inventory: true },
        },
      },
    });

    // Clear products cache
    await clearResourceCache('products');
    
    res.status(201).json(formatProduct(completeProduct));
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /products/:id - Update product
router.put('/:id', authenticate, authorize(['admin', 'seller', 'catalog_manager']), writeLimiter, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      description,
      pricing,
      rrp,
      tradePrice,
      media,
      taxonomy,
      sku,
      barcode,
      inventory,
      hasVariations,
      variations,
      fulfillmentModel,
    } = req.body;

    // Check ownership for sellers
    if (req.user.role === 'seller') {
      const product = await req.prisma.product.findUnique({
        where: { id },
        include: { seller: true },
      });
      if (product?.seller?.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Update product
    const product = await req.prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        pricing,
        rrp,
        tradePrice,
        fandom: taxonomy?.fandom,
        subCategory: taxonomy?.subCategory,
        sku,
        barcode,
        hasVariations,
        fulfillmentModel,
      },
    });

    // Update media
    if (media) {
      await req.prisma.productMedia.deleteMany({ where: { productId: id } });
      for (const m of media) {
        await req.prisma.productMedia.create({
          data: {
            productId: id,
            type: m.type || 'image',
            url: m.url,
          },
        });
      }
    }

    // Update inventory
    if (inventory) {
      await req.prisma.inventoryItem.deleteMany({ 
        where: { productId: id, variationId: null } 
      });
      for (const i of inventory) {
        await req.prisma.inventoryItem.create({
          data: {
            productId: id,
            centreId: i.centreId || 'main',
            name: i.name || 'Main Warehouse',
            stock: i.stock || 0,
          },
        });
      }
    }

    // Update variations
    if (hasVariations && variations) {
      // Delete old variations
      await req.prisma.productVariation.deleteMany({ where: { productId: id } });
      
      for (const v of variations) {
        await req.prisma.productVariation.create({
          data: {
            productId: id,
            sku: v.sku,
            name: v.name,
            optionValues: v.optionValues,
            inventory: {
              create: v.inventory?.map(i => ({
                centreId: i.centreId || 'main',
                name: i.name || 'Main Warehouse',
                stock: i.stock || 0,
              })) || [],
            },
          },
        });
      }
    }

    // Fetch complete product
    const completeProduct = await req.prisma.product.findUnique({
      where: { id },
      include: {
        media: true,
        inventory: true,
        variations: {
          include: { inventory: true },
        },
      },
    });

    // Clear products cache
    await clearResourceCache('products');
    
    res.json(formatProduct(completeProduct));
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /products/:id - Delete product
router.delete('/:id', authenticate, authorize(['admin', 'seller', 'catalog_manager']), writeLimiter, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check ownership for sellers
    if (req.user.role === 'seller') {
      const product = await req.prisma.product.findUnique({
        where: { id },
        select: { id: true, seller: { select: { userId: true } } },
      });
      if (product?.seller?.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await req.prisma.product.delete({ where: { id } });

    // Clear products cache
    await clearResourceCache('products');

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;

