# House of Spells - Backend API

Express.js + Prisma + PostgreSQL backend for the House of Spells e-commerce platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Docker)

### Local Development with Docker

```bash
# Start PostgreSQL and backend
docker-compose up -d

# The API will be available at http://localhost:3001
```

### Manual Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment:**
Create a `.env` file in the backend folder:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/house_of_spells?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

3. **Set up database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

4. **Start the server:**
```bash
npm run dev   # Development with hot reload
npm start     # Production
```

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/me` - Get current user

### Users
- `GET /users` - List all users (admin)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (admin)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (admin)

### Products
- `GET /products` - List all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Orders
- `GET /orders` - List orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create order
- `PUT /orders/:id` - Update order status

### Sellers
- `GET /sellers` - List sellers
- `GET /sellers/:id` - Get seller by ID
- `POST /sellers` - Create seller application
- `PUT /sellers/:id` - Update seller

### Reviews
- `GET /reviews` - List reviews
- `POST /reviews` - Create review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

### Promotions
- `GET /promotions` - List promotions
- `GET /promotions/validate/:code` - Validate promo code
- `POST /promotions` - Create promotion (admin)
- `PUT /promotions/:id` - Update promotion (admin)

### Platform
- `GET /platform/themes` - Get available themes
- `GET /carriers` - Get shipping carriers
- `GET /content/homepage` - Get homepage content
- `PUT /content/homepage` - Update homepage content

## 🚂 Railway Deployment

1. **Create a new project on Railway**

2. **Add PostgreSQL database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` from the database settings

3. **Add backend service:**
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set the root directory to `backend`

4. **Configure environment variables:**
   ```
   DATABASE_URL=<from PostgreSQL service>
   JWT_SECRET=<generate a strong random string>
   FRONTEND_URL=https://your-frontend-url.railway.app
   NODE_ENV=production
   ```

5. **Deploy!**
   Railway will automatically build and deploy on push.

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `PORT` | Server port (default: 3001) | No |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Database seeder
├── src/
│   ├── index.js         # Express app entry point
│   ├── middleware/
│   │   └── auth.js      # JWT authentication
│   └── routes/
│       ├── auth.js      # Authentication routes
│       ├── users.js     # User management
│       ├── products.js  # Product catalog
│       ├── orders.js    # Order management
│       ├── sellers.js   # Seller management
│       ├── reviews.js   # Product reviews
│       └── ...          # Other routes
├── Dockerfile
├── package.json
└── railway.json
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hogwarts.edu","password":"password123"}'

# Get products
curl http://localhost:3001/products
```

