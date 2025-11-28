const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /promotions - Get all promotions
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { active } = req.query;
    
    const where = {};
    
    // Non-admin users only see active promotions
    if (!req.user || req.user.role !== 'admin') {
      where.isActive = true;
      where.validFrom = { lte: new Date() };
      where.validTo = { gte: new Date() };
    } else if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const promotions = await req.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(promotions.map(p => ({
      id: p.id,
      code: p.code,
      type: p.type,
      value: p.value,
      description: p.description,
      minPurchase: p.minPurchase,
      maxUses: p.maxUses,
      usedCount: p.usedCount,
      validFrom: p.validFrom.toISOString(),
      validTo: p.validTo.toISOString(),
      isActive: p.isActive,
      applicableTo: p.applicableTo,
    })));
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

// GET /promotions/validate/:code - Validate promotion code
router.get('/validate/:code', optionalAuth, async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    const promotion = await req.prisma.promotion.findUnique({
      where: { code },
    });

    if (!promotion) {
      return res.status(404).json({ valid: false, error: 'Promotion code not found' });
    }

    const now = new Date();
    if (!promotion.isActive) {
      return res.json({ valid: false, error: 'Promotion is not active' });
    }
    if (promotion.validFrom > now) {
      return res.json({ valid: false, error: 'Promotion has not started yet' });
    }
    if (promotion.validTo < now) {
      return res.json({ valid: false, error: 'Promotion has expired' });
    }
    if (promotion.maxUses && promotion.usedCount >= promotion.maxUses) {
      return res.json({ valid: false, error: 'Promotion has reached maximum uses' });
    }

    res.json({
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
        description: promotion.description,
        minPurchase: promotion.minPurchase,
      },
    });
  } catch (error) {
    console.error('Validate promotion error:', error);
    res.status(500).json({ error: 'Failed to validate promotion' });
  }
});

// POST /promotions - Create promotion (admin only)
router.post('/', authenticate, authorize(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      description,
      minPurchase,
      maxUses,
      validFrom,
      validTo,
      isActive,
      applicableTo,
    } = req.body;

    const promotion = await req.prisma.promotion.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        description,
        minPurchase,
        maxUses,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        isActive: isActive !== false,
        applicableTo: applicableTo || [],
      },
    });

    res.status(201).json({
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      value: promotion.value,
      description: promotion.description,
      minPurchase: promotion.minPurchase,
      maxUses: promotion.maxUses,
      usedCount: promotion.usedCount,
      validFrom: promotion.validFrom.toISOString(),
      validTo: promotion.validTo.toISOString(),
      isActive: promotion.isActive,
      applicableTo: promotion.applicableTo,
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

// PUT /promotions/:id - Update promotion (admin only)
router.put('/:id', authenticate, authorize(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      code,
      type,
      value,
      description,
      minPurchase,
      maxUses,
      validFrom,
      validTo,
      isActive,
      applicableTo,
    } = req.body;

    const updateData = {};
    if (code) updateData.code = code.toUpperCase();
    if (type) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (description !== undefined) updateData.description = description;
    if (minPurchase !== undefined) updateData.minPurchase = minPurchase;
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (validFrom) updateData.validFrom = new Date(validFrom);
    if (validTo) updateData.validTo = new Date(validTo);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (applicableTo) updateData.applicableTo = applicableTo;

    const promotion = await req.prisma.promotion.update({
      where: { id },
      data: updateData,
    });

    res.json({
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      value: promotion.value,
      description: promotion.description,
      minPurchase: promotion.minPurchase,
      maxUses: promotion.maxUses,
      usedCount: promotion.usedCount,
      validFrom: promotion.validFrom.toISOString(),
      validTo: promotion.validTo.toISOString(),
      isActive: promotion.isActive,
      applicableTo: promotion.applicableTo,
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

// DELETE /promotions/:id - Delete promotion (admin only)
router.delete('/:id', authenticate, authorize(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await req.prisma.promotion.delete({ where: { id } });

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Delete promotion error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

// POST /promotions/:id/use - Increment usage count
router.post('/:id/use', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const promotion = await req.prisma.promotion.update({
      where: { id },
      data: {
        usedCount: { increment: 1 },
      },
    });

    res.json({ usedCount: promotion.usedCount });
  } catch (error) {
    console.error('Use promotion error:', error);
    res.status(500).json({ error: 'Failed to update promotion usage' });
  }
});

module.exports = router;

