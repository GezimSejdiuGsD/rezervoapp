"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import GlobalNavbar from '@/components/GlobalNavbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, appointments: 0, earnings: 0 });
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- 1. SEARCH LOGIC (Filters in real-time) ---
  const filteredBusinesses = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return businesses.filter(biz => 
      biz.business_name?.toLowerCase().includes(lowerSearch) ||
      biz.slug?.toLowerCase().includes(lowerSearch) ||
      biz.phone_number?.includes(searchTerm) ||
      biz.email?.toLowerCase().includes(lowerSearch)
    );
  }, [businesses, searchTerm]);

  // --- 2. EXPORT PDF LOGIC ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Raporti i Bizneseve', 14, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [['Biznesi', 'Slug', 'WhatsApp', 'Statusi', 'Data Skadimit']],
      body: filteredBusinesses.map(b => [
        b.business_name, 
        `/${b.slug}`, 
        b.phone_number, 
        (b.subscription_end && new Date(b.subscription_end) > new Date()) ? 'Aktiv' : 'Jo Aktiv',
        b.subscription_end ? new Date(b.subscription_end).toLocaleDateString('sq-AL') : 'Pa datë'
      ]),
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`Bizneset_${new Date().getTime()}.pdf`);
    setShowExport(false);
  };

  // --- 3. EXPORT EXCEL (CSV Format) ---
  const exportExcel = () => {
    const headers = ['Emri i Biznesit,Slug,WhatsApp,Statusi,Skadimi'];
    const rows = filteredBusinesses.map(b => 
      `${b.business_name},/${b.slug},${b.phone_number},${(b.subscription_end && new Date(b.subscription_end) > new Date()) ? 'Aktiv' : 'Jo Aktiv'},${b.subscription_end || 'Pa date'}`
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bizneset_Export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    setShowExport(false);
  };

  // --- 4. DATA FETCHING & AUTH ---
  useEffect(() => {
    async function checkAdminAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (!user || profile?.role !== 'admin') {
        router.push('/dashboard'); 
        return;
      }

      const { data: allProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (profileError) console.error("Fetch Error:", profileError.message);

      const { data: allApts } = await supabase.from('appointments').select('*, services(price)');
      const totalEarnings = allApts?.reduce((sum, a) => sum + (a.services?.price || 0), 0);

      setBusinesses(allProfiles || []);
      setStats({ 
        users: allProfiles?.length || 0,
        appointments: allApts?.length || 0,
        earnings: totalEarnings || 0
      });
      setLoading(false);
    }
    checkAdminAndFetch();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-blue-600 animate-pulse uppercase tracking-widest">
      Verifikimi i autoritetit...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavbar />

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <header className="mb-10 pt-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Admin Control Panel</h1>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Global System Overview</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder="Kërko biznesin, slug ose nr..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-4 focus:ring-blue-50 outline-none font-bold text-sm transition-all"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowExport(!showExport)}
                className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center gap-2"
              >
                Eksporto
                <svg className={`w-4 h-4 transition ${showExport ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {showExport && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button onClick={exportExcel} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 text-gray-700 flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Excel (CSV)
                  </button>
                  <button onClick={exportPDF} className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 text-gray-700 flex items-center gap-3 border-t border-gray-50">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span> PDF Raport
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="Total Biznese" value={stats.users} color="blue" />
          <StatCard title="Termine Totale" value={stats.appointments} color="green" />
          <StatCard title="Fitimi i Platformës" value={`${stats.earnings}€`} color="amber" />
        </div>

        {/* Business Management Table */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-black text-xl text-gray-800 uppercase tracking-tight">Bizneset e Regjistruara ({filteredBusinesses.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                <tr>
                  <th className="px-8 py-4">Emri i Biznesit / Email</th>
                  <th className="px-8 py-4">Slug / Link</th>
                  <th className="px-8 py-4 text-center">WhatsApp</th>
                  <th className="px-8 py-4 text-center">Statusi Pajtimit</th>
                  <th className="px-8 py-4 text-right">Veprime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBusinesses.map((biz) => {
                  const isDateActive = biz.subscription_end ? new Date(biz.subscription_end) > new Date() : false;

                  return (
                    <tr key={biz.id} className="hover:bg-gray-50 transition group">
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900">{biz.business_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{biz.email}</p>
                      </td>
                      <td className="px-8 py-6 text-blue-500 font-bold text-sm italic">/{biz.slug}</td>
                      <td className="px-8 py-6 text-center text-sm font-medium text-gray-600 font-mono">{biz.phone_number}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isDateActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isDateActive ? 'Aktiv' : 'Jo Aktiv'}
                        </span>
                        {biz.subscription_end && (
                          <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Mbaron: {new Date(biz.subscription_end).toLocaleDateString()}</p>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <button 
                            onClick={() => router.push(`/admin/profiles/${biz.id}`)}
                            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition shadow-sm"
                          >
                            Detajet
                          </button>
                          <button className="text-red-300 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition px-2">
                            Fshij
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBusinesses.length === 0 && (
               <div className="p-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Nuk u gjet asnjë rezultat për kërkimin tuaj</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = { 
    blue: 'bg-blue-600 shadow-blue-100', 
    green: 'bg-emerald-600 shadow-emerald-100', 
    amber: 'bg-amber-500 shadow-amber-100' 
  };
  return (
    <div className={`${colors[color]} p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden`}>
      <div className="relative z-10">
        <p className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-5xl font-black mt-2 tracking-tighter">{value}</h3>
      </div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );
}