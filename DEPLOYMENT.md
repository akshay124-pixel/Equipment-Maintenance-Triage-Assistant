# 🚀 Deployment Guide

This guide covers deploying the Equipment Maintenance Triage Assistant to production.

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Production database (PostgreSQL 16+ with pgvector)
- [ ] AI API key (Gemini or OpenAI)
- [ ] Domain name (if applicable)
- [ ] SSL certificate (automatic with most platforms)

### Security Review
- [ ] Strong JWT_SECRET (32+ random characters)
- [ ] Production DATABASE_URL configured
- [ ] All secrets in environment variables
- [ ] .env file NOT committed to git
- [ ] CORS configured for your domain
- [ ] Rate limiting enabled (recommended)

## 🎯 Recommended: Vercel + Neon

### Why This Stack?
- **Vercel**: Native Next.js platform, zero config deployment
- **Neon**: Serverless PostgreSQL with pgvector, generous free tier
- **Gemini**: Free AI API for testing, easy to scale

### Total Cost: $0 for small projects! 🎉

---

## 1️⃣ Database Setup (Neon)

### Create Neon Database

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up/login with GitHub
3. Click "Create Project"
4. Select region closest to your users
5. Copy the connection string

### Configure Database

```bash
# Your connection string will look like:
postgresql://user:password@host.neon.tech/database?sslmode=require
```

### Initialize Schema

```bash
# Set DATABASE_URL in your local .env
DATABASE_URL="postgresql://..."

# Push schema
npx prisma db push

# Seed data (optional for production)
npm run seed
```

---

## 2️⃣ AI Provider Setup

### Option A: Google Gemini (Recommended - FREE!)

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Set in environment:
   ```
   AI_PROVIDER="gemini"
   GEMINI_API_KEY="your_key_here"
   ```

### Option B: OpenAI (Paid)

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create API key
3. Add payment method
4. Set in environment:
   ```
   AI_PROVIDER="openai"
   OPENAI_API_KEY="your_key_here"
   ```

### Option C: Ollama (Self-hosted)

1. Install Ollama on your server
2. Pull model: `ollama pull llama2`
3. Set in environment:
   ```
   AI_PROVIDER="ollama"
   OLLAMA_BASE_URL="http://your-server:11434"
   ```

---

## 3️⃣ Vercel Deployment

### Initial Setup

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow prompts**:
   - Link to existing project? No
   - Project name: equipment-maintenance-triage
   - Directory: ./ (current)
   - Override settings? No

### Environment Variables

Set these in Vercel dashboard or CLI:

```bash
# Database
vercel env add DATABASE_URL production
# Paste your Neon connection string

# AI Provider
vercel env add AI_PROVIDER production
# Enter: gemini

vercel env add GEMINI_API_KEY production
# Paste your Gemini API key

# Authentication
vercel env add JWT_SECRET production
# Enter a strong random string (min 32 chars)

vercel env add JWT_EXPIRES_IN production
# Enter: 7d

# Application
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-domain.vercel.app

vercel env add NODE_ENV production
# Enter: production
```

### Deploy to Production

```bash
vercel --prod
```

Your app will be live at: `https://your-project.vercel.app`

---

## 🐳 Alternative: Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AI_PROVIDER=${AI_PROVIDER}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: ankane/pgvector:latest
    environment:
      - POSTGRES_DB=maintenance
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Deploy

```bash
docker-compose up -d
```

---

## ☁️ Alternative: AWS Deployment

### Option 1: AWS Amplify

1. Go to AWS Amplify Console
2. Connect your GitHub repository
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - npx prisma generate
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
4. Add environment variables in Amplify Console
5. Deploy!

### Option 2: AWS ECS (Fargate)

1. Build Docker image
2. Push to ECR
3. Create ECS task definition
4. Deploy to Fargate
5. Configure ALB for load balancing

---

## 🔧 Post-Deployment

### Verify Deployment

1. **Health Check**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Test Login**
   - Navigate to `/login`
   - Try demo credentials

3. **Test AI Features**
   - Create a maintenance report
   - Run triage analysis
   - Check work order creation

### Monitor Application

1. **Vercel Dashboard**
   - Check function logs
   - Monitor performance
   - View analytics

2. **Database Monitoring**
   - Neon dashboard for query performance
   - Check connection pool usage
   - Monitor storage

3. **Error Tracking**
   - Add Sentry (optional):
     ```bash
     npm install @sentry/nextjs
     ```

### Performance Optimization

1. **Enable Caching**
   - Static pages cached automatically
   - API routes can use cache headers

2. **Database Optimization**
   - Monitor slow queries
   - Add indexes if needed
   - Connection pooling (built-in with Neon)

3. **CDN**
   - Vercel includes CDN
   - Static assets cached globally

---

## 🔐 Security Hardening

### Environment Variables

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use result as JWT_SECRET
```

### Database Security

- [ ] Use SSL connection (required with Neon)
- [ ] Restrict database access to application IP
- [ ] Regular backups (automatic with Neon)
- [ ] Monitor for suspicious queries

### Application Security

- [ ] Enable CORS for your domain only
- [ ] Set up rate limiting:
  ```typescript
  // Add to middleware.ts
  import { rateLimit } from './lib/rate-limit';
  ```
- [ ] Configure CSP headers
- [ ] Set secure cookie flags

---

## 📊 Scaling Considerations

### Database Scaling

**Neon Auto-scales**, but monitor:
- Connection count
- Query performance
- Storage usage

**If needed, upgrade plan** for:
- More connections
- Compute resources
- Storage

### Application Scaling

**Vercel auto-scales**, handles:
- Traffic spikes
- Global distribution
- Automatic failover

**Cost increases** with:
- Function invocations
- Bandwidth
- Build minutes

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Error: Prisma client not generated
Solution: Add to vercel.json:
{
  "buildCommand": "prisma generate && next build"
}
```

### Database Connection Issues

```bash
# Error: P1001 Can't reach database
Check:
1. DATABASE_URL is correct
2. Database is running
3. Firewall allows connections
4. SSL mode is set correctly
```

### AI API Errors

```bash
# Error: 401 Unauthorized
Check:
1. API key is correct
2. API key is active
3. Billing is set up (OpenAI)
4. Rate limits not exceeded
```

### Vector Search Not Working

```bash
# Error: pgvector extension not found
Solution: Neon enables pgvector automatically
For self-hosted:
1. psql your_database
2. CREATE EXTENSION vector;
```

---

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Vercel Git Integration

Automatic deployment on:
- Push to `main` → Production
- Pull request → Preview deployment
- Commit to branch → Development

---

## 📈 Monitoring & Analytics

### Recommended Tools

1. **Vercel Analytics** (Built-in)
   - Page views
   - Performance metrics
   - Geographic distribution

2. **Sentry** (Error tracking)
   ```bash
   npm install @sentry/nextjs
   ```

3. **LogRocket** (Session replay)
   ```bash
   npm install logrocket
   ```

4. **Posthog** (Product analytics)
   ```bash
   npm install posthog-js
   ```

---

## 💰 Cost Estimation

### Free Tier (Recommended for Testing)
- **Vercel**: Free (100GB bandwidth/month)
- **Neon**: Free (3GB storage, 0.5GB RAM)
- **Gemini**: Free (60 requests/minute)
- **Total**: $0/month for small projects! 🎉

### Small Production (~1000 users/month)
- **Vercel Pro**: $20/month
- **Neon Scale**: $19/month
- **Gemini**: Free or OpenAI ~$5/month
- **Total**: ~$40-45/month

### Medium Production (~10,000 users/month)
- **Vercel Pro**: $20/month
- **Neon Scale**: $69/month
- **OpenAI**: ~$50/month
- **Total**: ~$140/month

---

## 🎯 Success Checklist

After deployment, verify:

- [ ] Application loads successfully
- [ ] Login/registration works
- [ ] Dashboard shows correctly
- [ ] Equipment creation works
- [ ] Report creation works
- [ ] Triage analysis completes
- [ ] Work orders created
- [ ] Knowledge base upload works
- [ ] Semantic search returns results
- [ ] Audit logs recorded
- [ ] All pages responsive
- [ ] No console errors
- [ ] SSL certificate valid
- [ ] API endpoints secured

---

## 📞 Support

If you encounter issues:

1. Check Vercel logs
2. Review Neon database logs
3. Verify environment variables
4. Check AI API status
5. Review this documentation
6. Create GitHub issue

---

**Good luck with your deployment! 🚀**

For more details, see:
- [README.md](./README.md) - Main documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guide
