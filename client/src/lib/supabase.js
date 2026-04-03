import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if we have a valid URL, otherwise the app will crash on load
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        order: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      })
    };

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Backend features will not work, but app will load.');
}
