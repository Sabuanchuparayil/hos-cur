const express = require('express');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /platform/themes - Get all themes
router.get('/', optionalAuth, async (req, res) => {
  try {
    const themes = await req.prisma.themeConfiguration.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    res.json(themes.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      preview: t.preview,
      isDefault: t.isDefault,
      isCustom: t.isCustom,
      isPremium: t.isPremium,
      price: t.price,
      cssContent: t.cssContent,
      variables: t.variables,
      layout: t.layout,
    })));
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// GET /platform/themes/:id - Get single theme
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = req.params.id;

    const theme = await req.prisma.themeConfiguration.findUnique({
      where: { id },
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    res.json({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      preview: theme.preview,
      isDefault: theme.isDefault,
      isCustom: theme.isCustom,
      isPremium: theme.isPremium,
      price: theme.price,
      cssContent: theme.cssContent,
      variables: theme.variables,
      layout: theme.layout,
    });
  } catch (error) {
    console.error('Get theme error:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

// POST /platform/themes - Create theme (admin only)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      preview,
      isDefault,
      isCustom,
      isPremium,
      price,
      cssContent,
      variables,
      layout,
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await req.prisma.themeConfiguration.updateMany({
        data: { isDefault: false },
      });
    }

    const theme = await req.prisma.themeConfiguration.create({
      data: {
        id: id || `theme-${Date.now()}`,
        name,
        description,
        preview,
        isDefault: isDefault || false,
        isCustom: isCustom || false,
        isPremium: isPremium || false,
        price,
        cssContent,
        variables,
        layout: layout || 'standard',
      },
    });

    res.status(201).json({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      preview: theme.preview,
      isDefault: theme.isDefault,
      isCustom: theme.isCustom,
      isPremium: theme.isPremium,
      price: theme.price,
      cssContent: theme.cssContent,
      variables: theme.variables,
      layout: theme.layout,
    });
  } catch (error) {
    console.error('Create theme error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Theme ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// PUT /platform/themes/:id - Update theme (admin only)
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = req.params.id;
    const {
      name,
      description,
      preview,
      isDefault,
      isCustom,
      isPremium,
      price,
      cssContent,
      variables,
      layout,
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await req.prisma.themeConfiguration.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    const theme = await req.prisma.themeConfiguration.update({
      where: { id },
      data: {
        name,
        description,
        preview,
        isDefault,
        isCustom,
        isPremium,
        price,
        cssContent,
        variables,
        layout,
      },
    });

    res.json({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      preview: theme.preview,
      isDefault: theme.isDefault,
      isCustom: theme.isCustom,
      isPremium: theme.isPremium,
      price: theme.price,
      cssContent: theme.cssContent,
      variables: theme.variables,
      layout: theme.layout,
    });
  } catch (error) {
    console.error('Update theme error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Theme not found' });
    }
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// DELETE /platform/themes/:id - Delete theme (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = req.params.id;

    const theme = await req.prisma.themeConfiguration.findUnique({
      where: { id },
    });

    if (theme?.isDefault) {
      return res.status(400).json({ error: 'Cannot delete the default theme' });
    }

    await req.prisma.themeConfiguration.delete({ where: { id } });

    res.json({ message: 'Theme deleted successfully' });
  } catch (error) {
    console.error('Delete theme error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Theme not found' });
    }
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

module.exports = router;

