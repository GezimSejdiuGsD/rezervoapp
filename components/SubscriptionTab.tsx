"use client";

import { useState } from 'react';

// --- ADD THIS BLOCK HERE (The computer needs to read this first) ---
const calculateDaysLeft = (expiryDate: string | null) => {
  if (!expiryDate) return 0;
  const now = new Date();
  const end = new Date(expiryDate);
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};
// ------------------------------------------------------------------

export default function SubscriptionTab({ profile }: { profile: any }) {
  // Now it will find the name correctly
  const daysLeft = calculateDaysLeft(profile?.subscription_end);
  const isActive = profile?.subscription_status === 'active' && daysLeft > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Statusi i Abonimit</h2>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Menaxho planet dhe faturimin</p>
          </div>
          <div className={`px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isActive ? 'Aktiv' : 'Jo Aktiv'}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ditë të mbetura</p>
            <h3 className={`text-5xl font-black tracking-tighter ${daysLeft < 5 ? 'text-red-500' : 'text-gray-900'}`}>
              {daysLeft}
            </h3>
            <p className="text-xs font-bold text-gray-500 mt-2 italic">
              Skadon më: {profile?.subscription_end ? new Date(profile.subscription_end).toLocaleDateString('sq-AL') : 'Nuk ka datë'}
            </p>
          </div>

          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
            <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-2">Plani Aktual</p>
            <h3 className="text-3xl font-black tracking-tight uppercase">
              {profile?.plan_type === 'yearly' ? 'Vjetor' : 'Mujor'}
            </h3>
            <p className="text-xs font-bold mt-2 opacity-90">
              {profile?.plan_type === 'yearly' ? '100€ / vit' : '10€ / muaj'}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PricingCard 
          title="Mujore" 
          price="10€" 
          description="Pagesë çdo muaj për fleksibilitet maksimal."
          onSelect={() => {/* Integrate Stripe Monthly */}}
        />
        <PricingCard 
          title="Vjetore" 
          price="100€" 
          description="Kurseni 20€ në vit me planin tonë vjetor."
          onSelect={() => {/* Integrate Stripe Yearly */}}
          highlight={true}
        />
      </div>
    </div>
  );
}

function PricingCard({ title, price, description, onSelect, highlight = false }: any) {
  return (
    <div className={`p-8 rounded-[2.5rem] border-2 transition-all hover:scale-[1.02] ${highlight ? 'border-blue-600 bg-white shadow-2xl' : 'border-gray-100 bg-white'}`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-black text-xl uppercase tracking-tight">{title}</h4>
        {highlight && <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Më i Populluari</span>}
      </div>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-4xl font-black tracking-tighter">{price}</span>
        <span className="text-gray-400 font-bold text-sm">/ {title === 'Vjetore' ? 'vit' : 'muaj'}</span>
      </div>
      <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">{description}</p>
      <button onClick={onSelect} className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition ${highlight ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
        Rinovoni Tani
      </button>
    </div>
  );
}