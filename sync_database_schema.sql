-- Sync System Database Schema for Stickee
-- Run these SQL commands in Supabase SQL Editor

-- 1. Update users table with sync-related fields
ALTER TABLE users ADD COLUMN device_name VARCHAR(255);
ALTER TABLE users ADD COLUMN last_sync_at TIMESTAMP;
ALTER TABLE users ADD COLUMN sync_enabled BOOLEAN DEFAULT false;

-- 2. Create sync_sessions table for code-based device linking
CREATE TABLE sync_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_code VARCHAR(6) UNIQUE NOT NULL,
  host_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  host_device_name VARCHAR(255) NOT NULL,
  joiner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joiner_device_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'connected', 'expired'
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes'),
  connected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create devices table to track user devices
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
  device_fingerprint TEXT UNIQUE, -- Browser/device identifier
  last_seen TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create sync_logs table for tracking sync operations
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'link_device'
  operation_data JSONB,
  sync_status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add indexes for performance
CREATE INDEX idx_sync_sessions_sync_code ON sync_sessions(sync_code);
CREATE INDEX idx_sync_sessions_host_user_id ON sync_sessions(host_user_id);
CREATE INDEX idx_sync_sessions_status ON sync_sessions(status);
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_fingerprint ON devices(device_fingerprint);
CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);

-- 6. Create function to generate sync codes
CREATE OR REPLACE FUNCTION generate_sync_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || SUBSTRING(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to clean expired sync sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sync_sessions()
RETURNS VOID AS $$
BEGIN
  UPDATE sync_sessions 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Set up automatic cleanup (run this as a scheduled job in Supabase)
-- This will be handled by the application logic instead of a database trigger
