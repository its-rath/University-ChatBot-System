# 🚀 Deployment Guide - University Chatbot System

## Table of Contents
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)

---

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd university-chatbot

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start all services
docker-compose up -d

# 4. Check status
docker-compose logs -f app

# 5. Test the API
curl http://localhost:3000/api/health
```

### Option 2: Manual Setup

```bash
# 1. Install Node.js (18+) and MySQL 8.0

# 2. Clone repository
git clone <repository-url>
cd university-chatbot

# 3. Install dependencies
npm install

# 4. Configure database
cp .env.example .env
# Edit .env with database credentials

# 5. Initialize database
npm run setup:db

# 6. Train NLP models
npm run train:nlp

# 7. Start server
npm start
```

---

## Local Development

### Prerequisites
- Node.js 18.0+
- npm 9.0+
- MySQL 8.0+
- Redis 7.0+ (optional)

### Setup Steps

#### 1. Clone Repository
```bash
git clone <repository-url>
cd university-chatbot
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment
```bash
cp .env.example .env

# Edit .env file
nano .env
```

**Important Settings:**
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=chatbot_user
DB_PASSWORD=your_password
DB_NAME=university_chatbot
REDIS_HOST=localhost
NLP_CONFIDENCE_THRESHOLD=0.75
```

#### 4. Setup Database

**Option A: Automatic (Recommended)**
```bash
npm run setup:db
```

**Option B: Manual**
```bash
# Create database and tables
mysql -u root -p < database/schema.sql

# Load seed data
mysql -u root -p university_chatbot < database/seed.sql
```

#### 5. Train NLP Models
```bash
npm run train:nlp
```

Expected output:
```
🎓 University Chatbot NLP Training
==================================================

📖 Loading training data...
✅ Loaded 12 intent categories

📚 Building vocabulary...
✅ Vocabulary built: 5,234 words

🔧 Preparing training data...
✅ Prepared 156 training samples

🧠 Creating neural network model...
✅ Model created and compiled

🚀 Training model for 50 epochs...
[Progress indicators...]

✅ Training completed
📊 Evaluating model...
  Accuracy: 87.3%
  Loss: 0.3452

💾 Saving model...
✅ Model saved to nlp/models/intent_classifier

🎉 Training completed successfully!
```

#### 6. Start Development Server
```bash
npm run dev
```

Server should start on `http://localhost:3000`

#### 7. Test the Application
```bash
# Health check
curl http://localhost:3000/api/health

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is CS101?"}'
```

---

## Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Single Container Deployment

#### Build Image
```bash
docker build -t university-chatbot:latest .
```

#### Run Container
```bash
docker run -d \
  --name chatbot \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=mysql \
  -e DB_USER=chatbot_user \
  -e DB_PASSWORD=secure_password \
  -e REDIS_HOST=redis \
  university-chatbot:latest
```

### Multi-Container with Docker Compose

#### Configuration
Edit `docker-compose.yml` environment variables:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - DB_PASSWORD=${DB_PASSWORD}
  - REDIS_PASSWORD=${REDIS_PASSWORD}
```

#### Commands

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v

# Restart specific service
docker-compose restart app

# View service status
docker-compose ps
```

#### Access Services

- **Application**: http://localhost:3000/api
- **phpMyAdmin**: http://localhost:8080 (profile: tools)
- **Redis Commander**: http://localhost:8081 (profile: tools)

#### Enable Management Tools

```bash
docker-compose --profile tools up -d
```

---

## Cloud Deployment

### AWS ECS (Elastic Container Service)

#### 1. Push Image to ECR
```bash
# Create ECR repository
aws ecr create-repository --repository-name university-chatbot

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag university-chatbot:latest \
  <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/university-chatbot:latest

# Push image
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/university-chatbot:latest
```

#### 2. Create ECS Task Definition
```json
{
  "family": "university-chatbot",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "chatbot",
      "image": "<account_id>.dkr.ecr.us-east-1.amazonaws.com/university-chatbot:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DB_HOST",
          "value": "<rds-endpoint>"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/university-chatbot",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Heroku Deployment

#### 1. Create Heroku App
```bash
heroku create university-chatbot
```

#### 2. Add PostgreSQL/MySQL Add-on
```bash
heroku addons:create cleardb:ignite
```

#### 3. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set REDIS_URL=<redis-url>
```

#### 4. Deploy
```bash
git push heroku main
```

### Google Cloud Run

#### 1. Build and Push Image
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/university-chatbot
```

#### 2. Deploy Service
```bash
gcloud run deploy university-chatbot \
  --image gcr.io/PROJECT-ID/university-chatbot \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --timeout 60 \
  --set-env-vars NODE_ENV=production,DB_HOST=<cloudsql-instance>
```

---

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solutions**:
```bash
# Check MySQL is running
mysql -u root -p

# Check connection string in .env
echo $DB_HOST  # Should be localhost or 127.0.0.1

# For Docker, use service name
DB_HOST=mysql  # not localhost

# Test connection
mysql -h$DB_HOST -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT 1;"
```

### Redis Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solutions**:
```bash
# Check Redis is running
redis-cli ping

# For Docker
redis-cli -h redis ping

# Restart Redis
docker-compose restart redis

# App works without Redis (uses in-memory cache fallback)
```

### NLP Model Issues

**Problem**: `Error: Model not found`

**Solutions**:
```bash
# Train model
npm run train:nlp

# Check model files exist
ls -la nlp/models/intent_classifier/

# Verify model.json exists
file nlp/models/intent_classifier/model.json
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE :::3000`

**Solutions**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start

# Docker: map to different port
docker run -p 8000:3000 university-chatbot
```

### Out of Memory

**Problem**: `JavaScript heap out of memory`

**Solutions**:
```bash
# Increase Node heap size
NODE_OPTIONS=--max-old-space-size=2048 npm start

# Docker: allocate more memory
docker run -m 2g university-chatbot

# Check current usage
node --expose-gc -e "console.log(require('v8').getHeapStatistics())"
```

---

## Performance Tuning

### Database Optimization

#### 1. Connection Pooling
```javascript
// Increase connection limit for high traffic
DB_CONNECTION_LIMIT=20  // Default: 10
```

#### 2. Query Optimization
```sql
-- Check slow queries
SELECT * FROM queries WHERE response_time_ms > 1000;

-- Add indexes
CREATE INDEX idx_course_code ON courses(course_code);
CREATE INDEX idx_session_id ON queries(session_id);
```

### Cache Optimization

#### 1. Configure Redis
```env
CACHE_TTL=3600              # Cache for 1 hour
REDIS_MAXMEMORY=256mb
REDIS_MAXMEMORY_POLICY=allkeys-lru
```

#### 2. Monitor Cache Performance
```bash
redis-cli INFO stats
```

### NLP Model Optimization

#### 1. Reduce Model Size
```javascript
// Use quantization for smaller model
const quantizedModel = tf.quantization.quantize(model);
```

#### 2. Batch Processing
```javascript
// Process multiple queries together
const results = await nlpService.batchProcessMessages(messages);
```

### Load Balancing

#### Nginx Configuration
```nginx
upstream chatbot {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    server_name api.university.edu;

    location /api {
        proxy_pass http://chatbot;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Monitoring

#### Application Metrics
```bash
# Get performance metrics
curl http://localhost:3000/api/analytics/performance

# View logs
docker-compose logs -f app

# Monitor resources
docker stats
```

#### Setup Monitoring Tools
```yaml
# docker-compose.yml additions
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  depends_on:
    - prometheus
```

---

## Health Checks

### Application Health
```bash
curl http://localhost:3000/api/health
```

### Database Health
```bash
curl http://localhost:3000/api/analytics/queries?limit=1
```

### NLP Model Status
```javascript
// Check in application logs
// Should log: "✅ NLP models loaded successfully"
```

---

## Maintenance

### Backup Database
```bash
# MySQL backup
mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME > backup.sql

# Docker: from container
docker exec chatbot-mysql mysqldump -u root -p$DB_ROOT_PASSWORD $DB_NAME > backup.sql
```

### Restore Database
```bash
mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < backup.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild Docker image
docker-compose build --no-cache

# Restart services
docker-compose down
docker-compose up -d
```

### Scheduled Tasks

#### Cleanup Old Logs
```bash
# Linux cron job
0 2 * * * find /app/logs -name "*.log" -mtime +30 -delete
```

#### Database Maintenance
```sql
-- Remove old queries (older than 90 days)
DELETE FROM queries WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Optimize tables
OPTIMIZE TABLE queries, analytics_daily;
```

---

## Useful Commands

```bash
# View environment variables
docker-compose config

# Execute command in container
docker-compose exec app npm run train:nlp

# View specific service logs
docker-compose logs app -f --tail=100

# Scale services (if using Swarm)
docker-compose up --scale app=3

# Remove unused images/containers
docker system prune -a

# Check disk usage
docker system df
```

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation: `/docs`
- Open GitHub issue
- Contact support@university.edu

---

**Last Updated**: November 2025
