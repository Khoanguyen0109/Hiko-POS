# Railway MongoDB Connection: Public Proxy vs Internal URL

## Overview

When using MongoDB on Railway, you have two connection options:
1. **Public Proxy URL** (External) - `shuttle.proxy.rlwy.net:19468`
2. **Internal URL** (Recommended) - `mongodb.railway.internal:27017`

## Current Issue

The backend service (`divine-nature`) is currently using the **public proxy URL** instead of the **internal URL**. This can cause performance, security, and reliability issues.

### Current Configuration

**Backend Service Variables:**
```
MONGODB_URI=mongodb://mongo:wxKTlZiKTbiQDNqczQyFvZkUSiiSeueu@shuttle.proxy.rlwy.net:19468
```

**MongoDB Service Variables:**
```
MONGO_URL=mongodb://mongo:wxKTlZiKTbiQDNqczQyFvZkUSiiSeueu@mongodb.railway.internal:27017
MONGO_PUBLIC_URL=mongodb://mongo:wxKTlZiKTbiQDNqczQyFvZkUSiiSeueu@shuttle.proxy.rlwy.net:19468
```

## Differences Explained

### Public Proxy URL (`shuttle.proxy.rlwy.net:19468`)

**What it is:**
- A public-facing TCP proxy that allows external access to MongoDB
- Routes traffic through Railway's public infrastructure
- Accessible from outside the Railway network

**Characteristics:**
- ✅ Accessible from external services/tools
- ❌ Higher latency (extra network hop)
- ❌ Less secure (exposed to public internet)
- ❌ Potential rate limiting
- ❌ More expensive (uses external bandwidth)
- ❌ Less reliable (depends on proxy service)

**Use Cases:**
- Connecting from local development machines
- External database management tools (MongoDB Compass, Studio 3T)
- One-time migrations or scripts run outside Railway
- Testing connections from external services

### Internal URL (`mongodb.railway.internal:27017`)

**What it is:**
- Private internal network address within Railway's infrastructure
- Direct connection between services in the same project
- Not accessible from outside Railway network

**Characteristics:**
- ✅ Lower latency (direct internal connection)
- ✅ More secure (private network, not exposed)
- ✅ No rate limiting concerns
- ✅ More reliable (direct connection)
- ✅ Free (internal traffic)
- ✅ Better performance (no proxy overhead)

**Use Cases:**
- **Primary use case:** Service-to-service communication within Railway
- Backend services connecting to MongoDB
- Microservices communicating with database
- Production applications

## Why This Matters

### 1. Performance Impact

**Public Proxy:**
```
Backend → Public Internet → Railway Proxy → MongoDB
Latency: ~50-200ms (depending on location)
```

**Internal URL:**
```
Backend → Internal Network → MongoDB
Latency: ~1-5ms
```

**Impact:** Database queries can be 10-40x slower with public proxy.

### 2. Security Concerns

**Public Proxy:**
- Connection string exposed to public internet
- Potential for connection interception
- Subject to DDoS attacks
- Requires stronger firewall rules

**Internal URL:**
- Traffic stays within Railway's private network
- No exposure to public internet
- Better security posture

### 3. Reliability

**Public Proxy:**
- Depends on proxy service availability
- Additional point of failure
- Potential for proxy overload

**Internal URL:**
- Direct connection
- Fewer points of failure
- More stable connection

### 4. Cost

**Public Proxy:**
- Uses external bandwidth (may incur costs)
- Proxy service overhead

**Internal URL:**
- Internal traffic is typically free
- No proxy overhead

## How to Fix

### Step 1: Update Railway Environment Variable

1. Go to Railway Dashboard
2. Select your project: **Hiko-pos**
3. Click on **divine-nature** service
4. Go to **Variables** tab
5. Find `MONGODB_URI` variable
6. Update it to use the internal URL:

**Change from:**
```
mongodb://mongo:wxKTlZiKTbiQDNqczQyFvZkUSiiSeueu@shuttle.proxy.rlwy.net:19468
```

**Change to:**
```
mongodb://mongo:wxKTlZiKTbiQDNqczQyFvZkUSiiSeueu@mongodb.railway.internal:27017
```

7. Save the changes
8. Railway will automatically redeploy the service

### Step 2: Verify Connection

After deployment, check the logs to verify the connection:

```bash
railway logs --service divine-nature
```

You should see:
```
✅ MongoDB Connected: mongodb.railway.internal
```

### Step 3: Test Application

1. Test API endpoints to ensure database operations work
2. Monitor response times (should be faster)
3. Check for any connection errors

## Best Practices

### 1. Use Internal URL for Production

**Always use internal URL for:**
- Production services
- Service-to-service communication
- High-frequency database operations
- Real-time applications

### 2. Use Public URL Only When Necessary

**Only use public URL for:**
- Local development (if connecting from your machine)
- External database management tools
- One-time migrations from external scripts
- Testing from outside Railway

### 3. Environment-Based Configuration

Consider using different URLs based on environment:

```javascript
// config/config.js
const getMongoURI = () => {
  // In Railway production, use internal URL
  if (process.env.RAILWAY_ENVIRONMENT === 'production') {
    return process.env.MONGO_URL || process.env.MONGODB_URI;
  }
  
  // For local development or external access
  return process.env.MONGODB_URI || process.env.MONGO_PUBLIC_URL;
};

const config = {
  databaseURI: getMongoURI(),
  // ... other config
};
```

### 4. Connection Pooling

When using internal URL, you can optimize with connection pooling:

```javascript
// config/database.js
const mongoose = require("mongoose");
const config = require("./config");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.databaseURI, {
            maxPoolSize: 10, // Maximum number of connections in pool
            minPoolSize: 2,  // Minimum number of connections
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
```

### 5. Monitoring

Monitor your database connections:

```javascript
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});
```

## Railway Environment Variables Reference

### MongoDB Service Variables

Railway automatically provides these variables to other services:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | Internal connection URL | `mongodb://mongo:pass@mongodb.railway.internal:27017` |
| `MONGO_PUBLIC_URL` | Public proxy URL | `mongodb://mongo:pass@shuttle.proxy.rlwy.net:19468` |
| `MONGOHOST` | Internal hostname | `mongodb.railway.internal` |
| `MONGOPORT` | Internal port | `27017` |
| `MONGOUSER` | Database username | `mongo` |
| `MONGOPASSWORD` | Database password | `[password]` |

### Accessing Variables

**From MongoDB Service:**
- All variables are available in the MongoDB service itself
- Use `MONGO_URL` for internal connections
- Use `MONGO_PUBLIC_URL` for external access

**From Other Services (like divine-nature):**
- Railway automatically shares MongoDB connection variables
- You can reference them in your service's environment variables
- Use `MONGO_URL` for internal connections

## Migration Checklist

- [ ] Identify all services using MongoDB
- [ ] Update `MONGODB_URI` to use `MONGO_URL` (internal)
- [ ] Update connection configuration if needed
- [ ] Test database operations
- [ ] Monitor performance improvements
- [ ] Update documentation
- [ ] Remove public URL usage from production code

## Troubleshooting

### Connection Refused

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
- Verify MongoDB service is running
- Check that you're using the correct internal URL
- Ensure services are in the same Railway project

### Timeout Issues

**Error:** `MongooseServerSelectionError: Server selection timed out`

**Solution:**
- Check MongoDB service logs
- Verify network connectivity between services
- Increase `serverSelectionTimeoutMS` if needed

### Authentication Failed

**Error:** `MongooseError: Authentication failed`

**Solution:**
- Verify username and password in environment variables
- Check MongoDB service credentials
- Ensure credentials match between services

## Additional Resources

- [Railway MongoDB Documentation](https://docs.railway.app/databases/mongodb)
- [Mongoose Connection Options](https://mongoosejs.com/docs/connections.html)
- [Railway Networking Guide](https://docs.railway.app/networking)

## Summary

**Key Takeaway:** Always use the **internal URL** (`mongodb.railway.internal:27017`) for service-to-service communication within Railway. Only use the public proxy URL when you need external access (local development, external tools).

**Current Status:** The backend service needs to be updated to use the internal URL for optimal performance and security.
