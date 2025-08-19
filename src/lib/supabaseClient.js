import { createClient } from "@supabase/supabase-js";

// Supabase client (put your keys in .env as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);