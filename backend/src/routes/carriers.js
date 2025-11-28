const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /carriers - Get all carriers
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { active } = req.query;
    
    const where = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const carriers = await req.prisma.carrier.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(carriers.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      trackingUrl: c.trackingUrl,
      logo: c.logo,
      isActive: c.isActive,
      services: c.services,
      rates: c.rates,
    })));
  } catch (error) {
    console.error('Get carriers error:', error);
    res.status(500).json({ error: 'Failed to fetch carriers' });
  }
});

// GET /carriers/:id - Get single carrier
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const carrier = await req.prisma.carrier.findUnique({
      where: { id },
    });

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    res.json({
      id: carrier.id,
      name: carrier.name,
      code: carrier.code,
      trackingUrl: carrier.trackingUrl,
      logo: carrier.logo,
      isActive: carrier.isActive,
      services: carrier.services,
      rates: carrier.rates,
    });
  } catch (error) {
    console.error('Get carrier error:', error);
    res.status(500).json({ error: 'Failed to fetch carrier' });
  }
});

// POST /carriers - Create carrier (admin only)
router.post('/', authenticate, authorize(['admin', 'logistics_coordinator']), async (req, res) => {
  try {
    const { name, code, trackingUrl, logo, isActive, services, rates } = req.body;

    const carrier = await req.prisma.carrier.create({
      data: {
        name,
        code,
        trackingUrl,
        logo,
        isActive: isActive !== false,
        services,
        rates,
      },
    });

    res.status(201).json({
      id: carrier.id,
      name: carrier.name,
      code: carrier.code,
      trackingUrl: carrier.trackingUrl,
      logo: carrier.logo,
      isActive: carrier.isActive,
      services: carrier.services,
      rates: carrier.rates,
    });
  } catch (error) {
    console.error('Create carrier error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Carrier code already exists' });
    }
    res.status(500).json({ error: 'Failed to create carrier' });
  }
});

// PUT /carriers/:id - Update carrier (admin only)
router.put('/:id', authenticate, authorize(['admin', 'logistics_coordinator']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, trackingUrl, logo, isActive, services, rates } = req.body;

    const carrier = await req.prisma.carrier.update({
      where: { id },
      data: {
        name,
        code,
        trackingUrl,
        logo,
        isActive,
        services,
        rates,
      },
    });

    res.json({
      id: carrier.id,
      name: carrier.name,
      code: carrier.code,
      trackingUrl: carrier.trackingUrl,
      logo: carrier.logo,
      isActive: carrier.isActive,
      services: carrier.services,
      rates: carrier.rates,
    });
  } catch (error) {
    console.error('Update carrier error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Carrier not found' });
    }
    res.status(500).json({ error: 'Failed to update carrier' });
  }
});

// DELETE /carriers/:id - Delete carrier (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await req.prisma.carrier.delete({ where: { id } });

    res.json({ message: 'Carrier deleted successfully' });
  } catch (error) {
    console.error('Delete carrier error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Carrier not found' });
    }
    res.status(500).json({ error: 'Failed to delete carrier' });
  }
});

module.exports = router;

