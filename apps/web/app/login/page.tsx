import Image from 'next/image';
import Link from 'next/link';
import { EyeOff, Mail, Lock } from 'lucide-react'; // we have lucide-react in package.json

export default function LoginPage() {
  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* Left side with Image - Hidden on mobile, visible on laptop (lg) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-primary">
        <Image 
          src="/login.png" 
          alt="LokaMaya Background" 
          fill
          className="object-cover"
          priority
        />
        {/* Optional overlay gradient if needed, though image might already have it */}
      </div>

      {/* Right side with Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[420px] flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            {/* Logo */}
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
              Selamat datang kembali
            </h1>
            <p className="text-[13px] text-text-gray">
              Masuk ke akun Lokamaya Anda untuk melanjutkan analisis.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-6">
            
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[#4B4B6F]">
                Email
              </label>
              <div className="flex items-center gap-2.5 px-[14px] py-[12px] bg-white border border-border-light rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Mail className="w-4 h-4 text-[#C7C7DF]" />
                <input 
                  type="email" 
                  placeholder="nama@example.com"
                  className="w-full text-[13px] text-text-dark placeholder:text-[#1A1832]/50 bg-transparent outline-none"
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
                  type="password" 
                  placeholder="••••••••"
                  className="w-full text-[13px] text-text-dark placeholder:text-[#1A1832]/50 bg-transparent outline-none"
                />
                <button type="button" className="text-[#C7C7DF] hover:text-text-gray transition-colors">
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link href="#" className="text-[12px] font-medium text-primary hover:underline">
                Lupa password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-[13px] bg-primary text-white text-[14px] font-semibold rounded-xl shadow-[0px_4px_20px_rgba(45,42,112,0.25)] hover:bg-primary/90 transition-colors"
            >
              Masuk
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-border-light"></div>
            <span className="text-[11px] text-[#9999BF]">atau masuk dengan</span>
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
            <span className="text-[12px] text-[#9999BF]">Belum punya akun?</span>
            <Link href="/register" className="text-[12px] font-semibold text-primary hover:underline">
              Daftar
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
