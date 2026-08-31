"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EyeOff, Eye, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Semua field harus diisi');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // PENTING: Kirim dan terima HttpOnly cookie
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mendaftar');
      }

      // Token sekarang disimpan otomatis di HttpOnly cookie oleh backend.
      // Kita tidak perlu menyimpannya di localStorage lagi.

      // Redirect ke halaman login atau beranda
      router.push('/login?registered=true');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* Left side with Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-primary">
        <Image 
          src="/login.png" 
          alt="LokaMaya Background" 
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side with Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[420px] flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="flex items-center gap-2 mb-2">
              <Image 
                src="/lokamaya_logo.png" 
                alt="LokaMaya Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
              <span className="text-[20px] font-bold text-primary tracking-tight">Lokamaya</span>
            </div>
            
            <h1 className="text-[26px] font-bold text-text-dark tracking-[-0.4px]">
              Buat akun baru
            </h1>
            <p className="text-[13px] text-text-gray">
              Daftar akun Lokamaya untuk memulai analisis Anda.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#4B4B6F]">
                Username
              </label>
              <div className="flex items-center gap-2.5 px-[14px] py-[12px] bg-white border border-border-light rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <User className="w-4 h-4 text-[#C7C7DF]" />
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="w-full text-[13px] text-text-dark placeholder:text-[#1A1832]/50 bg-transparent outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#4B4B6F]">
                Email
              </label>
              <div className="flex items-center gap-2.5 px-[14px] py-[12px] bg-white border border-border-light rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Mail className="w-4 h-4 text-[#C7C7DF]" />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@example.com"
                  className="w-full text-[13px] text-text-dark placeholder:text-[#1A1832]/50 bg-transparent outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#4B4B6F]">
                Password
              </label>
              <div className="flex items-center gap-2.5 px-[14px] py-[12px] bg-white border border-border-light rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Lock className="w-4 h-4 text-[#C7C7DF]" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full text-[13px] text-text-dark placeholder:text-[#1A1832]/50 bg-transparent outline-none"
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#C7C7DF] hover:text-text-gray transition-colors"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#4B4B6F]">
                Konfirmasi Password
              </label>
              <div className="flex items-center gap-2.5 px-[14px] py-[12px] bg-white border border-border-light rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Lock className="w-4 h-4 text-[#C7C7DF]" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full text-[13px] text-text-dark placeholder:text-[#1A1832]/50 bg-transparent outline-none"
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[#C7C7DF] hover:text-text-gray transition-colors"
                >
                  {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-2 py-[13px] flex items-center justify-center gap-2 bg-primary text-white text-[14px] font-semibold rounded-xl shadow-[0px_4px_20px_rgba(45,42,112,0.25)] hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                'Daftar'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-border-light"></div>
            <span className="text-[11px] text-[#9999BF]">atau daftar dengan</span>
            <div className="h-[1px] flex-1 bg-border-light"></div>
          </div>

          {/* Social Logins */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-border-light rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-[13px] font-medium text-[#4B4B6F]">Google</span>
            </button>
            <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-border-light rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 21 21">
                <path fill="#F25022" d="M10 0H0v10h10V0z"/>
                <path fill="#7FBA00" d="M21 0H11v10h10V0z"/>
                <path fill="#00A4EF" d="M10 11H0v10h10V11z"/>
                <path fill="#FFB900" d="M21 11H11v10h10V11z"/>
              </svg>
              <span className="text-[13px] font-medium text-[#4B4B6F]">Microsoft</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="text-[12px] text-[#9999BF]">Sudah punya akun?</span>
            <Link href="/login" className="text-[12px] font-semibold text-primary hover:underline">
              Masuk
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
