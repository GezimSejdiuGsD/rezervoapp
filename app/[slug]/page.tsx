import { supabase } from '@/lib/supabase';
import BookingForm from '@/components/BookingForm';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BusinessPage({ params }: Props) {
  
  // 1. Unwrap the URL parameters
  const { slug } = await params;

  // 2. Fetch the Business Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single();

  // If the slug doesn't exist, show 404
  if (profileError || !profile) {
    console.error("Database error or profile not found:", profileError);
    return notFound();
  }

  // 3. SUBSCRIPTION LOGIC CHECK
  // A business is active ONLY if status is 'active' AND the end date is in the future
  const isSubscribed = 
    profile.subscription_status === 'active' && 
    profile.subscription_end && 
    new Date(profile.subscription_end) > new Date();

  // If not subscribed, show the "Inactive" screen instead of the booking form
  if (!isSubscribed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">
            Profil Jo-Aktiv
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            Ky biznes nuk mund të pranojë rezervime për momentin për shkak të pajtimit të skaduar.
          </p>
          <div className="pt-6 border-t border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Rezervo.app Platform
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 4. Fetch Services
  // This code only runs if the business is successfully subscribed
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('profile_id', profile.id);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Business Header */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          Rezervim Online
        </div>
        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter uppercase">
          {profile.business_name}
        </h1>
        <p className="text-gray-500 font-bold text-sm italic">
          Zgjidhni shërbimin dhe caktoni terminin tuaj në pak sekonda.
        </p>
      </div>

      {/* Booking Component */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-900/5 p-2 border border-white">
          <BookingForm 
            key={`${profile.id}-${profile.slot_duration}`} 
            businessId={profile.id} 
            services={services || []} 
            startTime={profile.start_time}
            endTime={profile.end_time}
            slotDuration={Number(profile.slot_duration)}
            closedDays={profile.closed_days || []}
          />
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-16 text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
          Powered by <span className="text-blue-600">Rezervo.app</span>
        </p>
      </div>
    </main>
  );
}