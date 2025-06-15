-- Fix Supabase Storage RLS policies for dashcam-videos bucket
-- Run this in your Supabase SQL Editor

-- Enable RLS on the storage buckets if not already enabled
-- Note: This might already be enabled, so we use IF NOT EXISTS equivalent

-- Create policy for authenticated users to upload to their own folder
INSERT INTO storage.policies (name, bucket_id, command, definition)
VALUES (
  'Drivers can upload to their own folder',
  'dashcam-videos',
  'INSERT',
  '(bucket_id = ''dashcam-videos'') AND (auth.role() = ''authenticated'') AND ((storage.foldername(name))[1] = ''raw'') AND ((storage.foldername(name))[2] = auth.uid()::text)'
)
ON CONFLICT (bucket_id, name) DO UPDATE SET
  definition = EXCLUDED.definition;

-- Create policy for authenticated users to read their own files
INSERT INTO storage.policies (name, bucket_id, command, definition)
VALUES (
  'Drivers can read their own files',
  'dashcam-videos',
  'SELECT',
  '(bucket_id = ''dashcam-videos'') AND (auth.role() = ''authenticated'') AND ((storage.foldername(name))[2] = auth.uid()::text OR (storage.foldername(name))[1] = ''processed'')'
)
ON CONFLICT (bucket_id, name) DO UPDATE SET
  definition = EXCLUDED.definition;

-- Create policy for service role to manage all files (for webhook processing)
INSERT INTO storage.policies (name, bucket_id, command, definition)
VALUES (
  'Service role can manage all files',
  'dashcam-videos',
  'ALL',
  'auth.role() = ''service_role'''
)
ON CONFLICT (bucket_id, name) DO UPDATE SET
  definition = EXCLUDED.definition;

-- Alternative: If the above doesn't work, create a more permissive policy for testing
-- Uncomment these lines if you want to temporarily allow all authenticated users:

-- INSERT INTO storage.policies (name, bucket_id, command, definition)
-- VALUES (
--   'Authenticated users can upload videos',
--   'dashcam-videos', 
--   'INSERT',
--   'auth.role() = ''authenticated'''
-- )
-- ON CONFLICT (bucket_id, name) DO UPDATE SET
--   definition = EXCLUDED.definition;

-- INSERT INTO storage.policies (name, bucket_id, command, definition)
-- VALUES (
--   'Authenticated users can read videos',
--   'dashcam-videos',
--   'SELECT', 
--   'auth.role() = ''authenticated'''
-- )
-- ON CONFLICT (bucket_id, name) DO UPDATE SET
--   definition = EXCLUDED.definition;