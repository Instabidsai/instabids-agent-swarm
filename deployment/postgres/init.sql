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
