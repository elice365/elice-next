# Deployment & Maintenance Guide - Elice Next

Complete guide for deploying and maintaining the elice-next application in production environments.

## 📋 Table of Contents
- [Quick Deployment](#quick-deployment)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Observability](#monitoring--observability)
- [Maintenance Procedures](#maintenance-procedures)
- [Security Hardening](#security-hardening)
- [Scaling Considerations](#scaling-considerations)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Deployment

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database configured
- [ ] Environment variables prepared
- [ ] Domain and SSL certificates ready
- [ ] CDN configured (optional)

### 5-Minute Vercel Deployment
```bash
# 1. Install Vercel CLI
pnpm i -g vercel

# 2. Deploy from project root
vercel --prod

# 3. Configure environment variables in Vercel dashboard
# 4. Connect domain in Vercel settings
```

**✅ Production ready in minutes with Vercel's zero-config deployment**

---

## 🔧 Environment Setup

### Production Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-super-secure-secret-here"
NEXTAUTH_URL="https://yourdomain.com"
JWT_SECRET="another-secure-secret"

# Social Login Providers
KAKAO_CLIENT_ID="your-kakao-client-id"
KAKAO_CLIENT_SECRET="your-kakao-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_TEAM_ID="your-apple-team-id"
APPLE_KEY_ID="your-apple-key-id"
APPLE_PRIVATE_KEY="your-apple-private-key"

# Email Service (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# External Services
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"

# Security & Performance
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"
CORS_ORIGIN="https://yourdomain.com"

# Analytics (Optional)
GOOGLE_ANALYTICS_ID="GA_MEASUREMENT_ID"
MIXPANEL_TOKEN="your-mixpanel-token"
```

### Environment Security
```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET

# Verify environment variables
node -e "console.log(process.env.DATABASE_URL ? '✅ Database configured' : '❌ Database missing')"
```

---

## 🌐 Deployment Options

### 1. Vercel (Recommended)
**Best for**: Serverless, auto-scaling, zero configuration

```bash
# Deploy with Vercel
vercel --prod

# Custom domain
vercel domains add yourdomain.com
vercel alias your-deployment-url.vercel.app yourdomain.com
```

**Advantages**:
- Zero configuration
- Automatic HTTPS
- Global edge network
- Serverless functions
- Built-in analytics

### 2. AWS (Enterprise)
**Best for**: Full control, enterprise requirements, complex infrastructure

```yaml
# docker-compose.yml for AWS ECS
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: elice_next
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 3. Docker Deployment
**Best for**: Containerized environments, Kubernetes, self-hosting

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN pnpm install -g pnpm
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

```bash
# Build and run Docker container
docker build -t elice-next .
docker run -p 3000:3000 elice-next
```

### 4. Traditional VPS/Dedicated Server
**Best for**: Custom server configurations, cost optimization

```bash
# Server setup (Ubuntu 22.04)
# Install Node.js, PM2, Nginx, PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx postgresql

# Install PM2 for process management
pnpm install -g pm2

# Clone and setup application
git clone <your-repo>
cd elice-next
pnpm install
pnpm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm ci
      
      - name: Run type check
        run: pnpm run type-check
      
      - name: Run linter
        run: pnpm run lint
      
      - name: Setup test database
        run: |
          npx prisma generate
          npx prisma db push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Pre-deployment Checklist
```bash
# Automated deployment checks
#!/bin/bash

echo "🔍 Running pre-deployment checks..."

# 1. Type checking
pnpm run type-check || exit 1

# 2. Linting
pnpm run lint || exit 1

# 3. Build test
pnpm run build || exit 1

# 4. Database migration check
npx prisma validate || exit 1

# 5. Security audit
pnpm audit --audit-level high || exit 1

echo "✅ All checks passed - ready for deployment"
```

---

## 📊 Monitoring & Observability

### Application Performance Monitoring
```typescript
// lib/monitoring/analytics.ts
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Performance monitoring setup
export const initializeMonitoring = () => {
  // Error tracking
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      // Send to error tracking service
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Send to error tracking service
    });
  }
};

// Custom metrics
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties);
  }
};
```

### Health Check Endpoints
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        latency: `${dbLatency}ms`
      },
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
```

### Logging Strategy
```typescript
// lib/monitoring/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  warn: (message: string, meta?: object) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  error: (message: string, error?: Error, meta?: object) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
  }
};
```

### Monitoring Dashboard Setup
```bash
# Grafana + Prometheus for self-hosted monitoring
docker-compose -f monitoring/docker-compose.yml up -d

# Key metrics to monitor:
# - Response times (95th percentile < 500ms)
# - Error rates (< 0.1%)
# - Database connections (< 80% of pool)
# - Memory usage (< 80% of available)
# - CPU usage (< 70% average)
```

---

## 🔧 Maintenance Procedures

### Database Maintenance
```bash
# 1. Regular backups (daily)
#!/bin/bash
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/

# 2. Database optimization (weekly)
psql $DATABASE_URL -c "VACUUM ANALYZE;"
psql $DATABASE_URL -c "REINDEX DATABASE your_database;"

# 3. Clean up old sessions (daily)
psql $DATABASE_URL -c "DELETE FROM Session WHERE expiresTime < NOW() - INTERVAL '7 days';"

# 4. Archive old notifications (monthly)
psql $DATABASE_URL -c "DELETE FROM Notification WHERE createdTime < NOW() - INTERVAL '90 days';"
```

### Application Updates
```bash
# Zero-downtime deployment strategy
#!/bin/bash

echo "🚀 Starting deployment..."

# 1. Run database migrations
npx prisma migrate deploy

# 2. Build new version
pnpm run build

# 3. Health check before switching
curl -f http://localhost:3000/api/health || exit 1

# 4. Switch traffic (using PM2)
pm2 reload ecosystem.config.js --env production

# 5. Verify deployment
sleep 10
curl -f http://localhost:3000/api/health || pm2 rollback

echo "✅ Deployment completed successfully"
```

### Performance Optimization
```bash
# Image optimization
npx @next/bundle-analyzer

# Database query optimization
npx prisma studio
# Review slow queries in logs

# CDN cache warming
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

## 🔒 Security Hardening

### Production Security Checklist
- [ ] **HTTPS Enforced**: SSL certificates configured and HTTP redirects to HTTPS
- [ ] **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- [ ] **Rate Limiting**: API endpoints protected against abuse
- [ ] **Input Validation**: All user inputs validated and sanitized
- [ ] **Authentication**: Secure JWT implementation with refresh token rotation
- [ ] **Database Security**: Connection pooling, parameterized queries
- [ ] **Environment Variables**: All secrets stored securely, not in code
- [ ] **CORS Configuration**: Proper CORS settings for API endpoints
- [ ] **File Uploads**: Secure file handling with size and type restrictions
- [ ] **Logging**: No sensitive data logged, proper log retention

### Security Headers Configuration
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com; style-src 'self' 'unsafe-inline';"
  }
];
```

---

## 📈 Scaling Considerations

### Horizontal Scaling Strategy
```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elice-next
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elice-next
  template:
    metadata:
      labels:
        app: elice-next
    spec:
      containers:
      - name: elice-next
        image: elice-next:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Database Scaling
```sql
-- Read replicas for query optimization
-- Master-slave configuration
-- Connection pooling with PgBouncer

-- Indexing strategy
CREATE INDEX CONCURRENTLY idx_posts_published_at ON Post(publishedAt) WHERE status = 'published';
CREATE INDEX CONCURRENTLY idx_posts_category ON Post(categoryId);
CREATE INDEX CONCURRENTLY idx_session_user ON Session(userId, active);
CREATE INDEX CONCURRENTLY idx_notification_user ON Notification(userId, read);
```

### CDN and Caching Strategy
```javascript
// Cache configuration
const cacheConfig = {
  // Static assets: 1 year
  '**/*.{js,css,png,jpg,jpeg,gif,ico,svg}': {
    'Cache-Control': 'public, max-age=31536000, immutable'
  },
  
  // API responses: 5 minutes
  '/api/**': {
    'Cache-Control': 'public, max-age=300, s-maxage=300'
  },
  
  // HTML pages: 1 hour
  '**/*.html': {
    'Cache-Control': 'public, max-age=3600'
  }
};
```

---

## 🐛 Troubleshooting

### Common Production Issues

#### 1. Database Connection Pool Exhaustion
**Symptoms**: "Too many connections" errors
```bash
# Solutions
# 1. Increase connection pool size
DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=20"

# 2. Add connection pooling
# Use PgBouncer or AWS RDS Proxy

# 3. Monitor connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

#### 2. Memory Leaks
**Symptoms**: Increasing memory usage over time
```bash
# Diagnosis
node --inspect=0.0.0.0:9229 server.js
# Use Chrome DevTools Memory tab

# Monitoring
pm2 monit  # Monitor memory usage
```

#### 3. High CPU Usage
**Symptoms**: Slow response times, high server load
```bash
# Diagnosis
npx clinic doctor -- node server.js
npx clinic flame -- node server.js

# Common causes:
# - Inefficient database queries
# - Large file processing
# - Memory leaks causing GC pressure
```

#### 4. SSL Certificate Issues
**Symptoms**: HTTPS warnings, connection errors
```bash
# Check certificate expiration
openssl x509 -in certificate.crt -text -noout | grep "Not After"

# Auto-renewal with Let's Encrypt
certbot renew --nginx
```

#### 5. API Rate Limiting Triggered
**Symptoms**: 429 Too Many Requests errors
```bash
# Check rate limit status
redis-cli GET "rate_limit:user_id:requests"

# Adjust limits if needed
# Update RATE_LIMIT_MAX environment variable
```

### Performance Debugging Tools
```bash
# Bundle analysis
npx @next/bundle-analyzer

# Lighthouse CI for performance monitoring
npx lhci autorun

# Database query analysis
npx prisma studio
# Check slow query logs

# Real User Monitoring
# Use Vercel Analytics or Google Analytics 4
```

### Log Analysis
```bash
# Filter error logs
tail -f /var/log/app.log | grep ERROR

# Monitor API response times
tail -f /var/log/nginx/access.log | awk '{print $10, $11}'

# Database slow query analysis
tail -f /var/log/postgresql/postgresql.log | grep "slow query"
```

---

## 📈 Success Metrics

### Key Performance Indicators
- **Uptime**: 99.9% (< 8.7 hours downtime/year)
- **Response Time**: 95th percentile < 500ms
- **Error Rate**: < 0.1% of requests
- **Page Load Speed**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Database Performance**: Query time < 100ms average

### Monitoring Alerts
```yaml
# Alerting rules (Prometheus/Grafana)
alerts:
  - name: high_error_rate
    condition: error_rate > 1%
    duration: 5m
    
  - name: slow_response_time
    condition: response_time_95th > 1000ms
    duration: 10m
    
  - name: database_connections
    condition: db_connections > 80%
    duration: 5m
    
  - name: memory_usage
    condition: memory_usage > 85%
    duration: 10m
```

---

## 🔄 Backup and Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# backup.sh - Run daily via cron

# Database backup
pg_dump $DATABASE_URL | gzip > "db_backup_$(date +%Y%m%d).sql.gz"

# Upload to S3
aws s3 cp "db_backup_$(date +%Y%m%d).sql.gz" s3://your-backup-bucket/database/

# Clean up old backups (keep 30 days)
find /backup -name "db_backup_*.sql.gz" -mtime +30 -delete

# File system backup (if not using cloud storage)
tar -czf "files_backup_$(date +%Y%m%d).tar.gz" /app/uploads
aws s3 cp "files_backup_$(date +%Y%m%d).tar.gz" s3://your-backup-bucket/files/
```

### Disaster Recovery Plan
1. **Database Recovery**: Restore from latest backup (RTO: 30 minutes)
2. **Application Recovery**: Deploy from git repository (RTO: 15 minutes)
3. **DNS Failover**: Switch to backup infrastructure (RTO: 5 minutes)
4. **User Communication**: Status page updates and notifications

---

This guide provides comprehensive deployment and maintenance procedures for the elice-next application. Regular updates to this documentation ensure smooth operations and minimal downtime in production environments.

**Remember**: Always test deployment procedures in staging environments before applying to production! 🚀