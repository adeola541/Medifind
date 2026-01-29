# MediFind Backend - Railway Deployment Guide

Complete guide to deploy the MediFind backend API to Railway using GitHub integration.

## Prerequisites

- GitHub account with your code repository
- Railway account (sign up at [railway.app](https://railway.app))
- Foursquare API key (get from [foursquare.com/developers](https://foursquare.com/developers))

## Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Initial backend setup"
   git push origin main
   ```

2. **Verify required files exist**:
   - `package.json` with `engines.node: "20.x"`
   - `prisma/schema.prisma`
   - `src/server.js` as entry point

## Step 2: Create Railway Project

1. **Login to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your MediFind backend repository
   - Select the branch (usually `main`)

## Step 3: Add PostgreSQL Database

1. **Add Database Service**:
   - In your Railway project dashboard
   - Click "New Service"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create the database

2. **Get Database URL**:
   - Click on the PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL` value (starts with `postgresql://`)

## Step 4: Configure Environment Variables

1. **Go to Backend Service**:
   - Click on your backend service (not the database)
   - Navigate to "Variables" tab

2. **Add Required Variables**:

   | Variable Name | Value | Description |
   |---------------|-------|-------------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-reference to database |
   | `JWT_SECRET` | `your-super-secret-jwt-key-here` | Strong random string |
   | `PORT` | `3000` | Server port |
   | `FOURSQUARE_API_KEY` | `your-foursquare-api-key` | Foursquare API key |
   | `NODE_ENV` | `production` | Environment mode |

3. **Generate JWT Secret**:
   ```bash
   # Generate a secure random string
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

## Step 5: Configure Build Settings

1. **Set Build Command** (if needed):
   - Go to "Settings" tab in your backend service
   - Under "Build", set:
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`

2. **Railway automatically detects**:
   - Node.js project from `package.json`
   - Uses Nixpacks for building
   - Runs `npm install` automatically

## Step 6: Deploy and Run Migrations

1. **Initial Deployment**:
   - Railway will automatically deploy after configuration
   - Wait for build to complete (check "Deployments" tab)

2. **Run Database Migrations**:
   
   **Option A: Using Railway CLI** (Recommended):
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Link to your project
   railway link
   
   # Run migrations against production database
   railway run npx prisma db push
   
   # Seed the database (optional)
   railway run npm run seed
   ```

   **Option B: Add to Start Command**:
   - In Railway Settings → "Start Command":
   ```bash
   npx prisma db push && npm start
   ```

## Step 7: Verify Deployment

1. **Check Service Health**:
   - Your service will have a URL like: `https://your-app-name.up.railway.app`
   - Visit: `https://your-app-name.up.railway.app/api/health`
   - Should return: `{"status":"ok","message":"Service is healthy"}`

2. **Test API Endpoints**:
   ```bash
   # Test health endpoint
   curl https://your-app-name.up.railway.app/api/health
   
   # Test root endpoint
   curl https://your-app-name.up.railway.app/
   ```

## Step 8: Set Up Automatic Deployments

1. **GitHub Integration** (Already configured):
   - Railway automatically deploys on every push to main branch
   - Check "Deployments" tab to see build status

2. **Branch Protection** (Optional):
   - In GitHub repository settings
   - Add branch protection rules for main branch

## Step 9: Environment-Specific Configuration

### Production Environment Variables

Add these additional variables for production:

| Variable | Value | Purpose |
|----------|-------|---------|
| `CORS_ORIGINS` | `https://your-frontend-domain.com` | Frontend URL |
| `LOG_LEVEL` | `info` | Logging level |
| `MAX_REQUEST_SIZE` | `10mb` | Request size limit |

### Database Connection Pooling

For high traffic, add to `DATABASE_URL`:
```
postgresql://user:pass@host:port/db?connection_limit=20&pool_timeout=20
```

## Step 10: Monitoring and Maintenance

1. **View Logs**:
   - Railway dashboard → Your service → "Logs" tab
   - Or use CLI: `railway logs`

2. **Monitor Metrics**:
   - Check "Metrics" tab for CPU, memory, network usage
   - Set up alerts if needed

3. **Database Management**:
   ```bash
   # Connect to production database
   railway connect Postgres
   
   # Run Prisma Studio against production
   railway run npx prisma studio
   ```

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check Node.js version in `package.json` engines
   - Verify all dependencies are in `package.json`

2. **Database Connection Error**:
   - Ensure `DATABASE_URL` is correctly set
   - Check if migrations were run

3. **Environment Variables Missing**:
   - Verify all required variables are set
   - Check variable names match exactly

4. **CORS Issues**:
   - Add your frontend domain to allowed origins in `app.js`
   - Update CORS configuration

### Debug Commands:
```bash
# Check environment variables
railway run env

# Test database connection
railway run npx prisma db pull

# View recent logs
railway logs --tail

# Restart service
railway up --detach
```

## Security Checklist

- [ ] Strong JWT secret (64+ characters)
- [ ] Database URL not exposed in logs
- [ ] CORS properly configured
- [ ] Environment variables set correctly
- [ ] No sensitive data in repository
- [ ] API rate limiting configured (if needed)

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domain (if needed)
3. Set up staging environment
4. Implement CI/CD pipeline
5. Add health checks and metrics

Your MediFind backend is now deployed and ready for production use! 🚀
