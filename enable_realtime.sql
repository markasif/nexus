-- ENABLE REALTIME FOR SETTINGS
-- Run this in Supabase SQL Editor

-- Add the table to the publication that Supabase Realtime listens to
alter publication supabase_realtime add table crm_settings;
