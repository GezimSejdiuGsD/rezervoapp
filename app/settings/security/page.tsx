"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import GlobalNavbar from '@/components/GlobalNavbar';
import { Eye, EyeOff, ShieldCheck, Monitor, MapPin, Clock } from 'lucide-react';

export default function SecuritySettings() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // --- Fetch Session Data ---
  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionInfo(session);
      }
    }
    getSession();
  }, []);

  // --- Password Rules Logic ---
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password === confirmPassword && password !== '';
  const isFormValid = hasUpperCase && hasNumber && hasSymbol && hasMinLength && passwordsMatch;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert("Gabim: " + error.message);
    } else {
      alert("Fjalëkalimi u ndryshua me sukses!");
      setPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={36} strokeWidth={2.5} />
            Siguria
          </h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1 ml-12">
            Menaxho fjalëkalimin dhe sesionet aktive
          </p>
        </header>

        <div className="space-y-8">
          {/* Change Password Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <div className="relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">Fjalëkalimi i Ri</label>
                <input 
                  type={showPass ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold transition-all"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 bottom-4 text-gray-400 hover:text-blue-600">
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">Konfirmo Fjalëkalimin</label>
                <input 
                  type={showConfirm ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold transition-all"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 bottom-4 text-gray-400 hover:text-blue-600">
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-2 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kërkesat:</p>
                <Rule checked={hasMinLength} text="Së paku 8 karaktere" />
                <Rule checked={hasUpperCase} text="Një shkronjë të madhe" />
                <Rule checked={hasNumber} text="Një numër" />
                <Rule checked={hasSymbol} text="Një simbol special (!@#$)" />
                <Rule checked={passwordsMatch} text="Fjalëkalimet përputhen" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={!isFormValid || saving}
              className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all ${
                isFormValid ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {saving ? 'Duke u ruajtur...' : 'Përditëso Fjalëkalimin'}
            </button>
          </form>

          {/* Active Sessions Section */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Monitor size={18} className="text-blue-600" /> Sesioni Aktual
            </h3>
            
            {sessionInfo ? (
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-blue-900 uppercase">Pajisja juaj aktuale</p>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase">
                         <Clock size={12} /> Hyrja e fundit: {new Date(sessionInfo.user.last_sign_in_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>
                </div>
                <span className="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                  Aktiv tani
                </span>
              </div>
            ) : (
              <p className="text-gray-400 text-xs font-bold italic">Duke ngarkuar të dhënat e sesionit...</p>
            )}

            <p className="mt-6 text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-tight">
              Për siguri, nëse shihni aktivitet të dyshimtë, ndryshoni menjëherë fjalëkalimin tuaj. 
              Kjo do të detyrojë të gjitha pajisjet e tjera të kërkojnë hyrje të re.
            </p>
          </div>
        </div>
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