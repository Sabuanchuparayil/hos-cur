const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /transactions - Get all transactions
router.get('/', authenticate, authorize(['admin', 'finance_manager', 'accountant', 'seller']), async (req, res) => {
  try {
    const { sellerId, type, status } = req.query;
    
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    // Sellers can only see their own transactions
    if (req.user.role === 'seller') {
      const seller = await req.prisma.seller.findUnique({
        where: { userId: req.user.id },
      });
      if (seller) {
        where.sellerId = seller.id;
      }
    } else if (sellerId) {
      where.sellerId = parseInt(sellerId);
    }

    const transactions = await req.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json(transactions.map(t => ({
      id: t.id,
      sellerId: t.sellerId,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      reference: t.reference,
      description: t.description,
      status: t.status,
      processedBy: t.processedBy,
      date: t.date.toISOString(),
    })));
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /transactions - Create transaction (admin/finance only)
router.post('/', authenticate, authorize(['admin', 'finance_manager', 'accountant']), async (req, res) => {
  try {
    const { sellerId, type, amount, currency, reference, description } = req.body;

    const transaction = await req.prisma.transaction.create({
      data: {
        sellerId: sellerId ? parseInt(sellerId) : null,
        type,
        amount,
        currency: currency || 'GBP',
        reference,
        description,
        status: 'completed',
        processedBy: req.user.name,
      },
    });

    // Update seller balance if applicable
    if (sellerId) {
      const seller = await req.prisma.seller.findUnique({ where: { id: parseInt(sellerId) } });
      if (seller) {
        const financials = seller.financials || { balance: { GBP: 0, USD: 0, EUR: 0 } };
        const curr = currency || 'GBP';
        
        if (type === 'payout') {
          financials.balance[curr] = (financials.balance[curr] || 0) - Math.abs(amount);
        } else if (type === 'adjustment' || type === 'sale') {
          financials.balance[curr] = (financials.balance[curr] || 0) + amount;
        }

        await req.prisma.seller.update({
          where: { id: parseInt(sellerId) },
          data: { financials },
        });
      }
    }

    res.status(201).json({
      id: transaction.id,
      sellerId: transaction.sellerId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      reference: transaction.reference,
      description: transaction.description,
      status: transaction.status,
      processedBy: transaction.processedBy,
      date: transaction.date.toISOString(),
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// POST /transactions/payout - Process seller payout
router.post('/payout', authenticate, authorize(['admin', 'finance_manager']), async (req, res) => {
  try {
    const { sellerId, currency } = req.body;

    const seller = await req.prisma.seller.findUnique({
      where: { id: parseInt(sellerId) },
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    if (!seller.payoutsEnabled) {
      return res.status(400).json({ error: 'Payouts not enabled for this seller' });
    }

    const financials = seller.financials || { balance: { GBP: 0 } };
    const balance = financials.balance?.[currency] || 0;

    if (balance <= 0) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create payout record
    const payout = await req.prisma.payout.create({
      data: {
        sellerId: parseInt(sellerId),
        amount: balance,
        currency,
        status: 'processing',
      },
    });

    // Create transaction
    const transaction = await req.prisma.transaction.create({
      data: {
        sellerId: parseInt(sellerId),
        type: 'payout',
        amount: -balance,
        currency,
        reference: `PAYOUT-${payout.id}`,
        description: `Payout to seller`,
        status: 'completed',
        processedBy: req.user.name,
      },
    });

    // Update seller balance
    financials.balance[currency] = 0;
    await req.prisma.seller.update({
      where: { id: parseInt(sellerId) },
      data: { financials },
    });

    // Update payout status
    await req.prisma.payout.update({
      where: { id: payout.id },
      data: { status: 'completed', processedAt: new Date() },
    });

    res.json({
      success: true,
      payout: {
        id: payout.id,
        amount: balance,
        currency,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

module.exports = router;

