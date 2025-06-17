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

-- NEW TABLE: Project Media References
-- Stores references to important video frames or clips saved in object storage (e.g., Supabase Storage).
CREATE TABLE IF NOT EXISTS project_media_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NOT NULL,
    media_url TEXT NOT NULL, -- URL to the file in Supabase Storage
    media_type VARCHAR(50) NOT NULL, -- e.g., 'image/jpeg', 'video/mp4'
    description TEXT, -- AI-generated description of what the media shows
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient retrieval of media for a specific project
CREATE INDEX IF NOT EXISTS idx_media_project_id ON project_media_references(project_id);

-- Notify a channel when new media is added, so other services can react
CREATE OR REPLACE FUNCTION notify_new_media()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_media_channel', json_build_object('project_id', NEW.project_id, 'media_url', NEW.media_url)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_media_trigger
AFTER INSERT ON project_media_references
FOR EACH ROW EXECUTE FUNCTION notify_new_media();
