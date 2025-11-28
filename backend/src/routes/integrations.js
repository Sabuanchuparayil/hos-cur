const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /integrations - Get integration settings
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const settings = await req.prisma.integrationSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        payment: {
          stripe: { enabled: false, testMode: true },
          paypal: { enabled: false, testMode: true },
        },
        shipping: {
          royalMail: { enabled: false },
          dhl: { enabled: false },
        },
        analytics: {
          googleAnalytics: { enabled: false },
        },
        email: {
          sendgrid: { enabled: false },
        },
      });
    }

    res.json(settings.settings);
  } catch (error) {
    console.error('Get integration settings error:', error);
    res.status(500).json({ error: 'Failed to fetch integration settings' });
  }
});

// PUT /integrations - Update integration settings
router.put('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const settings = req.body;

    const saved = await req.prisma.integrationSettings.upsert({
      where: { id: 1 },
      update: { settings },
      create: { id: 1, settings },
    });

    res.json(saved.settings);
  } catch (error) {
    console.error('Update integration settings error:', error);
    res.status(500).json({ error: 'Failed to update integration settings' });
  }
});

module.exports = router;

