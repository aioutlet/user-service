# 🌍 Environment Configuration Guide

The User Service supports multiple environments through template files and manual copying.

## 📁 **Environment Files Structure**

```
user-service/
├── .env                    # Active configuration (gitignored)
├── .env.development       # Development template (committed)
└── .env.production        # Production template (committed)
```

## 🔄 **Environment Switching**

### **Development Environment (Default)**

```bash
# Copy development settings to active .env
cp .env.development .env

# Start development services
docker-compose up -d
```

**Development Features:**

- ✅ Docker service names (`mongo-user-service`)
- ✅ Verbose logging (`LOG_LEVEL=debug`)
- ✅ Permissive CORS and rate limiting
- ✅ Hot reload enabled
- ✅ Debug mode enabled

### **Production Environment**

```bash
# Copy production settings to active .env
cp .env.production .env

# Update production-specific values
nano .env  # Edit MongoDB host, JWT secret, etc.

# Deploy to production
docker-compose -f docker-compose.yml up -d
```

**Production Features:**

- 🔒 External MongoDB host
- 🔒 Secure JWT secrets
- 🔒 Error-level logging only
- 🔒 Strict CORS and rate limiting
- 🔒 Security headers enabled

## ☁️ **Azure App Service Deployment**

For Azure deployment, set these as **Application Settings** instead of using `.env` files:

### **Required Azure App Settings:**

```
NODE_ENV=production
PORT=3002
MONGODB_URI=mongodb://...
JWT_SECRET=your-secure-secret
AUTH_SERVICE_URL=https://auth-service.aioutlet.com
CORS_ORIGIN=https://app.aioutlet.com
LOG_LEVEL=error
```

### **Azure Best Practices:**

- ✅ Use **Azure Key Vault** for secrets (JWT_SECRET, MONGODB_PASSWORD)
- ✅ Use **Azure Cosmos DB** for MongoDB
- ✅ Set **Application Insights** for OTEL_EXPORTER_OTLP_ENDPOINT
- ✅ Use **Managed Identity** for service-to-service authentication

## 🛠 **Environment Validation**

```bash
# Validate current environment
npm run validate-config

# Check active configuration
node -e "console.log(require('./src/config/index.js').config)"
```

## 📝 **Template Updates**

When adding new configuration variables:

1. ✅ Add to both `.env.development` and `.env.production`
2. ✅ Add to `src/config/index.js` with defaults
3. ✅ Update this documentation
4. ✅ Update Azure App Service settings (for production)

## 🔍 **Environment Detection**

The service automatically detects the environment from `NODE_ENV`:

```javascript
// In src/config/index.js
const config = {
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  // ... other settings
};
```

This approach ensures maximum flexibility for local development and seamless Azure deployment! 🚀
