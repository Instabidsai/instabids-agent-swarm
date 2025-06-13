# 🚀 InstaBids Agent Swarm - Live Development Deployment Guide

## Quick Start - Live System

### 1. Set Environment Variables
```bash
export REDIS_URL="your_redis_connection_string"
export SUPABASE_URL="your_supabase_url" 
export SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_key"
export OPENAI_API_KEY="your_openai_key"
export COST_DAILY_LIMIT="100.0"
export COST_PER_EVENT_LIMIT="2.0"
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Deployment Options

#### Option A: Start Full System
```bash
# Terminal 1 - API Server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - All Agents
python run_agents.py all
```

#### Option B: Start Individual Components
```bash
# Start individual agents
python run_agents.py intake
python run_agents.py scope  
python run_agents.py filter
python run_agents.py payment
python run_agents.py ui
```

### 4. Test the API
```bash
# Health check
curl http://localhost:8000/health

# Submit a test project
curl -X POST http://localhost:8000/projects/submit \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-001",
    "contact_info": {
      "email": "test@example.com",
      "first_name": "Test",
      "last_name": "User", 
      "zip_code": "12345",
      "city": "Test City",
      "state": "TS"
    },
    "project_details": {
      "raw_description": "I need to remodel my kitchen with new cabinets and granite countertops"
    }
  }'
```

### 5. Monitor System
- **Redis Streams**: Check event flow in Redis
- **Supabase Database**: Monitor event_store and contact_violations tables
- **Agent Logs**: Watch console output for agent processing

## Architecture Overview
- **FastAPI Server**: Handles HTTP requests and publishes to Redis streams
- **5 Agent Workers**: Process events from Redis streams asynchronously
- **Event Store**: All events persisted in Supabase for audit trail
- **Security Layer**: Contact information protection with violation tracking

## Key Features
✅ **Event-Driven Architecture**: Redis Streams for agent communication  
✅ **Contact Protection**: Automatic detection and filtering  
✅ **Event Sourcing**: Complete audit trail in Supabase  
✅ **Cost Controls**: LLM usage limits and circuit breakers  
✅ **Real-time Processing**: Asynchronous agent workers  

Ready for live testing with real API calls! 🌊
