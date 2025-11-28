const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /content/homepage - Get homepage content
router.get('/homepage', optionalAuth, async (req, res) => {
  try {
    const content = await req.prisma.homePageContent.findUnique({
      where: { id: 1 },
    });

    if (!content) {
      // Return default content if none exists
      return res.json({
        heroTitle: { en: 'Welcome to House of Spells', es: 'Bienvenido a House of Spells' },
        heroSubtitle: { en: 'Discover magical merchandise', es: 'Descubre productos mágicos' },
        heroImage: '',
        featuredProductIds: [],
        banners: [],
      });
    }

    res.json(content.content);
  } catch (error) {
    console.error('Get homepage content error:', error);
    res.status(500).json({ error: 'Failed to fetch homepage content' });
  }
});

// PUT /content/homepage - Update homepage content
router.put('/homepage', authenticate, authorize(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const content = req.body;

    const saved = await req.prisma.homePageContent.upsert({
      where: { id: 1 },
      update: { content },
      create: { id: 1, content },
    });

    res.json(saved.content);
  } catch (error) {
    console.error('Update homepage content error:', error);
    res.status(500).json({ error: 'Failed to update homepage content' });
  }
});

module.exports = router;

