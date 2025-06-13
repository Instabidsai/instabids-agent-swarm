# BUILD ME 10 - Deployment & API

Instructions for Execution Agent: This document contains the complete and final code for the deployment/ module and the main API entrypoint. Your task is to populate the existing files with the code provided below. DO NOT create new files or modify any logic.

## deployment/docker-compose.yml
```yaml
# deployment/docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: instabids-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  db:
    image: supabase/postgres:15.1.0
    container_name: instabids-postgres
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./deployment/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_PASSWORD=yoursecurepassword
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  api:
    build:
      context: .
      dockerfile: deployment/Dockerfile
    container_name: instabids-api
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=http://db:5432 # Placeholder, use real URL in prod
      - SUPABASE_SERVICE_ROLE_KEY=your_supabase_key # Placeholder
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      redis:
        condition: service_healthy
      db:
        condition: service_healthy

volumes:
  redis_data:
  db_data:
```

## deployment/Dockerfile
```dockerfile
# deployment/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
```

## deployment/postgres/init.sql
```sql
-- deployment/postgres/init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE event_store (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    stream_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB,
    agent_id VARCHAR(255) NOT NULL,
    correlation_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_event_store_aggregate_id ON event_store(aggregate_id);
CREATE INDEX idx_event_store_event_type ON event_store(event_type);

CREATE TABLE projects (
    id UUID PRIMARY KEY,
    homeowner_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'intake_submitted' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE contact_violations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    project_id UUID,
    violation_type VARCHAR(50) NOT NULL,
    detected_content TEXT,
    severity VARCHAR(20) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```