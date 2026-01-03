
import { createClient } from '@supabase/supabase-js';

// TODO: Move these to environment variables in production
const SUPABASE_URL = 'https://tywjsjlibpxzoizdblhn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2pzamxpYnB4em9pemRibGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNDgzNDgsImV4cCI6MjA4MjgyNDM0OH0.Vg-F3YPdnlal5nLGbRJaOQ9m04oiG8_R2DXr53FUPUo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
