"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GlobalNavbar from '@/components/GlobalNavbar';

export default function AdminProfileDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(data);
    setLoading(false);
  }

  async function grantFreeSubscription() {
    setUpdating(true);
    
    // Calculate new date: Start from current expiry OR from today if already expired
    const currentExpiry = profile.subscription_end ? new Date(profile.subscription_end) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + daysToAdd);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_end: newExpiry.toISOString(),
        subscription_status: 'active' 
      })
      .eq('id', id);

    if (!error) {
      alert(`Iu shtuan ${daysToAdd} ditë me sukses!`);
      fetchProfile();
    }
    setUpdating(false);
  }

  if (loading) return <div className="p-20 text-center font-black uppercase animate-pulse">Duke ngarkuar...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        
        {/* Profile Info Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">{profile.business_name || 'Pa Emër'}</h1>
          <p className="text-gray-500 font-bold">{profile.email}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase">Statusi</p>
              <p className="font-bold uppercase text-sm">{profile.subscription_status}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase">Skadon më</p>
              <p className="font-bold text-sm">{profile.subscription_end ? new Date(profile.subscription_end).toLocaleDateString('sq-AL') : 'Asnjëherë'}</p>
            </div>
          </div>
        </div>

        {/* Admin Action: Grant Subscription */}
        <div className="bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-4 text-center">Dhuroni Pajtim Falas</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-4">
              <input 
                type="number" 
                value={daysToAdd} 
                onChange={(e) => setDaysToAdd(parseInt(e.target.value))}
                className="w-32 p-4 rounded-2xl border-none font-black text-center text-xl shadow-inner outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="font-black text-blue-900 uppercase">Ditë</span>
            </div>

            <button 
              onClick={grantFreeSubscription}
              disabled={updating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-blue-200 transition-all disabled:opacity-50"
            >
              {updating ? 'Duke u përditësuar...' : 'Konfirmo Dhuratën'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}