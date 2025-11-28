const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /roles - Get all roles
router.get('/', authenticate, async (req, res) => {
  try {
    const roles = await req.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
    })));
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /roles/:id - Get single role
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const role = await req.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// POST /roles - Create role (admin only)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = await req.prisma.role.create({
      data: {
        name,
        description,
        permissions: permissions || [],
      },
    });

    res.status(201).json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
  } catch (error) {
    console.error('Create role error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /roles/:id - Update role (admin only)
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, permissions } = req.body;

    const role = await req.prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions,
      },
    });

    res.json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
  } catch (error) {
    console.error('Update role error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /roles/:id - Delete role (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await req.prisma.role.delete({ where: { id } });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

module.exports = router;

