const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /reviews - Get all reviews
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { productId, userId } = req.query;
    
    const where = {};
    if (productId) where.productId = parseInt(productId);
    if (userId) where.userId = parseInt(userId);

    const reviews = await req.prisma.review.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json(reviews.map(r => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      date: r.date.toISOString(),
    })));
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /reviews/:id - Get single review
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const review = await req.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      date: review.date.toISOString(),
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// POST /reviews - Create review
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, rating, comment, isVerifiedPurchase, userName, userId } = req.body;

    // Use provided userId/userName or default to authenticated user
    const finalUserId = userId || req.user.id;
    const finalUserName = userName || req.user.name;

    // Check if user has already reviewed this product
    const existingReview = await req.prisma.review.findFirst({
      where: {
        productId: parseInt(productId),
        userId: finalUserId,
      },
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Check if verified purchase
    let verified = isVerifiedPurchase;
    if (verified === undefined) {
      const order = await req.prisma.order.findFirst({
        where: {
          userId: finalUserId,
          status: 'Delivered',
          items: {
            some: {
              productId: parseInt(productId),
            },
          },
        },
      });
      verified = !!order;
    }

    const review = await req.prisma.review.create({
      data: {
        productId: parseInt(productId),
        userId: finalUserId,
        userName: finalUserName,
        rating: parseInt(rating),
        comment,
        isVerifiedPurchase: verified,
      },
    });

    // Add loyalty points
    await req.prisma.user.update({
      where: { id: finalUserId },
      data: {
        loyaltyPoints: { increment: 10 },
      },
    });

    res.status(201).json({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      date: review.date.toISOString(),
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// PUT /reviews/:id - Update review
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rating, comment } = req.body;

    const existingReview = await req.prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && existingReview.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const review = await req.prisma.review.update({
      where: { id },
      data: {
        rating: rating !== undefined ? parseInt(rating) : undefined,
        comment,
      },
    });

    res.json({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      date: review.date.toISOString(),
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE /reviews/:id - Delete review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existingReview = await req.prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && existingReview.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await req.prisma.review.delete({ where: { id } });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;

