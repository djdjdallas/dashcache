-- Add storage path fields to video_submissions table
-- Run this migration against your Supabase database

ALTER TABLE video_submissions 
ADD COLUMN raw_video_path TEXT,
ADD COLUMN processed_video_path TEXT,
ADD COLUMN raw_video_size_bytes BIGINT,
ADD COLUMN processed_video_size_bytes BIGINT,
ADD COLUMN supabase_bucket TEXT DEFAULT 'dashcam-videos';

-- Add an index for efficient querying by storage paths
CREATE INDEX idx_video_submissions_raw_path ON video_submissions(raw_video_path);
CREATE INDEX idx_video_submissions_processed_path ON video_submissions(processed_video_path);

-- Update the upload_status enum to include new states
ALTER TABLE video_submissions 
DROP CONSTRAINT IF EXISTS video_submissions_upload_status_check;

ALTER TABLE video_submissions 
ADD CONSTRAINT video_submissions_upload_status_check 
CHECK (upload_status IN ('pending', 'uploading', 'processing', 'anonymizing', 'completed', 'failed'));

-- Add comments for clarity
COMMENT ON COLUMN video_submissions.raw_video_path IS 'Path to original video file in Supabase Storage';
COMMENT ON COLUMN video_submissions.processed_video_path IS 'Path to processed/anonymized video file in Supabase Storage';
COMMENT ON COLUMN video_submissions.raw_video_size_bytes IS 'Size of original video file in bytes';
COMMENT ON COLUMN video_submissions.processed_video_size_bytes IS 'Size of processed video file in bytes';
COMMENT ON COLUMN video_submissions.supabase_bucket IS 'Supabase Storage bucket name';