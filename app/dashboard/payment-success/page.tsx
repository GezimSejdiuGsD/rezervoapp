"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccess() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    async function updateSubscription() {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Update the profile
        // In a production app, you'd verify the TEB response hash here
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            plan_type: 'pro', // or fetch from a temporary storage/session
          })
          .eq('id', user.id);

        if (!error) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      }
    }

    updateSubscription();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 text-center">
        {status === 'verifying' && (
          <div className="animate-pulse font-black uppercase tracking-widest text-blue-600">
            Duke verifikuar pagesën...
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6 text-green-500">
              <CheckCircle size={80} strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-4">
              Pagesa u krye!
            </h1>
            <p className="text-gray-500 font-bold text-sm mb-8">
              Tani keni qasje në të gjitha funksionet PRO të Rezervo.
            </p>
            <Link 
              href="/dashboard" 
              className="block w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all"
            >
              Kthehu te Paneli
            </Link>
          </>
        )}

        {status === 'error' && (
          <div className="text-red-500 font-black uppercase text-xs">
            Pati një gabim gjatë procesimit. Ju lutem kontaktoni mbështetjen.
          </div>
        )}
      </div>
    </div>
  );
}