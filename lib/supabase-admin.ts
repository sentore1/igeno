import { createClient } from '@supabase/supabase-js';

// Admin client (server-side only - use only in API routes or server components)
// This file should NEVER be imported in client components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
