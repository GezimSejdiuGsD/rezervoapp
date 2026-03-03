"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // This helper function automatically picks up the #access_token 
      // from the URL and sets the session in the browser.
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth error:", error.message);
        router.push('/login?error=auth-failed');
      } else {
        // Success! Send them to the dashboard
        router.push('/dashboard');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">
          Duke verifikuar llogarinë...
        </p>
      </div>
    </div>
  );
}