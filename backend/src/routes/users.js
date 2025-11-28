const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /users - Get all users (admin only)
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await req.prisma.user.findMany({
      include: { addresses: true },
      orderBy: { createdAt: 'desc' },
    });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /users/:id - Get single user
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Users can only view their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id },
      include: { addresses: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users - Create user (admin only)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await req.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'customer',
        phone,
        loyaltyPoints: 0,
      },
      include: { addresses: true },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /users/:id - Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Users can only update their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, phone, role, loyaltyPoints, addresses } = req.body;

    // Only admin can change role
    const updateData = {
      name,
      email,
      phone,
    };

    if (req.user.role === 'admin') {
      if (role) updateData.role = role;
      if (loyaltyPoints !== undefined) updateData.loyaltyPoints = loyaltyPoints;
    }

    const user = await req.prisma.user.update({
      where: { id },
      data: updateData,
      include: { addresses: true },
    });

    // Handle addresses if provided
    if (addresses && Array.isArray(addresses)) {
      // Delete existing addresses and recreate
      await req.prisma.address.deleteMany({ where: { userId: id } });
      
      for (const addr of addresses) {
        await req.prisma.address.create({
          data: {
            userId: id,
            isDefault: addr.isDefault || false,
            firstName: addr.firstName,
            lastName: addr.lastName,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            city: addr.city,
            postalCode: addr.postalCode,
            country: addr.country || 'GB',
          },
        });
      }
    }

    // Fetch updated user with addresses
    const updatedUser = await req.prisma.user.findUnique({
      where: { id },
      include: { addresses: true },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /users/:id - Delete user (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await req.prisma.user.delete({ where: { id } });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /users/:id/addresses - Add address
router.post('/:id/addresses', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { isDefault, firstName, lastName, addressLine1, addressLine2, city, postalCode, country } = req.body;

    // If this is default, unset other defaults
    if (isDefault) {
      await req.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await req.prisma.address.create({
      data: {
        userId,
        isDefault: isDefault || false,
        firstName,
        lastName,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        country: country || 'GB',
      },
    });

    res.status(201).json(address);
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

module.exports = router;

