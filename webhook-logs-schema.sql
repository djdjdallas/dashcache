-- Create webhook_logs table for debugging and monitoring
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL, -- 'mux' or 'sightengine'
  event_type VARCHAR(100) NOT NULL, -- e.g., 'video.asset.ready'
  event_id VARCHAR(255), -- Unique ID from the webhook event
  event_data JSONB, -- Full webhook payload
  error_message TEXT, -- Error message if webhook processing failed
  error_details JSONB, -- Additional error context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_webhook_logs_service ON webhook_logs(service);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_error ON webhook_logs(error_message) WHERE error_message IS NOT NULL;

-- Create a cleanup policy (optional - removes logs older than 30 days)
-- This can be run as a scheduled job
/*
DELETE FROM webhook_logs 
WHERE created_at < NOW() - INTERVAL '30 days';
*/