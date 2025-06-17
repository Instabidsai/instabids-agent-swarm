# 🌊 INSTABIDS HOMEOWNER AGENT SWARM

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInstabidsai%2Finstabids-agent-swarm)

This repository contains the complete source code for the InstaBids Homeowner Agent Swarm, the world's first living AI organism for processing homeowner renovation projects.

## 🚀 LIVE DEPLOYMENT

**Production Site:** [https://instabids.ai](https://instabids.ai)

The application is deployed on Vercel with:
- **Frontend:** Next.js React application
- **Backend:** Python FastAPI with agent swarm
- **Database:** Supabase PostgreSQL with event sourcing
- **Cache/Streams:** Redis for real-time agent coordination

## 🏗️ ARCHITECTURE

- **6 Specialized Agents:** Homeowner Intake, Project Scope, Communication Filter, Payment Gate, UI Generator + FastAPI server
- **Event-Driven:** Redis Streams for coordination, Supabase for event sourcing
- **Security-First:** Absolute contact protection with violation detection
- **Real-Time:** Live agent activity visualization and project processing

## 🚀 VERCEL DEPLOYMENT GUIDE

### 1. Environment Variables
Set these in your Vercel dashboard:

```bash
REDIS_URL=your_redis_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
```

### 2. Domain Configuration
1. In Vercel dashboard, go to Project Settings → Domains
2. Add custom domain: `instabids.ai`
3. Configure DNS records as instructed by Vercel

### 3. Deploy Process
```bash
# Clone the repository
git clone https://github.com/Instabidsai/instabids-agent-swarm.git
cd instabids-agent-swarm

# Deploy to Vercel (if using CLI)
vercel --prod

# Or use the Deploy button above for one-click deployment
```

## 🛠 LOCAL DEVELOPMENT

### Frontend (Next.js)
```bash
cd ui
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend (FastAPI)
```bash
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on http://localhost:8000
```

### Full Stack with Docker
```bash
docker-compose up --build
```

## 🧪 TESTING

```bash
# Python backend tests
python -m pytest tests/

# Frontend tests  
cd ui && npm test

# Security mandate: Contact protection tests must maintain 100% pass rate
```

## 🌊 AGENT SWARM COMPONENTS

1. **Homeowner Intake Agent** - Processes initial project submissions
2. **Project Scope Agent** - Generates detailed work breakdowns
3. **Communication Filter Agent** - Enforces contact protection rules
4. **Payment Gate Agent** - Handles payment and contact authorization
5. **UI Generator Agent** - Real-time interface updates
6. **FastAPI Server** - HTTP API and system coordination

## 🛡️ CRITICAL RULES

- ❌ **NO** direct agent communication (Redis Streams only)
- 🛡️ Contact protection is **ABSOLUTE** - any violation blocks the flow
- 💰 Cost limits enforced programmatically
- 📊 Complete event sourcing and audit trail

## 📡 API ENDPOINTS

- `GET /api/health` - System health check
- `POST /api/projects/submit` - Submit homeowner project for processing

## 🔗 INFRASTRUCTURE

- **Redis Streams:** Agent coordination and real-time messaging
- **Supabase:** Event store, project data, violation tracking
- **Vercel:** Serverless deployment for global scale
- **Domain:** Custom domain setup for production use

---

**Live Demo:** [instabids.ai](https://instabids.ai) | **Repository:** [GitHub](https://github.com/Instabidsai/instabids-agent-swarm)

<!-- Deployment Update: Configuration fixes applied - 2025-06-17 -->