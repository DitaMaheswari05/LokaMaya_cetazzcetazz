"use client";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string, email?: string } | null>(null);
  const [locationName, setLocationName] = useState<string>('Meminta lokasi...');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setIsDropdownOpen(false);
      router.push('/login');
    }
  };

  const requestLocation = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocationName('Tidak didukung');
      return;
    }

    setLocationName('Mencari lokasi...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
          const data = await response.json();
          const city = data.city || data.locality || data.principalSubdivision || 'Lokasi Ditemukan';
          setLocationName(city);
        } catch (error) {
          console.error("Error fetching location:", error);
          setLocationName('Gagal memuat');
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationName('Lokasi ditolak');
        } else {
          setLocationName('Gagal mendapat lokasi');
        }
      }
    );
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
          const data = await response.json();
          const city = data.city || data.locality || data.principalSubdivision || 'Lokasi Ditemukan';
          setLocationName(city);
        } catch (error) {
          console.error("Error fetching location:", error);
          setLocationName('Gagal memuat');
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationName('Lokasi ditolak');
        } else {
          setLocationName('Gagal mendapat lokasi');
        }
      }
    );
  }, []);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const names = name.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="w-full h-[60px] bg-white border-b border-[#E2E2EF] flex items-center justify-between px-4 md:px-8 shadow-[0px_1px_3px_rgba(45,42,112,0.06)] z-50 flex-shrink-0">
      <div className="flex items-center gap-8 h-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[34px] h-[34px] bg-[#2D2A70] rounded-[10px] flex items-center justify-center p-1">
            <Image
              src="/lokamaya_logo.png"
              alt="LokaMaya Logo"
              width={24}
              height={24}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <span className="text-[16px] font-bold text-[#1A1832] tracking-tight">Lokamaya</span>
        </Link>

        <div className="hidden md:flex h-full items-center gap-2">
          <Link href="/peta-simulasi" className={`h-full flex items-center px-4 relative ${pathname === '/peta-simulasi' ? 'text-[#2D2A70] font-semibold' : 'text-[#6B6B8F] font-medium'}`}>
            <span className="text-[14px]">Peta Simulasi</span>
            {pathname === '/peta-simulasi' && (
              <div className="absolute bottom-0 left-4 right-4 h-[2.5px] bg-[#ED6B23] rounded-t-sm"></div>
            )}
          </Link>
          <Link href="/metodologi" className={`h-full flex items-center px-4 relative ${pathname === '/metodologi' ? 'text-[#2D2A70] font-semibold' : 'text-[#6B6B8F] font-medium'}`}>
            <span className="text-[14px]">Metodologi</span>
            {pathname === '/metodologi' && (
              <div className="absolute bottom-0 left-4 right-4 h-[2.5px] bg-[#ED6B23] rounded-t-sm"></div>
            )}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={requestLocation}
          className="hidden md:flex bg-[#F0F0F6] rounded-lg px-3.5 py-1.5 hover:bg-[#E2E2EF] transition-colors cursor-pointer"
          title="Perbarui Lokasi"
        >
          <span className="text-[13px] font-medium text-[#4B4B6F] flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B6B8F]">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {locationName}
          </span>
        </button>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-[34px] h-[34px] bg-[#2D2A70] rounded-full flex items-center justify-center text-white text-[12px] font-bold cursor-pointer hover:bg-[#3d3a8a] transition-colors focus:outline-none"
            title={user?.name || user?.email || 'User Profile'}
          >
            {getInitials(user?.name, user?.email)}
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-[0px_4px_12px_rgba(45,42,112,0.1)] border border-[#E2E2EF] py-1 z-50">
              <div className="px-4 py-2 border-b border-[#E2E2EF]">
                <p className="text-[13px] font-semibold text-[#1A1832] truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-[#6B6B8F] truncate">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-[13px] font-medium text-[#D14343] hover:bg-[#FFF5F5] transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
