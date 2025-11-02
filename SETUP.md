# 🚀 University Chatbot System - Setup Guide

## ⚠️ Installation Note

The project uses `@tensorflow/tfjs-node` which requires native bindings. On Windows, this can sometimes fail during installation.

## 📋 Setup Options

### Option 1: Docker (Recommended - Easiest)

Docker handles all dependencies automatically and works on all platforms.

```bash
# 1. Ensure Docker Desktop is installed and running

# 2. Copy environment file
copy .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f app

# 6. Test the API
curl http://localhost:3000/api/health
```

The application will be available at `http://localhost:3000`

### Option 2: Manual Installation (Windows)

If Docker isn't available, you can install manually with some adjustments:

#### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Redis 7.0+ (optional but recommended)
- Windows Build Tools (for native modules)

#### Steps

**1. Install Windows Build Tools (if not already installed)**
```bash
# Run as Administrator in PowerShell
npm install --global windows-build-tools
```

**2. Install Dependencies**

Try one of these approaches:

**Approach A: Install with --ignore-scripts**
```bash
npm install --ignore-scripts
```

**Approach B: Use CPU-only TensorFlow**
```bash
# Install dependencies without TensorFlow first
npm install --omit=optional

# Then install TensorFlow CPU version
npm install @tensorflow/tfjs
```

**Approach C: Skip TensorFlow (Use rule-based NLP only)**
```bash
# Modify package.json to remove @tensorflow/tfjs-node
# Keep: natural, compromise packages
npm install
```

**3. Configure Environment**
```bash
copy .env.example .env
# Edit .env with your database credentials
```

**4. Setup Database**
```bash
# Create database and user in MySQL
mysql -u root -p < database/schema.sql
mysql -u root -p university_chatbot < database/seed.sql
```

**5. Start the Application**
```bash
# Development mode
npm run dev

# Production mode  
npm start
```

### Option 3: Use Without ML (Rule-Based Only)

If TensorFlow installation fails, you can run the chatbot with rule-based NLP only:

**1. Modify `src/config/nlp.js`** - Comment out TensorFlow code
**2. Modify `src/services/nlpService.js`** - Use only Natural.js and Compromise
**3. Install dependencies:**
```bash
npm install express mysql2 dotenv natural compromise redis express-rate-limit helmet cors winston joi uuid compression morgan
```

## 🗄️ Database Setup

### Using MySQL Command Line

```bash
# 1. Login to MySQL
mysql -u root -p

# 2. Create database
CREATE DATABASE university_chatbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. Create user
CREATE USER 'chatbot_user'@'localhost' IDENTIFIED BY 'your_password';

# 4. Grant privileges
GRANT ALL PRIVILEGES ON university_chatbot.* TO 'chatbot_user'@'localhost';
FLUSH PRIVILEGES;

# 5. Exit MySQL
exit;

# 6. Import schema and seed data
mysql -u chatbot_user -p university_chatbot < database/schema.sql
mysql -u chatbot_user -p university_chatbot < database/seed.sql
```

### Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `database/schema.sql`
4. Execute script
5. Repeat for `database/seed.sql`

## 📝 Configuration

Edit `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=chatbot_user
DB_PASSWORD=your_secure_password_here
DB_NAME=university_chatbot

# Redis (optional - comment out if not using)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV=development
```

## 🧪 Testing the Installation

```bash
# 1. Start the server
npm start

# 2. Test health endpoint
curl http://localhost:3000/api/health

# 3. Test chat endpoint
curl -X POST http://localhost:3000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"What is CS101?\"}"
```

Expected response:
```json
{
  "success": true,
  "response": "CS101 is Introduction to Computer Science...",
  "intent": "course_info",
  "confidence": 0.92
}
```

## 🐛 Troubleshooting

### TensorFlow Installation Fails

**Solution 1: Use Docker** (recommended)

**Solution 2: Skip TensorFlow**
- Remove `@tensorflow/tfjs-node` from `package.json`
- The chatbot will use rule-based NLP (Natural.js + Compromise)
- Still achieves good accuracy for university queries

### MySQL Connection Error

Check:
- MySQL service is running
- Credentials in `.env` are correct
- Database exists
- User has proper privileges

```bash
# Test connection
mysql -u chatbot_user -p university_chatbot
```

### Redis Connection Error

If Redis is not installed:
- Comment out Redis configuration in `.env`
- The app will work without caching (slightly slower)

### Port Already in Use

Change port in `.env`:
```env
PORT=3001
```

## 📊 Project Structure Verification

Ensure all files are in place:

```
university-chatbot/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── nlp.js
│   ├── controllers/
│   │   ├── chatController.js
│   │   └── analyticsController.js
│   ├── services/
│   │   ├── nlpService.js
│   │   └── responseGenerator.js
│   ├── routes/
│   │   ├── chatRoutes.js
│   │   └── analyticsRoutes.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── cache.js
│   └── app.js
├── database/
│   ├── schema.sql
│   └── seed.sql
├── nlp/
│   └── training/
│       ├── train.js
│       └── intents.json
├── .env.example
├── package.json
├── server.js
└── README.md
```

## ✅ Next Steps

After successful installation:

1. **Read the Documentation**
   - `README.md` - Complete project documentation
   - `docs/DEPLOYMENT.md` - Deployment guide

2. **Test the Chatbot**
   - Try various queries
   - Check analytics endpoints
   - Monitor logs

3. **Customize**
   - Add more intents in `nlp/training/intents.json`
   - Add course data in database
   - Modify response templates

4. **Deploy**
   - Follow `docs/DEPLOYMENT.md` for production deployment
   - Set up monitoring and backups

## 📞 Need Help?

- Check logs: `logs/app.log`
- View server output for errors
- Consult `README.md` for API documentation
- Use Docker if manual installation is problematic

## 🎉 Quick Start Summary

**Fastest way to get started:**

```bash
# Use Docker
docker-compose up -d

# Check it's running
curl http://localhost:3000/api/health

# Test chatbot
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"message\": \"What is CS101?\"}"
```

Done! Your chatbot is ready to use. 🚀
