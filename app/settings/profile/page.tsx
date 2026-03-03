"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import GlobalNavbar from '@/components/GlobalNavbar';

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    business_name: '',
    phone_number: '',
    slug: '', // Added slug to state
  });

  useEffect(() => {
    async function fetchProfile() {
      // 1. Get the current session user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Fetch all columns including 'slug'
        const { data, error } = await supabase
          .from('profiles')
          .select('business_name, phone_number, slug')
          .eq('id', user.id)
          .single();
        
        // 3. Prefill the state with the returned data
        if (data) {
          setProfile({
            business_name: data.business_name || '',
            phone_number: data.phone_number || '',
            slug: data.slug || '',
          });
        }
        if (error) console.error("Error fetching profile:", error);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Updates the table with the current state values
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user?.id);

    if (error) {
      alert("Gabim: " + error.message);
    } else {
      alert("Profili u përditësua me sukses!");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">Duke ngarkuar...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavbar />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Cilësimet e Profilit</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Ndrysho të dhënat aktuale</p>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            
            {/* Slug Field - Prefilled */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">
                Linku i Biznesit (Slug)
              </label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  app.com/
                </span>
                <input 
                  type="text" 
                  value={profile.slug}
                  // This helper formats the slug as they type (lowercase, no spaces)
                  onChange={(e) => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                  className="w-full p-4 pl-20 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold transition-all"
                  placeholder="emri-i-biznesit"
                  required
                />
              </div>
            </div>

            {/* Business Name - Prefilled */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">
                Emri i Biznesit
              </label>
              <input 
                type="text" 
                value={profile.business_name}
                onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold transition-all"
                placeholder="Emri i biznesit tuaj"
                required
              />
            </div>

            {/* Phone Number - Prefilled */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">
                Numri i Telefonit
              </label>
              <input 
                type="text" 
                value={profile.phone_number}
                onChange={(e) => setProfile({...profile, phone_number: e.target.value})}
                className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold transition-all"
                placeholder="+383..."
                required
              />
            </div>

            {/* Category - Prefilled */}
            {/* <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">
                Kategoria
              </label>
              <select 
                value={profile.category}
                onChange={(e) => setProfile({...profile, category: e.target.value})}
                className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none font-bold transition-all"
              >
                <option value="">Zgjidh Kategorinë</option>
                <option value="Barber">Barber</option>
                <option value="Beauty">Beauty & Spa</option>
                <option value="Dentist">Dentist</option>
                <option value="Tattoo">Tattoo Artist</option>
                <option value="Other">Tjetër</option>
              </select>
            </div> */}
          </div>

          <button 
            type="submit"
            disabled={saving}
            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Duke u ruajtur...' : 'Ruaj Ndryshimet'}
          </button>
        </form>
      </div>
    </div>
  );
}