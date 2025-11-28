const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /wishlist - Get user's wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await req.prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            media: true,
            inventory: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    res.json(items.map(item => ({
      id: item.id,
      productId: item.productId,
      addedAt: item.addedAt.toISOString(),
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        pricing: item.product.pricing,
        media: item.product.media.map(m => ({ type: m.type, url: m.url })),
        taxonomy: {
          fandom: item.product.fandom,
          subCategory: item.product.subCategory,
        },
        sku: item.product.sku,
        stock: item.product.inventory.reduce((sum, i) => sum + i.stock, 0),
      },
    })));
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /wishlist - Add item to wishlist
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if already in wishlist
    const existing = await req.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: parseInt(productId),
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Item already in wishlist' });
    }

    const item = await req.prisma.wishlistItem.create({
      data: {
        userId: req.user.id,
        productId: parseInt(productId),
      },
      include: {
        product: {
          include: {
            media: true,
          },
        },
      },
    });

    res.status(201).json({
      id: item.id,
      productId: item.productId,
      addedAt: item.addedAt.toISOString(),
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /wishlist/:productId - Remove item from wishlist
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    await req.prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// DELETE /wishlist - Clear entire wishlist
router.delete('/', authenticate, async (req, res) => {
  try {
    await req.prisma.wishlistItem.deleteMany({
      where: { userId: req.user.id },
    });

    res.json({ message: 'Wishlist cleared' });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

module.exports = router;

