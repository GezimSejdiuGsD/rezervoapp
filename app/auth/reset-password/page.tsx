"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// Using Lucide icons for the eye (common in Next.js projects)
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Rules validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password === confirmPassword && password !== '';

  const isFormValid = hasUpperCase && hasNumber && hasSymbol && hasMinLength && passwordsMatch;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert(error.message);
    } else {
      alert("Fjalëkalimi u ndryshua me sukses!");
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Fjalëkalimi i Ri</h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">Siguroni llogarinë tuaj</p>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Password Field */}
          <div className="relative">
            <input 
              type={showPass ? "text" : "password"} 
              placeholder="Fjalëkalimi i ri" 
              className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
              required 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-4 text-gray-400 hover:text-blue-600 transition"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password Field */}
          <div className="relative">
            <input 
              type={showConfirm ? "text" : "password"} 
              placeholder="Konfirmo fjalëkalimin" 
              className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
              required 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
            <button 
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-4 text-gray-400 hover:text-blue-600 transition"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Validation Checklist */}
          <div className="bg-gray-50 p-6 rounded-2xl space-y-2 border border-gray-100">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Kërkesat:</p>
            <Rule checked={hasMinLength} text="Së paku 8 karaktere" />
            <Rule checked={hasUpperCase} text="Një shkronjë të madhe" />
            <Rule checked={hasNumber} text="Një numër" />
            <Rule checked={hasSymbol} text="Një simbol (!@#$)" />
            <Rule checked={passwordsMatch} text="Fjalëkalimet përputhen" />
          </div>

          <button 
            disabled={!isFormValid || loading}
            className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all ${
              isFormValid 
                ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? "Duke u ruajtur..." : "Përditëso Fjalëkalimin"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Rule({ checked, text }: { checked: boolean, text: string }) {
  return (
    <div className={`flex items-center gap-2 text-[11px] font-bold uppercase transition-colors ${checked ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${checked ? 'bg-green-600' : 'bg-gray-300'}`} />
      {text}
    </div>
  );
}