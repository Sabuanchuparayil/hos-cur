const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Default tax rates (can be stored in database later)
const DEFAULT_TAX_RATES = {
  GB: 0.20,
  US: 0.08,
  EU: 0.21,
  CA: 0.13,
  AU: 0.10,
  ROW: 0.00, // Rest of World
};

// In-memory storage (in production, store in database)
let taxRates = { ...DEFAULT_TAX_RATES };

/**
 * GET /financials/tax-rates
 * Get current tax rates
 */
router.get('/tax-rates', authenticateToken, (req, res) => {
  try {
    // Check if user has permission (admin or finance manager)
    if (req.user.role !== 'admin' && req.user.role !== 'finance_manager' && req.user.role !== 'accountant') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    res.json(taxRates);
  } catch (error) {
    logger.error('Error fetching tax rates', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch tax rates' });
  }
});

/**
 * PUT /financials/tax-rates
 * Update tax rates
 */
router.put('/tax-rates', authenticateToken, (req, res) => {
  try {
    // Check if user has permission (admin or finance manager)
    if (req.user.role !== 'admin' && req.user.role !== 'finance_manager' && req.user.role !== 'accountant') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const { rates } = req.body;

    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ error: 'Invalid tax rates format' });
    }

    // Validate rates are numbers between 0 and 1
    for (const [country, rate] of Object.entries(rates)) {
      if (typeof rate !== 'number' || rate < 0 || rate > 1) {
        return res.status(400).json({ 
          error: `Invalid tax rate for ${country}: must be a number between 0 and 1` 
        });
      }
    }

    // Update tax rates
    taxRates = { ...taxRates, ...rates };

    logger.info('Tax rates updated', { updatedBy: req.user.email, rates: taxRates });

    res.json(taxRates);
  } catch (error) {
    logger.error('Error updating tax rates', { error: error.message });
    res.status(500).json({ error: 'Failed to update tax rates' });
  }
});

module.exports = router;

