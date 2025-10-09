// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- Quick debug logs ---
console.log("Supabase URL:", supabaseUrl)
console.log("Anon key length:", supabaseAnonKey?.length)

// --- Create Supabase client ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
