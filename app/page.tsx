"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Calendar, Zap, ShieldCheck, ArrowRight, Search, MapPin, ExternalLink, Globe } from 'lucide-react';

const locationData: Record<string, string[]> = {
  "Kosovë": [
    "Prishtinë", "Prizren", "Pejë", "Gjilan", "Gjakovë", "Mitrovicë", "Ferizaj", 
    "Vushtrri", "Podujevë", "Rahovec", "Fushë Kosovë", "Suharekë", "Kaçanik", 
    "Shtime", "Lipjan", "Obiliq", "Gllogoc (Drenas)", "Istog", "Klinë", "Skënderaj", 
    "Dragash", "Leposaviq", "Zveçan", "Zubin Potok", 
    "Junik", "Hani i Elezit", "Graçanicë", "Ranillug", "Partesh", "Kllokot", 
    "Malishevë", "Novobërdë", "Shtërpcë", "Viti", "Deçan", "Kamenicë"
  ],
  "Shqipëri": [
    "Tiranë", "Durrës", "Vlorë", "Shkodër", "Fier", "Korçë", "Elbasan", "Berat", 
    "Lushnjë", "Kavajë", "Pogradec", "Laç", "Gjirokastër", "Patos", "Krujë", 
    "Kuçovë", "Kukës", "Lezhë", "Sarandë", "Peshkopi", "Burrel", "Cërrik", 
    "Çorovodë", "Shijak", "Librazhd", "Tepelenë", "Gramsh", "Poliçan", "Bulqizë", 
    "Përmet", "Fushë-Arrëz", "Bajram Curri", "Rrëshen", "Koplik", "Peqin", 
    "Bilisht", "Krumë", "Libohovë", "Konispol", "Vorë", "Kamëz", "Himarë"
  ],
  "Maqedoni e Veriut": [
    "Shkup", "Tetovë", "Gostivar", "Kumanovë", "Strugë", "Ohër", "Prilep", 
    "Manastir (Bitola)", "Veles", "Shtip", "Strumicë", "Kavadar", "Kërçovë", 
    "Kriva Pallankë", "Radovish", "Gjevgjeli", "Dibër", "Sveti Nikollë", 
    "Probishtip", "Vinicë", "Dellçevë", "Resnjë", "Berovë", "Kratovë", 
    "Bogdancë", "Krushevë", "Makedonska Kamenica", "Vallandovë", "Demir Kapi", "Demir Hisar"
  ]
};

export default function HomePage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicBusinesses() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('business_name, slug, city, country, phone_number')
        .neq('role', 'admin')
        .neq('slug', '')
        .not('slug', 'is', null);
      
      if (error) {
        console.error("Error fetching businesses:", error);
      } else {
        console.log("Fetched businesses:", data); // Check your console to see if data arrives
        setBusinesses(data || []);
      }
      setLoading(false);
    }
    fetchPublicBusinesses();
  }, []);

  const filtered = businesses.filter(b => {
    // Normalize everything to lowercase for safe searching
    const name = b.business_name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = name.includes(search);
    
    // If no filter is selected, it should match everything
    const matchesCountry = countryFilter === '' || b.country === countryFilter;
    const matchesCity = cityFilter === '' || b.city === cityFilter;

    return matchesSearch && matchesCountry && matchesCity;
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-600">
      
      {/* 1. NAVIGATION */}
      <nav className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="text-2xl font-black tracking-tighter text-blue-600">
          REZERVO<span className="text-gray-900">.APP</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/login" className="text-sm font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition">Kyqu</Link>
          <Link href="/register" className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-600 transition shadow-xl shadow-gray-200">
            Fillo Tani
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-20 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">
          Platforma #1 në Rajon për Rezervime
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase">
          Gjej shërbimin <br />
          <span className="text-blue-600">që të duhet.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-gray-500 text-lg font-bold leading-relaxed mb-12">
          Rezervo.app ndihmon bizneset të automatizojnë takimet dhe të rrisin fitimet. Gjeni dhe rezervoni te bizneset më të mira në qytetin tuaj.
        </p>
      </section>

      {/* 3. BUSINESS DISCOVERY (SEARCH) */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="bg-gray-900 rounded-[3rem] p-6 md:p-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-4 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Emri i biznesit..." 
                className="w-full bg-gray-800 border-none rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <Globe className="absolute left-4 top-4 text-gray-500" size={18} />
              <select 
                className="w-full bg-gray-800 border-none rounded-2xl py-4 pl-12 pr-10 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                value={countryFilter}
                onChange={(e) => { setCountryFilter(e.target.value); setCityFilter(''); }}
              >
                <option value="">Shteti (Të gjitha)</option>
                {Object.keys(locationData).map(country => <option key={country} value={country}>{country}</option>)}
              </select>
            </div>

            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-gray-500" size={18} />
              <select 
                disabled={!countryFilter}
                className={`w-full bg-gray-800 border-none rounded-2xl py-4 pl-12 pr-10 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer ${!countryFilter ? 'opacity-30' : ''}`}
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">Qyteti (Të gjitha)</option>
                {countryFilter && locationData[countryFilter].map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-center bg-blue-600/10 border border-blue-500/20 rounded-2xl py-4">
              <p className="text-blue-400 font-black text-xs uppercase tracking-widest">{filtered.length} Rezultate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((biz) => (
              <Link key={biz.slug} href={`/${biz.slug}`} className="bg-gray-800 p-8 rounded-[2.5rem] hover:bg-blue-600 transition-all duration-300 group relative flex flex-col justify-between min-h-[180px]">
                <div>
                
                  <h3 className="text-white text-xl font-black mt-1">{biz.business_name}</h3>
                </div>
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors mt-4">
                  <MapPin size={14} />
                  <span className="text-xs font-bold">{biz.city}, {biz.country}</span>
                </div>
                <ExternalLink className="absolute right-8 top-8 text-gray-700 group-hover:text-white/40" size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID */}
      <section className="bg-gray-50 py-32 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Calendar className="text-blue-600" size={32} />}
              title="Rezervime 24/7"
              desc="Klientët tuaj mund të rezervojnë në çdo kohë, pa pasur nevojë të ju thërrasin në telefon."
            />
            <FeatureCard 
              icon={<Zap className="text-amber-500" size={32} />}
              title="Linku Juaj Personal"
              desc="Përfitoni një faqe unike si rezervo.app/emri-juaj për ta shpërndarë në Instagram."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-green-500" size={32} />}
              title="Kontroll Total"
              desc="Menaxhoni shërbimet, oraret dhe stafin tuaj nga një panel i vetëm administrativ."
            />
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-32 max-w-5xl mx-auto px-6">
        <h2 className="text-4xl font-black tracking-tighter text-center mb-20 uppercase">Si funksionon?</h2>
        <div className="space-y-24">
          <Step num="01" title="Krijo llogarinë" desc="Regjistroni biznesin tuaj në pak sekonda dhe shtoni shërbimet që ofroni." />
          <Step num="02" title="Shpërndaj linkun" desc="Vendosni linkun tuaj në biografinë e rrjeteve sociale që klientët t'ju gjejnë lehtësisht." />
          <Step num="03" title="Prano rezervime" desc="Merrni njoftime në kohë reale për çdo termin të ri dhe rritni performancën." />
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-2xl font-black tracking-tighter">REZERVO<span className="text-blue-500">.APP</span></div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <Link href="/terms" className="hover:text-white">Kushtet</Link>
            <Link href="/privacy" className="hover:text-white">Privatësia</Link>
            <Link href="/contact" className="hover:text-white">Kontakti</Link>
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">© 26/02/2026 Rezervo.app. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-50 hover:-translate-y-2 transition-transform duration-300">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-black mb-4 uppercase tracking-tight">{title}</h3>
      <p className="text-gray-500 font-bold text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }: any) {
  return (
    <div className="flex items-start gap-10 group">
      <span className="text-7xl font-black text-blue-100 group-hover:text-blue-600 transition-colors duration-500 leading-none">{num}</span>
      <div>
        <h4 className="text-2xl font-black mb-2 uppercase tracking-tight">{title}</h4>
        <p className="text-gray-500 font-bold max-w-md">{desc}</p>
      </div>
    </div>
  );
}