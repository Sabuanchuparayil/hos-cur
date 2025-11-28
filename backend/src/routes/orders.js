const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Helper to format order response
const formatOrder = (order) => ({
  id: order.id,
  userId: order.userId,
  date: order.date ? order.date.toISOString() : new Date().toISOString(),
  status: order.status || 'Processing',
  currency: order.currency || 'GBP',
  subtotal: order.subtotal || 0,
  shippingCost: order.shippingCost || 0,
  taxes: order.taxes || 0,
  discountAmount: order.discountAmount || 0,
  total: order.total || 0,
  platformFee: order.platformFee || null,
  sellerPayout: order.sellerPayout || null,
  shippingMethod: order.shippingMethod || null,
  carrier: order.carrier || null,
  trackingNumber: order.trackingNumber || null,
  trackingUrl: order.trackingUrl || null,
  shippingNotes: order.shippingNotes || null,
  shippingAddress: order.shippingAddress || {},
  paymentDetails: order.paymentDetails || null,
  items: order.items?.map(item => ({
    id: item.id,
    productId: item.productId,
    name: typeof item.product?.name === 'object' ? item.product.name?.en || item.product.name : item.product?.name,
    description: typeof item.product?.description === 'object' ? item.product.description?.en || item.product.description : item.product?.description,
    pricing: item.product?.pricing || {},
    media: item.product?.media?.map(m => ({ type: m.type, url: m.url })) || [],
    taxonomy: {
      fandom: item.product?.fandom || '',
      subCategory: item.product?.subCategory || '',
    },
    sku: item.product?.sku || '',
    quantity: item.quantity,
    price: item.price,
    currency: item.currency,
    variationId: item.variationId,
  })) || [],
  auditLog: order.auditLogs?.map(log => ({
    timestamp: log.timestamp.toISOString(),
    user: log.user,
    previousStatus: log.previousStatus,
    newStatus: log.newStatus,
    notes: log.notes,
  })) || [],
});

// GET /orders - Get all orders with pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, sellerId } = req.query;
    const { skip, limit } = req.pagination;
    
    let where = {};
    
    // Filter by user for customers
    if (req.user.role === 'customer') {
      where.userId = req.user.id;
    }
    
    // Filter by seller
    if (req.user.role === 'seller') {
      const seller = await req.prisma.seller.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });
      if (seller) {
        where.items = {
          some: {
            product: {
              sellerId: seller.id,
            },
          },
        };
      }
    }
    
    if (status) where.status = status;

    // Get total count
    const total = await req.prisma.order.count({ where });

    // Fetch orders with optimized includes
    const orders = await req.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                media: { select: { type: true, url: true }, take: 1 },
              },
            },
            variation: true,
          },
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 5, // Only get latest 5 audit logs
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    res.paginate(orders.map(formatOrder), total);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /orders/:id - Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;

    const order = await req.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { media: true },
            },
          },
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check access
    if (req.user.role === 'customer' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(formatOrder(order));
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /orders - Create order
router.post('/', authenticate, writeLimiter, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentDetails,
      currency,
      subtotal,
      shippingCost,
      taxes,
      discountAmount,
      total,
      platformFee,
      sellerPayout,
      shippingMethod,
    } = req.body;

    // Generate order ID
    const orderId = `HOS-${Date.now()}`;

    const order = await req.prisma.order.create({
      data: {
        id: orderId,
        userId: req.user.id,
        status: 'Processing',
        currency: currency || 'GBP',
        subtotal,
        shippingCost: shippingCost || 0,
        taxes: taxes || 0,
        discountAmount: discountAmount || 0,
        total,
        platformFee,
        sellerPayout,
        shippingMethod,
        shippingAddress,
        paymentDetails,
        items: {
          create: items.map(item => ({
            productId: item.id || item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
            price: item.pricing?.[currency] || item.price,
            currency: currency || 'GBP',
          })),
        },
        auditLogs: {
          create: {
            user: 'System',
            newStatus: 'Processing',
            notes: 'Order created',
          },
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: { media: true },
            },
          },
        },
        auditLogs: true,
      },
    });

    // Create transaction record
    await req.prisma.transaction.create({
      data: {
        type: 'sale',
        amount: total,
        currency: currency || 'GBP',
        reference: orderId,
        description: `Order ${orderId}`,
        status: 'completed',
      },
    });

    // Update inventory (reduce stock)
    for (const item of items) {
      if (item.variationId) {
        await req.prisma.inventoryItem.updateMany({
          where: { variationId: item.variationId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await req.prisma.inventoryItem.updateMany({
          where: { productId: item.id || item.productId, variationId: null },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    res.status(201).json(formatOrder(order));
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /orders/:id - Update order
router.put('/:id', authenticate, authorize(['admin', 'seller', 'order_manager', 'shipping_coordinator']), async (req, res) => {
  try {
    const id = req.params.id;
    const { updates, notes } = req.body;
    const { status, carrier, trackingNumber, trackingUrl, shippingNotes } = updates || req.body;

    const existingOrder = await req.prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (carrier) updateData.carrier = carrier;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (trackingUrl) updateData.trackingUrl = trackingUrl;
    if (shippingNotes) updateData.shippingNotes = shippingNotes;

    const order = await req.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              include: { media: true },
            },
          },
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    // Create audit log if status changed
    if (status && status !== existingOrder.status) {
      await req.prisma.orderAuditLog.create({
        data: {
          orderId: id,
          user: req.user.name || 'System',
          previousStatus: existingOrder.status,
          newStatus: status,
          notes: notes || `Status updated to ${status}`,
        },
      });
    }

    // Fetch updated order
    const updatedOrder = await req.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { media: true },
            },
          },
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    res.json(formatOrder(updatedOrder));
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /orders/:id - Delete order (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = req.params.id;

    await req.prisma.order.delete({ where: { id } });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;

