import { createClient } from '@supabase/supabase-js';

// --- FINAL TEST: FORENSIC REPLACEMENT OF CREDENTIALS ---
// The URL has been manually re-typed to eliminate any possible
// hidden characters or copy-paste errors.

const supabaseUrl = "https://iqtsncoicnnhabuoepwx.supabase.co";

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxdHNuY29pY25uaGFidW9lcHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTIwMTMsImV4cCI6MjA3NTU2ODAxM30.VFVdnAS__8aj7qBE0cys4nJbkxBSKkLRq_H2UdjVEZc";

// -------------------------------------------------------------

console.log("FINAL TEST: Using clean, hard-coded Supabase URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

