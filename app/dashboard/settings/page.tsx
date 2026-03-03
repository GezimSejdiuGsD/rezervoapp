"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import GlobalNavbar from '@/components/GlobalNavbar';
import DashboardNav from '@/components/DashboardNav';

interface Profile {
  business_name: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
  closed_days: number[]; 
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [exceptionDate, setExceptionDate] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [specialStart, setSpecialStart] = useState('09:00');
  const [specialEnd, setSpecialEnd] = useState('17:00');
  const [savingException, setSavingException] = useState(false);
  const [exceptions, setExceptions] = useState<any[]>([]);

  const [profile, setProfile] = useState<Profile>({
    business_name: '',
    start_time: '10:00',
    end_time: '19:00',
    slot_duration: 30,
    closed_days: [] 
  });

  const router = useRouter();

  const daysOfWeek = [
    { id: 1, name: 'Hënë' },
    { id: 2, name: 'Martë' },
    { id: 3, name: 'Mërkurë' },
    { id: 4, name: 'Enjte' },
    { id: 5, name: 'Premte' },
    { id: 6, name: 'Shtunë' },
    { id: 0, name: 'Diell' },
  ];

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profData) {
        setProfile({
          ...profData,
          closed_days: profData.closed_days || []
        });
      }

      fetchExceptions();
      setLoading(false);
    }
    fetchData();
  }, [router]);

  const fetchExceptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('profile_id', user?.id)
      .order('date', { ascending: true });
    setExceptions(data || []);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        business_name: profile.business_name,
        start_time: profile.start_time,
        end_time: profile.end_time,
        slot_duration: Number(profile.slot_duration),
        closed_days: profile.closed_days,
      })
      .eq('id', user.id);

    if (profileError) {
      alert("Gabim: " + profileError.message);
    } else {
      alert("Cilësimet u përditësuan!");
    }
    setUpdating(false);
  };

  const saveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionDate) return alert("Ju lutem zgjidhni një datë.");
    
    setSavingException(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('availability_exceptions')
      .upsert({
        profile_id: user?.id,
        date: exceptionDate,
        is_closed: isClosed,
        start_time: isClosed ? null : specialStart,
        end_time: isClosed ? null : specialEnd
      });

    if (error) {
      alert("Gabim: " + error.message);
    } else {
      setExceptionDate('');
      fetchExceptions();
    }
    setSavingException(false);
  };

  const deleteException = async (id: string) => {
    const { error } = await supabase.from('availability_exceptions').delete().eq('id', id);
    if (!error) fetchExceptions();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-black text-blue-600 uppercase tracking-widest animate-pulse">
      Duke u ngarkuar...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavbar />

      <div className="max-w-3xl mx-auto px-6 pb-20">
        <DashboardNav />

        <header className="my-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Cilësimet e Biznesit</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Menaxho orarin dhe parametrat e punës</p>
        </header>
        
        <div className="space-y-10">
          {/* SECTION 1: GENERAL SETTINGS */}
          <form onSubmit={handleUpdate} className="space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Orari i rregullt</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">Emri i Biznesit</label>
                <input 
                  type="text" 
                  value={profile.business_name}
                  className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition"
                  onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">Hapet në</label>
                  <input 
                    type="time" 
                    value={profile.start_time}
                    className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black"
                    onChange={(e) => setProfile({...profile, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">Mbyllet në</label>
                  <input 
                    type="time" 
                    value={profile.end_time}
                    className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black"
                    onChange={(e) => setProfile({...profile, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">Kohëzgjatja (Minuta)</label>
                <select 
                  value={profile.slot_duration}
                  className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  onChange={(e) => setProfile({...profile, slot_duration: parseInt(e.target.value)})}
                >
                  {[15, 30, 45, 60].map(m => <option key={m} value={m}>{m} minuta</option>)}
                </select>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <label className="block text-[10px] font-black uppercase tracking-widest mb-4 text-gray-400">Ditët e Mbyllura (Çdo javë)</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = profile.closed_days?.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          const dayId = Number(day.id); 
                          let newClosedDays = [...(profile.closed_days || [])];
                          newClosedDays = newClosedDays.includes(dayId) 
                            ? newClosedDays.filter(d => d !== dayId) 
                            : [...newClosedDays, dayId];
                          setProfile({ ...profile, closed_days: newClosedDays });
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${
                          isSelected 
                          ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {day.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button 
              disabled={updating}
              className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-700 transition shadow-xl shadow-blue-100 disabled:opacity-50"
            >
              {updating ? 'Duke i ruajtur...' : 'Ruaj Ndryshimet'}
            </button>
          </form>

          {/* SECTION 2: SPECIFIC DATE EXCEPTIONS */}
          <section className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Pushimet & Përjashtimet</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Shto ditë specifike kur jeni mbyllur</p>
            </div>

            <form onSubmit={saveException} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400">Zgjidhni Datën</label>
                  <input 
                    type="date" 
                    required
                    value={exceptionDate}
                    className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 font-black outline-none focus:ring-2 focus:ring-blue-500 transition"
                    onChange={(e) => setExceptionDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-4 cursor-pointer group bg-gray-50 p-4 rounded-2xl w-full border border-gray-100 transition hover:bg-gray-100/50">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={isClosed}
                      onChange={(e) => setIsClosed(e.target.checked)}
                    />
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Mbyllur Tërë Ditën</span>
                  </label>
                </div>
              </div>

              {!isClosed && (
                <div className="grid grid-cols-2 gap-6 bg-blue-50/30 p-6 rounded-2xl border border-dashed border-blue-100">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-blue-400">Hapja Specifike</label>
                    <input 
                      type="time" 
                      value={specialStart}
                      className="w-full p-4 border border-white rounded-xl font-black"
                      onChange={(e) => setSpecialStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-blue-400">Mbyllja Specifike</label>
                    <input 
                      type="time" 
                      value={specialEnd}
                      className="w-full p-4 border border-white rounded-xl font-black"
                      onChange={(e) => setSpecialEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button 
                disabled={savingException}
                className="w-full bg-gray-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition shadow-xl disabled:opacity-50"
              >
                {savingException ? 'Duke ruajtur...' : 'Shto Përjashtimin'}
              </button>
            </form>

            {/* LIST OF EXCEPTIONS */}
            {exceptions.length > 0 && (
              <div className="mt-12 space-y-3">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Lista e Përjashtimeve</h3>
                {exceptions.map((ex) => (
                  <div key={ex.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <div>
                      <span className="font-black text-gray-900">{new Date(ex.date).toLocaleDateString('sq-AL', {day: '2-digit', month: 'long', year: 'numeric'})}</span>
                      {ex.is_closed ? 
                        <span className="ml-3 text-red-600 text-[10px] font-black uppercase bg-red-50 px-3 py-1 rounded-full">Pushim</span> : 
                        <span className="ml-3 text-blue-600 text-[10px] font-black uppercase bg-blue-50 px-3 py-1 rounded-full">{ex.start_time.slice(0,5)} — {ex.end_time.slice(0,5)}</span>
                      }
                    </div>
                    <button 
                      onClick={() => deleteException(ex.id)}
                      className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}