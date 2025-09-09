# Redis Cloud Vector Search Demo

A full-stack application demonstrating Redis Cloud with RedisVL for semantic document search, built with FastAPI backend and React frontend.

## Features

- 📄 Document upload and processing
- 🔍 Semantic search using Redis vector similarity
- ⚡ Real-time search with FastAPI
- 🎨 Modern React UI with Tailwind CSS
- ☁️ Deployed on Replit with Redis Cloud (AWS US-East-1)

## Architecture

- **Backend**: FastAPI + RedisVL + Redis Cloud
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: Redis Cloud (Vector + Cache)
- **Deployment**: Replit
- **Repository**: Public GitHub

## 📚 Documentation

This README contains all the essential information to get started. Additional documentation is maintained separately for security reasons.

## Quick Start

### Prerequisites

- Redis Cloud account with database in AWS US-East-1
- Python 3.11.11 (managed with pyenv)
- Node.js 20+ (latest)
- OpenAI API key

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mydemoapp
```

2. Set up Python environment:
```bash
# Install Python 3.11.11 with pyenv
pyenv install 3.11.11
pyenv local 3.11.11

# Set up backend
cd backend
pip install -r requirements.txt
```

3. Set up frontend:
```bash
cd frontend
npm install
```

4. Configure environment variables:
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your Redis Cloud and OpenAI credentials

# Frontend environment
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API base URL
```

5. Run the application:
```bash
# Option 1: Use the start script
./start.sh

# Option 2: Run manually in separate terminals
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Redis Cloud Setup (AWS US-East-1)

1. Create a Redis Cloud account at https://redis.com/try-free/
2. Create a new database:
   - Cloud Provider: AWS
   - Region: US-East-1 (N. Virginia)
   - Plan: Free tier (30MB) or paid plan
   - Modules: Enable RediSearch and RedisJSON
3. Get connection details:
   - Host, Port, Password from the database dashboard
   - Use these in your `.env` file

## Environment Setup

### Backend Environment Variables

Create `backend/.env`:

```env
# Redis Cloud Configuration (AWS US-East-1)
REDIS_URL=redis://default:your-password@your-host:your-port
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password

# OpenAI API Key for embeddings
OPENAI_API_KEY=sk-your-openai-api-key

# Application Settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:8000
```

## Deployment on Replit

### Step 1: Prepare Repository
1. Push your code to a public GitHub repository
2. Ensure all files are committed including `.replit` and `replit.nix`

### Step 2: Import to Replit
1. Go to https://replit.com
2. Click "Create Repl" → "Import from GitHub"
3. Enter your repository URL
4. Replit will automatically detect the configuration

### Step 3: Configure Environment Variables
In Replit, go to "Secrets" tab and add:

```
REDIS_URL=redis://default:password@host:port
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password
OPENAI_API_KEY=sk-your-openai-api-key
ENVIRONMENT=production
VITE_API_BASE_URL=https://your-repl-name.your-username.repl.co
```

### Step 4: Deploy
1. Click "Run" - Replit will execute `start.sh`
2. The app will be available at your Replit URL
3. Both backend (port 8000) and frontend (port 5173) will be accessible

## API Endpoints

- `POST /api/documents/upload` - Upload and process documents
- `GET /api/documents/search` - Semantic search
- `GET /api/health` - Health check

## Tech Stack

- **Backend**: FastAPI, RedisVL, Redis-py, Uvicorn
- **Frontend**: React, Vite, Tailwind CSS, Axios
- **Database**: Redis Cloud with RediSearch and RedisJSON
- **ML**: OpenAI Embeddings (via RedisVL)

## License

MIT License
