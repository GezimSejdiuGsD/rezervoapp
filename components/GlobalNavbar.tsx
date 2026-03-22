"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Settings, Lock, LogOut, ChevronDown } from 'lucide-react'; // Added icons

export default function GlobalNavbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // State for dropdown
  const dropdownRef = useRef<HTMLDivElement>(null); // To detect outside clicks
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setUser(null);
          setFetching(false);
          return;
        }
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('business_name, role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileData) setProfile(profileData);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    getUserData();

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (fetching) return <div className="h-20 bg-white border-b border-gray-100 animate-pulse" />;
  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-100 mb-8 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Left Side */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-black tracking-tighter text-blue-600">
              REZERVO<span className="text-gray-900">.SHOP</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {profile?.role !== 'admin' ? (
                <>
                  <NavLink href="/dashboard" active={pathname === '/dashboard'}>FAQJA KRYESORE</NavLink>
                  {/* <NavLink href="/services" active={pathname === '/services'}>Shërbimet</NavLink> */}
                </>
              ) : (
                <NavLink href="/admin" active={pathname === '/admin'}>Admin Panel</NavLink>
              )}
            </div>
          </div>

          {/* Right Side: Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
            >
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-100">
                {profile?.business_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
              
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-gray-900 leading-none">
                  {profile?.business_name || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {profile?.role === 'admin' ? 'Administrator' : 'Partner'}
                </p>
              </div>

              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card */}
            {isOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-50 mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Llogaria</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                </div>

                <DropdownItem 
                  href="/settings/profile" 
                  icon={<User size={18} />} 
                  label="Përditëso Profilin" 
                  onClick={() => setIsOpen(false)}
                />
                <DropdownItem 
                  href="/settings/security" 
                  icon={<Lock size={18} />} 
                  label="Ndrysho Fjalëkalimin" 
                  onClick={() => setIsOpen(false)}
                />
                
                <div className="my-2 border-t border-gray-50 mx-4" />

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-6 py-3 text-red-500 hover:bg-red-50 transition-colors font-black uppercase text-[10px] tracking-widest"
                >
                  <LogOut size={18} />
                  Dil nga llogaria
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// --- Helper Components ---

function NavLink({ href, children, active }: { href: string, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
}

function DropdownItem({ href, icon, label, onClick }: { href: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors font-bold text-sm"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </Link>
  );
}