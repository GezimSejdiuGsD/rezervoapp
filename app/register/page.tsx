"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [showTooltip, setShowTooltip] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    slug: '',
    phone_number: '',
    country: 'Kosovë',
    city: '',
    email: '',
    password: '',
    confirmPassword: '',
    start_time: '10:00',
    end_time: '19:00',
    slot_duration: 30,
    closed_days: [0],
    services: [{ name: '', price: '' }] 
  });

  // --- SERVICE HELPERS ---
  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: '', price: '' }]
    });
  };

  const updateService = (index: number, field: 'name' | 'price', value: string) => {
    const newServices = [...formData.services];
    // @ts-ignore
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const removeService = (index: number) => {
    if (formData.services.length > 1) {
      setFormData({
        ...formData,
        services: formData.services.filter((_, i) => i !== index)
      });
    }
  };

  // Password Validation Logic
  const checks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    symbol: /[^A-Za-z0-9]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.confirmPassword !== ''
  };

  const isPasswordValid = checks.length && checks.uppercase && checks.number && checks.symbol;
  const canSubmit = isPasswordValid && checks.match && slugStatus === 'available' && !loading;

  // --- SLUG REALTIME CHECK ---
  useEffect(() => {
    const checkSlug = async () => {
      if (formData.slug.length < 3) {
        setSlugStatus('idle');
        return;
      }
      setSlugStatus('checking');
      const { data, error } = await supabase
        .from('profiles')
        .select('slug')
        .eq('slug', formData.slug.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error("Error checking slug:", error.message);
        setSlugStatus('idle');
        return;
      }
      setSlugStatus(data ? 'taken' : 'available');
    };
    const timeoutId = setTimeout(checkSlug, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.slug]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          business_name: formData.business_name,
          slug: formData.slug.toLowerCase(),
          phone_number: formData.phone_number,
          country: formData.country,
          city: formData.city
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (authError) {
      alert("Gabim: " + authError.message);
    } else if (authData.user) {
      // --- SAVE SERVICES ---
      const servicesToInsert = formData.services
        .filter(s => s.name.trim() !== '')
        .map(s => ({
          profile_id: authData.user?.id,
          name: s.name,
          price: parseFloat(s.price) || 0
        }));

      if (servicesToInsert.length > 0) {
        const { error: servicesError } = await supabase
          .from('services')
          .insert(servicesToInsert);
        
        if (servicesError) console.error("Error saving services:", servicesError);
      }

      alert("Llogaria u krijua me sukses! Kontrolloni email-in tuaj për verifikim.");
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-xl w-full rounded-[2rem] shadow-2xl p-8 border border-gray-100 my-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Krijo Llogarinë</h1>
          <p className="text-gray-500 mt-2 font-medium">Plotësoni të dhënat për biznesin tuaj</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Business Name */}
            <div className="md:col-span-2">
              <label className="label-style">Emri i Biznesit</label>
              <input type="text" placeholder="Emri i Biznesit" required className="input-field" 
                onChange={e => setFormData({...formData, business_name: e.target.value})} />
            </div>

           {/* Slug */}
            <div className="md:col-span-2 relative">
              <div className="flex items-center justify-between ml-2 mb-1">
                <label className="label-style !mb-0">Linku Unik (Slug)</label>
                {slugStatus === 'checking' && <span className="text-[10px] text-blue-500 font-bold animate-pulse uppercase">Duke kontrolluar...</span>}
                {slugStatus === 'available' && <span className="text-[10px] text-green-500 font-bold uppercase">✓ I lirë</span>}
                {slugStatus === 'taken' && <span className="text-[10px] text-red-500 font-bold uppercase">✗ Ky link është i zënë</span>}
              </div>
              <input 
                type="text" 
                placeholder="psh: barber_kosove" 
                required 
                className={`input-field lowercase transition-all ${
                  slugStatus === 'taken' ? 'border-red-500 bg-red-50' : 
                  slugStatus === 'available' ? 'border-green-500 bg-green-50' : ''
                }`} 
                value={formData.slug}
                onChange={e => {
                  const formattedSlug = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-')       // Turn spaces into hyphens
                    .replace(/[^a-z0-9\-_]/g, ''); // Allow letters, numbers, hyphens, and underscores
                  setFormData({...formData, slug: formattedSlug});
                }}
              />
              <p className="text-[11px] font-bold text-gray-400 mt-1 ml-2">
                URL: <span className={`${slugStatus === 'taken' ? 'text-red-500' : 'text-blue-500'} font-mono`}>
                  rezervo.com/{formData.slug || '...'}
                </span>
              </p>
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <label className="label-style">Numri i Telefonit (WhatsApp)</label>
              <input type="tel" placeholder="+383 49 123 456" required className="input-field" 
                onChange={e => setFormData({...formData, phone_number: e.target.value})} />
            </div>

            {/* Country/City */}
            <div>
              <label className="label-style">Shteti</label>
              <select className="input-field" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value, city: ''})}>
                {Object.keys(locationData).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-style">Qyteti</label>
              <select className="input-field" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                <option value="">Zgjidh...</option>
                {locationData[formData.country].map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            {/* --- ADDED SERVICES SECTION --- */}
            <div className="md:col-span-2 mt-4">
              <label className="label-style">Shërbimet & Çmimet</label>
              <div className="space-y-3">
                {formData.services.map((service, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-grow">
                      <input 
                        type="text" 
                        placeholder="Emri i shërbimit (psh: Vizitë dentare, prerje flokësh etj)" 
                        className="input-field" 
                        required
                        value={service.name}
                        onChange={e => updateService(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <input 
                        type="number" 
                        placeholder="Çmimi" 
                        className="input-field" 
                        required
                        value={service.price}
                        onChange={e => updateService(index, 'price', e.target.value)}
                      />
                    </div>
                    {formData.services.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeService(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition mt-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={addService}
                className="mt-3 ml-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                + Shto shërbim tjetër
              </button>
            </div>

            {/* Auth */}
            <div className="md:col-span-2">
              <label className="label-style">Email-i</label>
              <input type="email" placeholder="biznesi@email.com" required className="input-field" 
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            {/* Password Validation UI */}
            <div className="md:col-span-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-style">Fjalëkalimi</label>
                  <input type="password" placeholder="••••••••" required className="input-field" 
                    onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div>
                  <label className="label-style">Konfirmo Fjalëkalimin</label>
                  <input type="password" placeholder="••••••••" required 
                    className={`input-field ${formData.confirmPassword && !checks.match ? 'border-red-500' : ''}`}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-2 gap-2">
                <p className={`text-[10px] font-bold flex items-center gap-1 ${checks.length ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.length ? '✓' : '○'} 8+ Karaktere
                </p>
                <p className={`text-[10px] font-bold flex items-center gap-1 ${checks.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.uppercase ? '✓' : '○'} Shkronjë e madhe
                </p>
                <p className={`text-[10px] font-bold flex items-center gap-1 ${checks.number ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.number ? '✓' : '○'} Një Numër
                </p>
                <p className={`text-[10px] font-bold flex items-center gap-1 ${checks.symbol ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.symbol ? '✓' : '○'} Simbol (@#$%!)
                </p>
                <p className={`text-[10px] font-bold col-span-2 flex items-center gap-1 ${checks.match ? 'text-green-500' : 'text-gray-400'}`}>
                  {checks.match ? '✓' : '○'} Fjalëkalimet përputhen
                </p>
              </div>
            </div>
          </div>

          <button 
            disabled={!canSubmit}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition disabled:opacity-30 disabled:grayscale shadow-xl shadow-blue-100 mt-4"
          >
            {loading ? "Duke u procesuar..." : "Rregjistrohu"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs font-bold mt-8 uppercase tracking-tighter">
          Keni llogari? <Link href="/login" className="text-blue-600 hover:underline ml-1">Kyçu këtu</Link>
        </p>
      </div>

      <style jsx>{`
        .label-style {
          font-size: 0.7rem;
          font-weight: 800;
          color: #6b7280;
          text-transform: uppercase;
          margin-left: 0.5rem;
          margin-bottom: 0.25rem;
          display: block;
        }
        .input-field {
          width: 100%;
          padding: 0.9rem 1.25rem;
          border-radius: 1rem;
          border: 1px solid #f1f1f1;
          outline: none;
          font-size: 1rem;
          font-weight: 600;
          background-color: #ffffff;
          color: #111827;
          transition: all 0.2s ease-in-out;
          appearance: none;
        }
        .input-field:focus {
          border-color: #2563eb;
          background-color: white;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </div>
  );
}