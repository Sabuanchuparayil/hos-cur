const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Helper to format seller response
const formatSeller = (seller) => ({
  id: seller.id,
  userId: seller.userId,
  name: seller.name,
  businessName: seller.businessName,
  contactEmail: seller.contactEmail,
  type: seller.type,
  status: seller.status,
  isVerified: seller.isVerified,
  payoutsEnabled: seller.payoutsEnabled,
  applicationDate: seller.applicationDate?.toISOString(),
  theme: seller.theme,
  unlockedThemes: seller.unlockedThemes || [],
  financials: seller.financials || {
    balance: { GBP: 0, USD: 0, EUR: 0 },
    pendingBalance: { GBP: 0, USD: 0, EUR: 0 },
    totalEarnings: { GBP: 0, USD: 0, EUR: 0 },
  },
  performance: seller.performance || {
    totalSales: 0,
    totalOrders: 0,
    averageRating: 0,
  },
  auditLog: seller.auditLogs?.map(log => ({
    action: log.action,
    admin: log.admin,
    timestamp: log.timestamp.toISOString(),
    notes: log.notes,
  })) || [],
});

// GET /sellers - Get all sellers
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Only show approved sellers to non-admin users
    if (!req.user || req.user.role !== 'admin') {
      where.status = 'approved';
    }

    const sellers = await req.prisma.seller.findMany({
      where,
      include: {
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sellers.map(formatSeller));
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// GET /sellers/:id - Get single seller
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const seller = await req.prisma.seller.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
        products: {
          take: 10,
          include: { media: true },
        },
      },
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Only show approved sellers to non-admin users
    if (seller.status !== 'approved' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json(formatSeller(seller));
  } catch (error) {
    console.error('Get seller error:', error);
    res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

// POST /sellers - Create seller (seller application)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, businessName, contactEmail, type } = req.body;

    const seller = await req.prisma.seller.create({
      data: {
        userId: req.user?.id,
        name,
        businessName,
        contactEmail,
        type: type || 'independent',
        status: 'pending',
        isVerified: false,
        payoutsEnabled: false,
        theme: {
          activeTheme: 'default',
          customizations: {},
        },
        financials: {
          balance: { GBP: 0, USD: 0, EUR: 0 },
          pendingBalance: { GBP: 0, USD: 0, EUR: 0 },
          totalEarnings: { GBP: 0, USD: 0, EUR: 0 },
        },
        performance: {
          totalSales: 0,
          totalOrders: 0,
          averageRating: 0,
        },
        auditLogs: {
          create: {
            action: 'applied',
            admin: 'System',
            notes: 'Seller application submitted',
          },
        },
      },
      include: {
        auditLogs: true,
      },
    });

    res.status(201).json(formatSeller(seller));
  } catch (error) {
    console.error('Create seller error:', error);
    res.status(500).json({ error: 'Failed to create seller' });
  }
});

// PUT /sellers/:id - Update seller
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      businessName,
      contactEmail,
      type,
      status,
      isVerified,
      payoutsEnabled,
      theme,
      unlockedThemes,
      financials,
      performance,
      auditLog,
    } = req.body;

    // Check permission
    const existingSeller = await req.prisma.seller.findUnique({ where: { id } });
    if (!existingSeller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Sellers can only update their own profile (limited fields)
    if (req.user.role === 'seller' && existingSeller.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    
    // Fields anyone can update
    if (name) updateData.name = name;
    if (businessName) updateData.businessName = businessName;
    if (contactEmail) updateData.contactEmail = contactEmail;
    if (theme) updateData.theme = theme;

    // Admin-only fields
    if (req.user.role === 'admin') {
      if (type) updateData.type = type;
      if (status !== undefined) updateData.status = status;
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (payoutsEnabled !== undefined) updateData.payoutsEnabled = payoutsEnabled;
      if (unlockedThemes) updateData.unlockedThemes = unlockedThemes;
      if (financials) updateData.financials = financials;
      if (performance) updateData.performance = performance;
    }

    const seller = await req.prisma.seller.update({
      where: { id },
      data: updateData,
      include: {
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    // Add audit log if provided
    if (auditLog && Array.isArray(auditLog)) {
      const latestLog = auditLog[auditLog.length - 1];
      if (latestLog) {
        await req.prisma.sellerAuditLog.create({
          data: {
            sellerId: id,
            action: latestLog.action,
            admin: latestLog.admin || req.user.name,
            notes: latestLog.notes,
          },
        });
      }
    }

    // Fetch updated seller
    const updatedSeller = await req.prisma.seller.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    res.json(formatSeller(updatedSeller));
  } catch (error) {
    console.error('Update seller error:', error);
    res.status(500).json({ error: 'Failed to update seller' });
  }
});

// DELETE /sellers/:id - Delete seller (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await req.prisma.seller.delete({ where: { id } });

    res.json({ message: 'Seller deleted successfully' });
  } catch (error) {
    console.error('Delete seller error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Seller not found' });
    }
    res.status(500).json({ error: 'Failed to delete seller' });
  }
});

// POST /sellers/:id/unlock-theme - Unlock theme for seller
router.post('/:id/unlock-theme', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { themeId } = req.body;

    const seller = await req.prisma.seller.findUnique({ where: { id } });
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Check if seller owns this or is admin
    if (req.user.role !== 'admin' && seller.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get theme to check price
    const theme = await req.prisma.themeConfiguration.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Check if already unlocked
    if (seller.unlockedThemes?.includes(themeId)) {
      return res.status(400).json({ error: 'Theme already unlocked' });
    }

    // Deduct balance if premium
    let financials = seller.financials || { balance: { GBP: 0 } };
    if (theme.isPremium && theme.price) {
      const currentBalance = financials.balance?.GBP || 0;
      if (currentBalance < theme.price) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      financials.balance.GBP = currentBalance - theme.price;
    }

    const updatedSeller = await req.prisma.seller.update({
      where: { id },
      data: {
        unlockedThemes: [...(seller.unlockedThemes || []), themeId],
        financials,
      },
      include: {
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    res.json(formatSeller(updatedSeller));
  } catch (error) {
    console.error('Unlock theme error:', error);
    res.status(500).json({ error: 'Failed to unlock theme' });
  }
});

module.exports = router;

