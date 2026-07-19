import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

// Create browser client with proper configuration
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined;
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(c => c.startsWith(name + '='));
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined;
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return;
          let cookieString = `${name}=${encodeURIComponent(value)}`;
          if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options.path) cookieString += `; path=${options.path}`;
          if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
          if (options.secure) cookieString += '; secure';
          document.cookie = cookieString;
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=; max-age=0; path=${options.path || '/'}`;
        },
      },
    }
  );
}

// Singleton instance for backward compatibility
export const supabase = createBrowserClient();
