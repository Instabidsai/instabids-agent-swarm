#!/bin/bash
# InstaBids Agent Swarm Production Deployment Script
# This script deploys all 5 agents with production Redis/Supabase connections

set -e

echo "🚀 Starting InstaBids Agent Swarm Production Deployment..."

# CRITICAL: Export production environment variables
echo "📝 Setting production environment variables..."
export ENVIRONMENT="production"
export LOG_LEVEL="INFO"

# Production Supabase (Project: tqthesdjiewlcxpvqmjl)
export SUPABASE_URL="https://tqthesdjiewlcxpvqmjl.supabase.co"
export SUPABASE_ANON_KEY="[SUPABASE_ANON_KEY_REQUIRED]"
export SUPABASE_SERVICE_ROLE_KEY="[SUPABASE_SERVICE_ROLE_KEY_REQUIRED]"

# Production Redis/Valkey (DigitalOcean Cluster)
export REDIS_URL="rediss://default:[REDIS_PASSWORD]@instabids-redis-shared-do-user-23190909-0.i.db.ondigitalocean.com:25061"

# OpenAI API Key
export OPENAI_API_KEY="[OPENAI_API_KEY_REQUIRED]"

# Cost Control
export COST_DAILY_LIMIT="1000.0"
export COST_PER_EVENT_LIMIT="0.05"

echo "🏗️ Building Docker images..."
docker build -t instabids-agent-swarm:latest -f deployment/Dockerfile .

echo "🤖 Starting Agent 1: Homeowner Intake..."
docker run -d \
  --name instabids-homeowner-intake-agent \
  --restart unless-stopped \
  --network bridge \
  -e REDIS_URL="$REDIS_URL" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e AGENT_TYPE="homeowner_intake" \
  -e AGENT_ID="homeowner-intake-001" \
  -e ENVIRONMENT="production" \
  instabids-agent-swarm:latest \
  python -c "import asyncio; from agents.homeowner_intake.intake_agent import HomeownerIntakeAgent; asyncio.run(HomeownerIntakeAgent().start_processing())"

echo "🤖 Starting Agent 2: Project Scope..."
docker run -d \
  --name instabids-project-scope-agent \
  --restart unless-stopped \
  --network bridge \
  -e REDIS_URL="$REDIS_URL" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e AGENT_TYPE="project_scope" \
  -e AGENT_ID="project-scope-001" \
  -e ENVIRONMENT="production" \
  instabids-agent-swarm:latest \
  python -c "import asyncio; from agents.project_scope.scope_agent import ProjectScopeAgent; asyncio.run(ProjectScopeAgent().start_processing())"

echo "🤖 Starting Agent 3: Communication Filter..."
docker run -d \
  --name instabids-communication-filter-agent \
  --restart unless-stopped \
  --network bridge \
  -e REDIS_URL="$REDIS_URL" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e AGENT_TYPE="communication_filter" \
  -e AGENT_ID="communication-filter-001" \
  -e ENVIRONMENT="production" \
  instabids-agent-swarm:latest \
  python -c "import asyncio; from agents.communication_filter.filter_agent import CommunicationFilterAgent; asyncio.run(CommunicationFilterAgent().start_processing())"

echo "🤖 Starting Agent 4: Payment Gate..."
docker run -d \
  --name instabids-payment-gate-agent \
  --restart unless-stopped \
  --network bridge \
  -e REDIS_URL="$REDIS_URL" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e AGENT_TYPE="payment_gate" \
  -e AGENT_ID="payment-gate-001" \
  -e ENVIRONMENT="production" \
  instabids-agent-swarm:latest \
  python -c "import asyncio; from agents.payment_gate.payment_agent import PaymentGateAgent; asyncio.run(PaymentGateAgent().start_processing())"

echo "🤖 Starting Agent 5: UI Generator..."
docker run -d \
  --name instabids-ui-generator-agent \
  --restart unless-stopped \
  --network bridge \
  -e REDIS_URL="$REDIS_URL" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e AGENT_TYPE="ui_generator" \
  -e AGENT_ID="ui-generator-001" \
  -e ENVIRONMENT="production" \
  instabids-agent-swarm:latest \
  python -c "import asyncio; from agents.ui_generator.ui_agent import UIGeneratorAgent; asyncio.run(UIGeneratorAgent().start_processing())"

echo "🎯 Verifying agent deployment..."
echo "📊 Running containers:"
docker ps --filter "name=instabids-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "📋 Agent logs (last 10 lines each):"
for agent in homeowner-intake project-scope communication-filter payment-gate ui-generator; do
  echo "--- $agent agent ---"
  docker logs instabids-$agent-agent --tail 10 2>/dev/null || echo "Container not running"
done

echo "✅ InstaBids Agent Swarm deployment complete!"
echo "🔍 To test: Publish a message to homeowner:project_submitted stream and watch for processing"
echo "🛠️ To debug: Use 'docker logs instabids-[AGENT-NAME]-agent' for specific agent logs"
