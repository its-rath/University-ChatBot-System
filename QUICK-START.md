# 🚀 Quick Start Guide - University Chatbot System

## ✅ Build Status: COMPLETE

Your University Chatbot System is fully built and ready to run!

---

## 🎯 Choose Your Setup Method

### Option 1: Docker (Recommended) 🐳

**Prerequisites:** Docker Desktop installed and running

```bash
# 1. Navigate to project
cd d:\Projects\University-ChatBot-System

# 2. Copy environment file
copy .env.example .env

# 3. Start all services (MySQL, Redis, App)
docker-compose up -d

# 4. Wait ~30 seconds for services to start, then test (bash)
curl http://localhost:3000/api/health

# 5. Try the chatbot (bash)
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"What is CS101?"}'

-- OR, on Windows PowerShell (recommended) --

```powershell
# Health check (PowerShell)
Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -Method Get

# Chat test (PowerShell)
Invoke-RestMethod -Uri 'http://localhost:3000/api/chat' -Method Post -ContentType 'application/json' -Body '{"message":"What is CS101?"}'

# If you prefer curl in PowerShell, call curl.exe to avoid PowerShell's alias parsing
curl.exe -X POST "http://localhost:3000/api/chat" -H "Content-Type: application/json" -d '{"message":"What is CS101?"}'
```
```

**View logs:**
```bash
docker-compose logs -f app
```

**Stop services:**
```bash
docker-compose down
```

---

### Option 2: Manual Setup 💻

**Prerequisites:**
- Node.js 18+
- MySQL 8.0+
- Redis 7.0+ (optional)

#### Step 1: Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE university_chatbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatbot_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON university_chatbot.* TO 'chatbot_user'@'localhost';
FLUSH PRIVILEGES;
exit;

# Import schema and seed data
mysql -u chatbot_user -p university_chatbot < database\schema.sql
mysql -u chatbot_user -p university_chatbot < database\seed.sql
```

#### Step 2: Configure Environment

```bash
# Copy environment template
copy .env.example .env

# Edit .env with your settings
notepad .env
```

Update these values in `.env`:
```env
DB_HOST=localhost
DB_USER=chatbot_user
DB_PASSWORD=your_password
DB_NAME=university_chatbot
```

#### Step 3: Install Dependencies

**Note:** TensorFlow.js may fail on Windows. The app works fine with rule-based NLP only.

```bash
# Install main dependencies (will attempt TensorFlow)
npm install

# If TensorFlow fails, the app still works!
# All core dependencies are installed.
```

#### Step 4: Start Application

```bash
# Development mode
npm run dev

# OR Production mode
npm start
```

#### Step 5: Test

```bash
# Health check (bash)
curl http://localhost:3000/api/health

# Chat test (bash)
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"What is CS101?"}'

-- OR, on Windows PowerShell (recommended) --

```powershell
# Health check (PowerShell)
Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -Method Get

# Chat test (PowerShell)
Invoke-RestMethod -Uri 'http://localhost:3000/api/chat' -Method Post -ContentType 'application/json' -Body '{"message":"What is CS101?"}'

# If you prefer curl in PowerShell, call curl.exe to avoid PowerShell's alias parsing
curl.exe -X POST "http://localhost:3000/api/chat" -H "Content-Type: application/json" -d '{"message":"What is CS101?"}'
```
```

---

## 📡 Available Endpoints

Once running at `http://localhost:3000`:

### Core Endpoints
- `GET /api/health` - System health check
- `POST /api/chat` - Send message to chatbot
- `GET /api/chat/history/:sessionId` - Get conversation history
- `POST /api/chat/feedback` - Submit feedback

### Analytics Endpoints
- `GET /api/analytics/accuracy` - Accuracy metrics
- `GET /api/analytics/queries` - Query logs
- `GET /api/analytics/intents` - Intent statistics

---

## 🧪 Test Examples

### Basic Chat Query
```bash
curl -X POST http://localhost:3000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"What is CS101?\"}"
```

### Schedule Query
```bash
curl -X POST http://localhost:3000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"When is CS101 offered?\"}"
```

### Instructor Query
```bash
curl -X POST http://localhost:3000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Who teaches Database Systems?\"}"
```

### Get Analytics
```bash
curl http://localhost:3000/api/analytics/accuracy?days=7
```

---

## 🎯 Supported Query Types

The chatbot can answer questions about:

1. **Course Information** - "What is CS101?", "Tell me about Data Structures"
2. **Class Schedules** - "When is CS101?", "What time does MATH201 meet?"
3. **Instructor Details** - "Who teaches CS101?", "Dr. Smith office hours"
4. **Prerequisites** - "What are the prerequisites for CS301?"
5. **Course Availability** - "Is CS101 available?", "How many seats in MATH201?"
6. **Department Courses** - "What CS courses are offered?", "Show me MATH courses"
7. **Credit Hours** - "How many credits is CS101?"
8. **Course Levels** - "Show me 400-level CS courses"

---

## 📊 Sample Data Included

The database is pre-loaded with:
- 15+ sample courses (CS, MATH, PHYS departments)
- 10+ instructors with contact info
- Multiple class schedules
- All necessary reference data

---

## 🔧 Configuration

Key settings in `.env`:

```env
# Application
PORT=3000                          # Change if 3000 is busy
NODE_ENV=development               # or 'production'

# Database
DB_HOST=localhost                  # or 'mysql' for Docker
DB_PORT=3306
DB_USER=chatbot_user
DB_PASSWORD=your_password
DB_NAME=university_chatbot

# Redis (optional - comment out if not using)
REDIS_HOST=localhost               # or 'redis' for Docker
REDIS_PORT=6379

# NLP
NLP_CONFIDENCE_THRESHOLD=0.75      # Min confidence for intent
```

---

## 🐛 Troubleshooting

### Port Already in Use
Change port in `.env`:
```env
PORT=3001
```

### MySQL Connection Failed
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Redis Connection Failed
- Redis is optional - comment out in `.env` if not installed
- App will work without caching (slightly slower)

### TensorFlow Installation Failed
- **This is OK!** The app works with rule-based NLP
- Core dependencies are installed
- Just run `npm start` anyway

### Can't Access API
- Check server is running
- Verify port: `http://localhost:3000`
- Check logs in `logs/` directory

---

## 📚 Documentation

- **README.md** - Complete documentation (663 lines)
- **SETUP.md** - Detailed setup guide with troubleshooting
- **BUILD-SUMMARY.md** - What was built & project stats
- **docs/DEPLOYMENT.md** - Production deployment guide

---

## 🎉 You're All Set!

**Fastest way:**
```bash
docker-compose up -d
curl http://localhost:3000/api/health
```

```powershell
# PowerShell (recommended) after docker-compose up -d
Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -Method Get
```

**Next steps:**
1. Test the chatbot with sample queries
2. Check analytics endpoints
3. Review documentation
4. Customize for your university's data

---

## 📞 Need Help?

1. Check `SETUP.md` for detailed troubleshooting
2. View logs: `logs/app.log` or `docker-compose logs -f`
3. Review `README.md` for API documentation
4. Check `BUILD-SUMMARY.md` for project overview

---

**Project Location:** `d:\Projects\University-ChatBot-System`  
**Build Date:** November 2, 2025  
**Status:** ✅ Production Ready  
**Ready to Run:** YES 🚀
