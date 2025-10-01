# Railway Deployment Guide for POS Backend

This guide will help you deploy the Restaurant POS System backend to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. A MongoDB database (MongoDB Atlas recommended for production)
3. Payment processing system (if needed)
4. Your backend code ready for deployment

## Step 1: Prepare Your Repository

### 1.1 Environment Variables
Copy the `.env.example` file to `.env` and fill in your actual values:

```bash
cp .env.example .env
```

Required environment variables:
- `PORT`: Railway will set this automatically
- `NODE_ENV`: Set to `production`
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A strong secret key for JWT tokens
- `FRONTEND_URL`: Your frontend domain URL

### 1.2 Update CORS Configuration
In `app.js`, update the CORS origins to include your frontend domain:

```javascript
const allowedOrigins = [
    'http://localhost:5173', // Development frontend
    process.env.FRONTEND_URL, // Production frontend
    'https://your-actual-frontend-domain.railway.app' // Update this
].filter(Boolean);
```

## Step 2: Deploy to Railway

### 2.1 Connect Repository
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `pos-backend` folder as the root directory

### 2.2 Configure Environment Variables
In the Railway dashboard:
1. Go to your project
2. Click on the service
3. Go to "Variables" tab
4. Add all the environment variables from your `.env` file

**Important Railway Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pos-db
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-frontend-domain.com
```

### 2.3 Deploy
1. Railway will automatically detect the Node.js project
2. It will run `npm install` and then `npm start`
3. Your backend will be available at the provided Railway URL

## Step 3: Database Setup

### 3.1 MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist Railway's IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and use it as `MONGODB_URI`

### 3.2 Railway MongoDB (Alternative)
1. In Railway dashboard, add a MongoDB service
2. Railway will provide the connection string automatically
3. Use this as your `MONGODB_URI`

## Step 4: Domain Configuration

### 4.1 Custom Domain (Optional)
1. In Railway dashboard, go to your service
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 4.2 Update Frontend Configuration
Update your frontend to use the Railway backend URL:
- Development: `http://localhost:3000/api`
- Production: `https://your-backend-domain.railway.app/api`

## Step 5: Monitoring and Logs

### 5.1 View Logs
1. In Railway dashboard, go to your service
2. Click "Deployments" tab
3. Click on a deployment to view logs

### 5.2 Health Check
The backend includes a health check endpoint at `/` that returns:
```json
{
  "message": "Hello from POS Server!"
}
```

## Step 6: Security Considerations

### 6.1 Environment Variables
- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate secrets regularly

### 6.2 CORS Configuration
- Only allow necessary origins
- Update CORS settings when deploying frontend

### 6.3 Database Security
- Use strong database passwords
- Enable MongoDB authentication
- Restrict database access by IP when possible

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility

2. **Database Connection Issues**
   - Verify MongoDB URI format
   - Check network access and firewall settings
   - Ensure database user has proper permissions

3. **CORS Errors**
   - Update allowed origins in `app.js`
   - Check frontend URL configuration

4. **Environment Variable Issues**
   - Verify all required variables are set in Railway
   - Check variable names match exactly

### Getting Help
- Check Railway logs for detailed error messages
- Verify all environment variables are set correctly
- Test database connection locally first

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connection working
- [ ] CORS origins updated
- [ ] JWT secret is strong and unique
- [ ] Payment system configured (if needed)
- [ ] Frontend URL updated
- [ ] Health check endpoint responding
- [ ] Logs are accessible
- [ ] Custom domain configured (if needed)

## API Endpoints

Your deployed backend will have these endpoints:
- `GET /` - Health check
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/order` - Get orders
- `POST /api/order` - Create order
- `GET /api/table` - Get tables
- `POST /api/payment` - Process payment
- And more...

## Support

For issues specific to Railway deployment, check:
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord Community](https://discord.gg/railway)
