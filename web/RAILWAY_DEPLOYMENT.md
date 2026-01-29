# MediFind Web Frontend - Railway Deployment Guide

Complete guide to deploy the MediFind Next.js admin dashboard to Railway using GitHub integration.

## Prerequisites

- GitHub account with your web frontend repository
- Railway account (sign up at [railway.app](https://railway.app))
- Backend API already deployed and running

## Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Initial web frontend setup"
   git push origin main
   ```

2. **Verify required files exist**:
   - `package.json` with `engines.node: "20.x"`
   - `next.config.ts` with `output: "standalone"`
   - `.env` file (will be configured in Railway)

## Step 2: Create Railway Project

1. **Login to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your MediFind web frontend repository
   - Select the branch (usually `main`)

## Step 3: Configure Environment Variables

1. **Go to Web Service Settings**:
   - Click on your web service
   - Navigate to "Variables" tab

2. **Add Required Variables**:

   | Variable Name | Value | Description |
   |---------------|-------|-------------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend-url.up.railway.app/api` | Backend API URL |
   | `NODE_ENV` | `production` | Environment mode |
   | `PORT` | `3000` | Server port |

3. **Get Backend URL**:
   - Go to your backend Railway service
   - Copy the public URL from the service overview
   - Add `/api` to the end for the API base URL

## Step 4: Configure Build Settings

1. **Railway Auto-Detection**:
   - Railway automatically detects Next.js projects
   - Uses Nixpacks for building
   - Runs `npm install` and `npm run build` automatically

2. **Verify Build Configuration**:
   - **Build Command**: `npm run build` (auto-detected)
   - **Start Command**: `npm start` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

## Step 5: Deploy the Application

1. **Initial Deployment**:
   - Railway will automatically start building after configuration
   - Monitor progress in "Deployments" tab
   - Build typically takes 2-5 minutes

2. **Verify Build Success**:
   - Check "Deployments" tab for green checkmark
   - Look for "Build successful" message
   - Note any build warnings or errors

## Step 6: Configure Custom Domain (Optional)

1. **Add Custom Domain**:
   - Go to "Settings" tab
   - Click "Domains"
   - Add your custom domain
   - Update DNS records as instructed

2. **SSL Certificate**:
   - Railway automatically provides SSL certificates
   - HTTPS is enabled by default

## Step 7: Verify Deployment

1. **Test Application**:
   - Visit your Railway-provided URL
   - Should see MediFind login page
   - Test login functionality with backend

2. **Check API Connection**:
   - Open browser developer tools
   - Monitor network requests to backend
   - Verify API calls are successful

## Step 8: Set Up Automatic Deployments

1. **GitHub Integration** (Already configured):
   - Railway automatically deploys on every push to main branch
   - Check "Deployments" tab to see build status

2. **Environment-Specific Branches** (Optional):
   ```bash
   # Create staging branch
   git checkout -b staging
   git push origin staging
   
   # Deploy staging branch to separate Railway service
   ```

## Step 9: Performance Optimization

### Next.js Configuration

Update `next.config.ts` for production:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    domains: ['your-image-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Remove build errors ignore for production
  typescript: {
    ignoreBuildErrors: false, // Fix TypeScript errors instead
  },
  
  // Enable experimental features
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
```

### Environment Variables for Performance

Add these optional variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_TELEMETRY_DISABLED` | `1` | Disable Next.js telemetry |
| `NODE_OPTIONS` | `--max-old-space-size=4096` | Increase memory limit |

## Step 10: Monitoring and Maintenance

1. **View Logs**:
   - Railway dashboard → Your service → "Logs" tab
   - Or use CLI: `railway logs`

2. **Monitor Performance**:
   - Check "Metrics" tab for response times
   - Monitor memory and CPU usage
   - Set up alerts for downtime

3. **Update Dependencies**:
   ```bash
   # Update Next.js and dependencies
   npm update
   git add package*.json
   git commit -m "Update dependencies"
   git push origin main
   ```

## Troubleshooting

### Common Issues:

1. **Build Fails - TypeScript Errors**:
   ```bash
   # Fix TypeScript errors locally
   npm run build
   # Fix all errors before deploying
   ```

2. **API Connection Issues**:
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check CORS settings in backend
   - Ensure backend is deployed and running

3. **Static Assets Not Loading**:
   - Check `public/` folder structure
   - Verify image paths are correct
   - Use Next.js `Image` component for optimization

4. **Memory Issues During Build**:
   - Add `NODE_OPTIONS=--max-old-space-size=4096` environment variable
   - Optimize large components and imports

### Debug Commands:
```bash
# Test build locally
npm run build
npm start

# Check environment variables
railway run env

# View build logs
railway logs --tail

# Restart service
railway up --detach
```

## Security Best Practices

- [ ] Environment variables properly configured
- [ ] No sensitive data in client-side code
- [ ] API endpoints use HTTPS
- [ ] Authentication tokens handled securely
- [ ] CORS configured correctly in backend
- [ ] Content Security Policy configured (optional)

## Performance Checklist

- [ ] Next.js Image optimization enabled
- [ ] Static assets compressed
- [ ] Bundle size optimized
- [ ] TypeScript errors resolved
- [ ] Build warnings addressed
- [ ] Lighthouse score > 90 (optional)

## Next Steps

1. Set up staging environment
2. Configure monitoring and analytics
3. Implement error tracking (Sentry, etc.)
4. Set up automated testing pipeline
5. Configure CDN for static assets (optional)
6. Add progressive web app features (optional)

Your MediFind web dashboard is now deployed and ready for production use! 🚀

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Railway Next.js Guide](https://docs.railway.app/guides/nextjs)
- [Next.js Performance Best Practices](https://nextjs.org/docs/basic-features/built-in-css-support)
