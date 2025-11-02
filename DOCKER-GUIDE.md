# 🐳 Docker Setup Guide - Fixed

## ✅ Dockerfile Fixed

The Dockerfile has been updated to handle the npm installation issues properly.

---

## 🚀 Quick Start

```bash
# 1. Make sure .env file exists (it should now)
# If not: copy .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Wait ~30 seconds for database initialization

# 4. Check status
docker-compose ps

# 5. Test the API
curl http://localhost:3000/api/health
```

---

## 📋 What Was Fixed

### Issue
- `npm ci` required `package-lock.json` which didn't exist
- `--only=production` flag was deprecated
- TensorFlow.js build failures on some systems

### Solution
- Changed to `npm install --omit=dev`
- Added `--ignore-scripts` to skip TensorFlow native builds
- Fallback installation if first attempt fails
- Created `Dockerfile.simple` as backup option

---

## 🔧 Two Dockerfile Options

### Option 1: Dockerfile (Default - Recommended)
```bash
docker-compose up -d
```

**Features:**
- Multi-stage build for smaller image
- Attempts to install all dependencies including TensorFlow
- Falls back gracefully if TensorFlow fails
- Most optimized

### Option 2: Dockerfile.simple (Fallback)
```bash
docker-compose -f docker-compose.simple.yml up -d
```

**Features:**
- Simpler, single-stage build
- Explicitly skips TensorFlow
- Installs only essential packages
- More reliable on all systems

---

## 📊 Checking Build Progress

### View Build Logs
```bash
docker-compose build --progress=plain
```

### View Container Logs
```bash
# All services
docker-compose logs -f

# Just app
docker-compose logs -f app

# Just MySQL
docker-compose logs -f mysql
```

---

## 🗄️ Database Initialization

The database is automatically initialized with:
- ✅ Schema (11 tables)
- ✅ Sample data (courses, instructors, schedules)

**Check if database is ready:**
```bash
docker-compose exec mysql mysql -u chatbot_user -psecure_password university_chatbot -e "SHOW TABLES;"
```

---

## 🧪 Testing the Chatbot

### Health Check
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-02T...",
  "uptime": 123,
  "services": {
    "database": "OK",
    "cache": "OK",
    "nlp": "OK"
  }
}
```

### Send a Chat Message
```bash
curl -X POST http://localhost:3000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"What is CS101?\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "response": "CS101 is Introduction to Computer Science...",
  "intent": "course_info",
  "confidence": 0.92,
  "entities": {
    "course_codes": ["CS101"]
  }
}
```

---

## 🔍 Troubleshooting

### Build Fails with TensorFlow Error
**Solution 1:** The fixed Dockerfile should handle this automatically.

**Solution 2:** Use the simple Dockerfile:
```bash
# Edit docker-compose.yml, change line 8:
# dockerfile: Dockerfile
# to:
# dockerfile: Dockerfile.simple

# Then rebuild
docker-compose up -d --build
```

### Container Keeps Restarting
```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Database not ready - wait 30-60 seconds
# 2. Port 3000 busy - change in .env: PORT=3001
```

### Can't Connect to Database
```bash
# Check MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec mysql mysql -u chatbot_user -psecure_password university_chatbot
```

### Port Already in Use
```bash
# Change ports in .env:
PORT=3001

# Or change in docker-compose.yml:
# ports:
#   - "3001:3000"

# Restart
docker-compose down
docker-compose up -d
```

---

## 🛠️ Useful Commands

### Start Services
```bash
docker-compose up -d                    # Start in background
docker-compose up                       # Start with logs
docker-compose up -d --build            # Rebuild and start
```

### Stop Services
```bash
docker-compose stop                     # Stop containers
docker-compose down                     # Stop and remove
docker-compose down -v                  # Stop, remove, and delete volumes
```

### View Status
```bash
docker-compose ps                       # List containers
docker-compose logs -f app              # Follow app logs
docker-compose exec app sh              # Shell into app container
```

### Database Management
```bash
# Access MySQL CLI
docker-compose exec mysql mysql -u chatbot_user -psecure_password university_chatbot

# Backup database
docker-compose exec mysql mysqldump -u chatbot_user -psecure_password university_chatbot > backup.sql

# Access phpMyAdmin (if enabled)
# http://localhost:8080
docker-compose --profile tools up -d
```

### Redis Management
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Clear cache
docker-compose exec redis redis-cli FLUSHALL

# Access Redis Commander (if enabled)
# http://localhost:8081
docker-compose --profile tools up -d
```

---

## 🎯 Complete Workflow

```bash
# 1. Build and start (first time)
docker-compose up -d --build

# 2. Wait for services
sleep 30

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f app

# 5. Test API
curl http://localhost:3000/api/health

# 6. Test chatbot
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"message\": \"What is CS101?\"}"

# 7. Access phpMyAdmin (optional)
docker-compose --profile tools up -d
# Visit: http://localhost:8080

# 8. Stop when done
docker-compose down
```

---

## 📦 Services Overview

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **App** | 3000 | http://localhost:3000 | Chatbot API |
| **MySQL** | 3306 | localhost:3306 | Database |
| **Redis** | 6379 | localhost:6379 | Cache |
| **phpMyAdmin** | 8080 | http://localhost:8080 | DB Admin (optional) |
| **Redis Commander** | 8081 | http://localhost:8081 | Cache Admin (optional) |

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ `docker-compose ps` shows all containers as "Up" and "healthy"
2. ✅ `curl http://localhost:3000/api/health` returns status "OK"
3. ✅ Chat query returns proper response with intent and confidence
4. ✅ No errors in `docker-compose logs app`

---

## 🎉 You're Done!

Your University Chatbot System is now running in Docker with:
- ✅ Node.js application
- ✅ MySQL database with sample data
- ✅ Redis cache
- ✅ All dependencies installed
- ✅ Auto-restart on failure
- ✅ Health checks enabled

**Next Steps:**
1. Test various queries
2. Check analytics: `curl http://localhost:3000/api/analytics/accuracy`
3. Review logs for any issues
4. Customize data in MySQL if needed

---

**Dockerfile Fixed:** ✅  
**Ready to Run:** ✅  
**All Services:** ✅
