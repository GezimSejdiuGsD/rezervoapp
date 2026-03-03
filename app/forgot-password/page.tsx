"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) setMessage(error.message);
    else setMessage("Kontrolloni email-in tuaj për linkun e rivendosjes!");
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-black mb-2">Harruat Fjalëkalimin?</h2>
        <p className="text-gray-500 text-sm mb-6 font-medium">Shkruani email-in tuaj për të pranuar linkun e rivendosjes.</p>
        
        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="email" 
            placeholder="email@shembull.com" 
            className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <button 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Duke u dërguar..." : "Dërgo Linkun"}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm font-bold text-blue-600">{message}</p>}
      </div>
    </div>
  );
}