# Development Environment MongoDB Setup

## Overview

**Important:** Development environments running **locally** (on your machine) **cannot** connect to Railway's internal MongoDB URL (`mongodb.railway.internal:27017`) because it's only accessible within Railway's private network.

## Connection Options for Development

You have three options for connecting to MongoDB in your local development environment:

### Option 1: Use Railway Public Proxy URL (Recommended for Testing Production DB)

If you want to connect to your Railway MongoDB from local development:

1. Get the public proxy URL from Railway MongoDB service variables:
   ```
   MONGO_PUBLIC_URL=mongodb://mongo:password@shuttle.proxy.rlwy.net:19468
   ```

2. Set it in your local `.env` file:
   ```bash
   MONGODB_URI=mongodb://mongo:wxKTlZiKTbiQDNqczQyFvZkUSiiSeueu@shuttle.proxy.rlwy.net:19468
   ```

**Pros:**
- ✅ Connect to production database for testing
- ✅ No local MongoDB setup needed
- ✅ Easy to switch between local and production data

**Cons:**
- ⚠️ Higher latency (~50-200ms)
- ⚠️ Uses external bandwidth
- ⚠️ Less secure (public endpoint)

### Option 2: Use Local MongoDB Instance (Recommended for Development)

Run MongoDB locally on your machine:

1. Install MongoDB locally:
   ```bash
   # macOS
   brew install mongodb-community
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. Use default local connection in `.env`:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/pos-db
   ```
   Or simply don't set `MONGODB_URI` - it defaults to local MongoDB.

**Pros:**
- ✅ Fastest connection (~1ms)
- ✅ No external dependencies
- ✅ Safe to test without affecting production
- ✅ Works offline

**Cons:**
- ⚠️ Need to set up MongoDB locally
- ⚠️ Data is separate from production

### Option 3: Use MongoDB Atlas (Cloud Development Database)

Use MongoDB Atlas for a cloud-hosted development database:

1. Create a free MongoDB Atlas cluster
2. Get connection string
3. Set in `.env`:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pos-db-dev
   ```

**Pros:**
- ✅ Cloud-hosted (no local setup)
- ✅ Accessible from anywhere
- ✅ Separate from production

**Cons:**
- ⚠️ Requires Atlas account
- ⚠️ Free tier has limitations

## How the Configuration Works

The updated `config/config.js` automatically selects the right connection:

```javascript
// In Railway production: Uses MONGO_URL (internal) → mongodb.railway.internal:27017
// In local development: Uses MONGODB_URI → Your choice (public proxy, local, or Atlas)
```

### Priority Order:

1. **Railway Production:**
   - First tries `MONGO_URL` (internal Railway URL)
   - Falls back to `MONGODB_URI` if `MONGO_URL` not available
   - Defaults to local MongoDB

2. **Local Development:**
   - Uses `MONGODB_URI` from `.env` file
   - Defaults to `mongodb://localhost:27017/pos-db` if not set

## Setup Instructions

### For Local Development with Railway MongoDB (Public Proxy)

1. Create/update `.env` file in `pos-backend/`:
   ```bash
   # Development environment
   NODE_ENV=development
   PORT=3000
   
   # Use Railway public proxy URL to connect to production MongoDB
   MONGODB_URI=mongodb://mongo:wxKTlZiKTbiQDNqczQyFvZkUSiiSeueu@shuttle.proxy.rlwy.net:19468
   
   # JWT Secret (use a different one for development)
   JWT_SECRET=dev-secret-key-change-in-production
   ```

2. Start the development server:
   ```bash
   cd pos-backend
   npm run dev
   ```

3. Verify connection:
   ```
   ✅ MongoDB Connected: shuttle.proxy.rlwy.net
   ☑️  POS Server is listening on port 3000
   ```

### For Local Development with Local MongoDB

1. Install MongoDB locally (or use Docker)

2. Create/update `.env` file:
   ```bash
   NODE_ENV=development
   PORT=3000
   # MONGODB_URI not set - will use default localhost:27017
   JWT_SECRET=dev-secret-key
   ```

3. Start MongoDB:
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or with Docker
   docker start mongodb
   ```

4. Start the development server:
   ```bash
   cd pos-backend
   npm run dev
   ```

5. Verify connection:
   ```
   ✅ MongoDB Connected: localhost
   ☑️  POS Server is listening on port 3000
   ```

## Environment Variable Reference

| Variable | Railway Production | Local Development | Description |
|----------|-------------------|-------------------|-------------|
| `MONGO_URL` | ✅ Available | ❌ Not available | Railway internal URL (mongodb.railway.internal) |
| `MONGODB_URI` | ✅ Available | ✅ Set in `.env` | Public proxy URL or custom connection |
| `RAILWAY_ENVIRONMENT` | `production` | Not set | Railway environment identifier |

## Connection URLs Comparison

### Internal URL (Railway Production Only)
```
mongodb://mongo:password@mongodb.railway.internal:27017
```
- ✅ Fastest (~1-5ms latency)
- ✅ Most secure (private network)
- ❌ Only works within Railway network

### Public Proxy URL (Development → Production)
```
mongodb://mongo:password@shuttle.proxy.rlwy.net:19468
```
- ✅ Works from anywhere
- ✅ Connects to production database
- ⚠️ Slower (~50-200ms latency)
- ⚠️ Less secure (public endpoint)

### Local MongoDB (Development)
```
mongodb://localhost:27017/pos-db
```
- ✅ Fastest (~1ms latency)
- ✅ Safe for testing
- ✅ Works offline
- ⚠️ Separate data from production

## Troubleshooting

### Connection Refused Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions:**
- If using local MongoDB: Ensure MongoDB is running (`brew services list` or `docker ps`)
- If using Railway public proxy: Verify the URL is correct
- Check firewall settings

### Authentication Failed

**Error:** `MongooseError: Authentication failed`

**Solutions:**
- Verify username and password in connection string
- Check MongoDB service credentials in Railway dashboard
- Ensure credentials match between services

### Timeout Issues

**Error:** `MongooseServerSelectionError: Server selection timed out`

**Solutions:**
- Check internet connection (if using public proxy)
- Verify MongoDB service is running in Railway
- Increase timeout in connection options if needed

## Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use different JWT secrets** for development and production
3. **Use local MongoDB** for most development work
4. **Use public proxy URL** only when you need to test with production data
5. **Use MongoDB Atlas** for team-shared development database

## Summary

- ❌ **Local development CANNOT use internal Railway URL** (`mongodb.railway.internal`)
- ✅ **Local development CAN use public proxy URL** (`shuttle.proxy.rlwy.net:19468`)
- ✅ **Local development SHOULD use local MongoDB** for best performance
- ✅ **Configuration automatically selects the right URL** based on environment

The updated `config/config.js` handles this automatically - you just need to set the appropriate `MONGODB_URI` in your `.env` file for your development needs.
