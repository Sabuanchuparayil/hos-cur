const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /returns - Get all return requests
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, orderId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;

    // Customers can only see their own returns
    if (req.user.role === 'customer') {
      const userOrders = await req.prisma.order.findMany({
        where: { userId: req.user.id },
        select: { id: true },
      });
      where.orderId = { in: userOrders.map(o => o.id) };
    }

    const returns = await req.prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: { media: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(returns.map(r => ({
      id: r.id,
      orderId: r.orderId,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      returnLabel: r.returnLabel,
      refundAmount: r.refundAmount,
      refundMethod: r.refundMethod,
    })));
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// GET /returns/:id - Get single return request
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;

    const returnRequest = await req.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: { media: true },
                },
              },
            },
          },
        },
      },
    });

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    // Check access for customers
    if (req.user.role === 'customer' && returnRequest.order?.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: returnRequest.id,
      orderId: returnRequest.orderId,
      reason: returnRequest.reason,
      details: returnRequest.details,
      status: returnRequest.status,
      createdAt: returnRequest.createdAt.toISOString(),
      returnLabel: returnRequest.returnLabel,
      refundAmount: returnRequest.refundAmount,
      refundMethod: returnRequest.refundMethod,
    });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ error: 'Failed to fetch return request' });
  }
});

// POST /returns - Create return request
router.post('/', authenticate, async (req, res) => {
  try {
    const { orderId, reason, details } = req.body;

    // Verify order exists and belongs to user (for customers)
    const order = await req.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.user.role === 'customer' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if return already exists
    const existingReturn = await req.prisma.returnRequest.findFirst({
      where: { orderId },
    });

    if (existingReturn) {
      return res.status(400).json({ error: 'Return request already exists for this order' });
    }

    const returnRequest = await req.prisma.returnRequest.create({
      data: {
        orderId,
        reason,
        details,
        status: 'Pending Review',
      },
    });

    // Update order status
    await req.prisma.order.update({
      where: { id: orderId },
      data: { status: 'Return Requested' },
    });

    res.status(201).json({
      id: returnRequest.id,
      orderId: returnRequest.orderId,
      reason: returnRequest.reason,
      details: returnRequest.details,
      status: returnRequest.status,
      createdAt: returnRequest.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ error: 'Failed to create return request' });
  }
});

// PUT /returns/:id - Update return request
router.put('/:id', authenticate, authorize(['admin', 'support_agent', 'order_manager']), async (req, res) => {
  try {
    const id = req.params.id;
    const { status, returnLabel, refundAmount, refundMethod } = req.body;

    const returnRequest = await req.prisma.returnRequest.update({
      where: { id },
      data: {
        status,
        returnLabel,
        refundAmount,
        refundMethod,
      },
    });

    // Update order status based on return status
    if (status) {
      let orderStatus = 'Return Requested';
      if (status.includes('Approved')) orderStatus = 'Return Approved';
      if (status.includes('Completed')) orderStatus = 'Refunded';
      if (status.includes('Rejected')) orderStatus = 'Return Rejected';

      await req.prisma.order.update({
        where: { id: returnRequest.orderId },
        data: { status: orderStatus },
      });

      // If refund completed, create transaction
      if (status.includes('Completed') && refundAmount) {
        await req.prisma.transaction.create({
          data: {
            type: 'refund',
            amount: -refundAmount,
            currency: 'GBP',
            reference: returnRequest.orderId,
            description: `Refund for return ${id}`,
            status: 'completed',
            processedBy: req.user.name,
          },
        });
      }
    }

    res.json({
      id: returnRequest.id,
      orderId: returnRequest.orderId,
      reason: returnRequest.reason,
      details: returnRequest.details,
      status: returnRequest.status,
      createdAt: returnRequest.createdAt.toISOString(),
      returnLabel: returnRequest.returnLabel,
      refundAmount: returnRequest.refundAmount,
      refundMethod: returnRequest.refundMethod,
    });
  } catch (error) {
    console.error('Update return error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Return request not found' });
    }
    res.status(500).json({ error: 'Failed to update return request' });
  }
});

// DELETE /returns/:id - Delete return request (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = req.params.id;

    await req.prisma.returnRequest.delete({ where: { id } });

    res.json({ message: 'Return request deleted successfully' });
  } catch (error) {
    console.error('Delete return error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Return request not found' });
    }
    res.status(500).json({ error: 'Failed to delete return request' });
  }
});

module.exports = router;

