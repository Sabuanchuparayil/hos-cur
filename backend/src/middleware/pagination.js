/**
 * Pagination middleware and helper functions
 */

/**
 * Parse pagination parameters from request query
 */
const parsePaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Format paginated response
 */
const formatPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Middleware to add pagination helpers to request
 */
const paginationMiddleware = (req, res, next) => {
  req.pagination = parsePaginationParams(req);
  
  // Helper function to send paginated response
  res.paginate = (data, total) => {
    const { page, limit } = req.pagination;
    res.json(formatPaginatedResponse(data, total, page, limit));
  };

  next();
};

module.exports = {
  paginationMiddleware,
  parsePaginationParams,
  formatPaginatedResponse,
};

