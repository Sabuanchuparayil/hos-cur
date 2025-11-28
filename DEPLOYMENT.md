# 🚀 House of Spells - Deployment Guide

This guide covers deploying your House of Spells e-commerce platform to Railway (recommended) or other hosting providers.

## 📋 Prerequisites

- GitHub account with your code pushed
- Railway account (free tier available at [railway.app](https://railway.app))
- Node.js 18+ for local testing

---

## 🚂 Deploy to Railway (Recommended)

Railway provides easy deployment with PostgreSQL and automatic SSL.

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Connect your GitHub and select this repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically provision a PostgreSQL database
3. Click on the database service to see the connection details
4. Copy the `DATABASE_URL` (you'll need this for the backend)

### Step 3: Deploy Backend

1. Click **"New"** → **"GitHub Repo"** (same repo)
2. In the service settings:
   - Set **Root Directory**: `backend`
   - Set **Build Command**: `npm install && npx prisma generate`
   - Set **Start Command**: `npx prisma migrate deploy && npm start`

3. Add **Environment Variables**:
   ```
   DATABASE_URL=<paste from PostgreSQL service>
   JWT_SECRET=<generate a strong random string - use: openssl rand -base64 32>
   FRONTEND_URL=https://your-frontend-url.railway.app
   NODE_ENV=production
   PORT=3001
   ```

4. Click **Deploy**

### Step 4: Deploy Frontend

1. Click **"New"** → **"GitHub Repo"** (same repo, root directory)
2. In the service settings:
   - Set **Root Directory**: `.` (root)
   - Set **Build Command**: `npm install && npm run build`
   - Set **Start Command**: `npx serve -s dist -l 8080`

3. Add **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

4. Click **Deploy**

### Step 5: Configure Custom Domain (Optional)

1. Click on each service → Settings → Domains
2. Add your custom domain or use the generated `.railway.app` domain

---

## 🐳 Local Development with Docker

```bash
# Start everything with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

---

## 📦 Manual Deployment (VPS/Server)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/house_of_spells"
JWT_SECRET="your-super-secret-key"
FRONTEND_URL="https://your-frontend-domain.com"
NODE_ENV="production"
PORT=3001
EOF

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database (optional)
npm run prisma:seed

# Start server
npm start
```

### Frontend Setup

```bash
# Create .env file for frontend
echo "VITE_API_URL=https://your-backend-domain.com" > .env

# Install dependencies and build
npm install
npm run build

# Serve with any static file server
npx serve -s dist -l 8080
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] Generate a strong JWT_SECRET (32+ characters, random)
- [ ] Use HTTPS for both frontend and backend
- [ ] Set proper CORS origins (FRONTEND_URL)
- [ ] Change all default passwords in seed data
- [ ] Enable rate limiting on the backend
- [ ] Set up database backups
- [ ] Configure logging and monitoring

---

## 🧪 Testing Your Deployment

### Health Check
```bash
curl https://your-backend-url.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Login Test
```bash
curl -X POST https://your-backend-url.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hogwarts.edu","password":"password123"}'
```

### Get Products
```bash
curl https://your-backend-url.railway.app/products
```

---

## 🔧 Environment Variables Reference

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment mode | No |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |

---

## 📊 Monitoring & Logs

### Railway
- View logs in the Railway dashboard
- Set up alerts for service health

### Self-hosted
```bash
# View backend logs
pm2 logs house-of-spells-backend

# Or with Docker
docker-compose logs -f backend
```

---

## 🆘 Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if database is accessible from your server
- Ensure SSL mode is configured if required

### CORS Errors
- Verify FRONTEND_URL is set correctly
- Check browser console for specific CORS errors
- Ensure no trailing slashes in URLs

### Build Failures
- Check Node.js version (18+ required)
- Clear node_modules and reinstall
- Verify all environment variables are set

### Authentication Issues
- Verify JWT_SECRET is the same across deployments
- Check token expiration
- Clear localStorage and re-login

---

## 🎉 Default Login Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hogwarts.edu | password123 |
| Seller | seller@diagonalley.com | password123 |
| Customer | customer@hogwarts.edu | password123 |

⚠️ **Change these passwords in production!**

---

## 📞 Support

If you encounter issues:
1. Check the Railway logs for error messages
2. Verify all environment variables are set
3. Test the health endpoint
4. Review the browser console for frontend errors

