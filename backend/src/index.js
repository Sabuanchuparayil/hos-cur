require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { initRedis } = require('./utils/cache');
const { paginationMiddleware } = require('./middleware/pagination');
const { publicLimiter } = require('./middleware/rateLimiter');
const { logger, httpLogger } = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const sellersRoutes = require('./routes/sellers');
const reviewsRoutes = require('./routes/reviews');
const promotionsRoutes = require('./routes/promotions');
const carriersRoutes = require('./routes/carriers');
const themesRoutes = require('./routes/themes');
const returnsRoutes = require('./routes/returns');
const transactionsRoutes = require('./routes/transactions');
const rolesRoutes = require('./routes/roles');
const contentRoutes = require('./routes/content');
const integrationsRoutes = require('./routes/integrations');
const wishlistRoutes = require('./routes/wishlist');

const app = express();
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(httpLogger);

// Apply global rate limiting to all requests
app.use(publicLimiter);

// Add pagination helpers to all requests
app.use(paginationMiddleware);

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/sellers', sellersRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/promotions', promotionsRoutes);
app.use('/carriers', carriersRoutes);
app.use('/platform/themes', themesRoutes);
app.use('/returns', returnsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/roles', rolesRoutes);
app.use('/content', contentRoutes);
app.use('/integrations', integrationsRoutes);
app.use('/wishlist', wishlistRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing HTTP server and Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server immediately, initialize Redis in background
app.listen(PORT, '0.0.0.0', () => {
  logger.info('🪄 House of Spells API started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  
  // Initialize Redis in background (non-blocking)
  initRedis().then(() => {
    if (process.env.REDIS_URL) {
      logger.info('Redis initialization complete');
    }
  }).catch((error) => {
    logger.warn('Redis initialization failed, continuing without cache', { error: error.message });
  });
});

module.exports = app;

