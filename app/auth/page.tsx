'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { supabase } from '@/lib/supabase' // Pastikan path ini benar sesuai projectmu
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'

// =====================================================
// 1. REUSABLE 3D BACKGROUND (TIDAK BERUBAH)
// =====================================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
          <Sphere args={[1, 100, 200]} scale={1.8} position={[2, 0, -2]}>
            <MeshDistortMaterial color="#34d399" attach="material" distort={0.6} speed={2} roughness={0.2} />
          </Sphere>
        </Float>
        <Float speed={1.5} rotationIntensity={1.5} floatIntensity={1.5}>
            <Sphere args={[1, 64, 64]} scale={1.2} position={[-2, -1, -3]}>
            <MeshDistortMaterial color="#2dd4bf" attach="material" distort={0.4} speed={3} opacity={0.6} transparent />
          </Sphere>
        </Float>
        <Stars radius={10} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  )
}

// =====================================================
// 2. MAIN AUTH PAGE (FIXED LOGIC)
// =====================================================
export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // --- LOGIKA LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) throw signInError

      if (data.user) {
        // Cek profile, sesuaikan path table jika beda
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (!profile) {
          router.push('/lengkapi-profil')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIKA REGISTER ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username || formData.username.length < 3) {
      setError('Username minimal 3 karakter')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      return
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.username
          },
          // Pastikan URL ini benar untuk environment production/local
          emailRedirectTo: `${window.location.origin}/auth/callback` 
        }
      })

      if (signUpError) throw signUpError

      if (data.user) {
        alert('Registrasi berhasil! Cek email Anda atau login.')
        setIsSignUp(false)
        setFormData({ ...formData, password: '', confirmPassword: '' })
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans text-gray-800">
      <AnimatedBackground />

      {/* --- CONTAINER UTAMA --- */}
      <div className="relative bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2rem] shadow-2xl w-full max-w-[1000px] min-h-[600px] overflow-hidden flex">
        
        {/* ================================================= */}
        {/* PANEL KIRI: FORM LOGIN (Visible Default) */}
        {/* ================================================= */}
        <div className={`absolute top-0 left-0 h-full w-full md:w-1/2 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out z-10 
          ${isSignUp ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
          
          <div className="w-full max-w-sm">
            {/* Header Login */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                {/* Ganti src logo sesuai asset kamu */}
                {/* <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-md" /> */}
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                  NutriCalc+
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Selamat Datang!</h1>
              <p className="text-gray-500 mt-2 text-sm">Masuk untuk melanjutkan tracking gizi Anda</p>
            </div>

            {/* Form Login */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" 
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" 
                  required
                />
              </div>

              {error && !isSignUp && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>MASUK <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            <div className="text-center mt-6 md:hidden">
              <p className="text-gray-600 text-sm">Belum punya akun? <b onClick={() => setIsSignUp(true)} className="text-emerald-600 cursor-pointer">Daftar di sini</b></p>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* PANEL KANAN: FORM REGISTER (Fix: Positioned Right) */}
        {/* ================================================= */}
        {/* PERBAIKAN: Gunakan md:left-1/2 agar posisi default di kanan, bukan ditumpuk di kiri */}
        <div className={`absolute top-0 left-0 md:left-1/2 h-full w-full md:w-1/2 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out z-10 
          ${isSignUp ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
          
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                 {/* <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-md" /> */}
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                  NutriCalc+
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Mulai Sekarang</h1>
              <p className="text-gray-500 mt-2 text-sm">Buat akun gratis dalam hitungan detik</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" 
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" 
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  placeholder="Password (min. 6)" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" 
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  placeholder="Konfirmasi Password" 
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" 
                  required
                />
              </div>

              {error && isSignUp && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>DAFTAR <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            <div className="text-center mt-6 md:hidden">
              <p className="text-gray-600 text-sm">Sudah punya akun? <b onClick={() => setIsSignUp(false)} className="text-emerald-600 cursor-pointer">Masuk di sini</b></p>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* OVERLAY / SLIDING PANEL (DESKTOP ONLY) */}
        {/* ================================================= */}
        <div 
          className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-50 rounded-l-[50px] 
            ${isSignUp ? '-translate-x-full rounded-l-none rounded-r-[50px]' : ''}`}
        >
          {/* Background Gradient */}
          <div className={`bg-gradient-to-r from-emerald-500 to-teal-600 text-white relative -left-full h-full w-[200%] transform transition-transform duration-700 ease-in-out flex items-center justify-center 
            ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}`}>
            
            {/* Panel Kiri Overlay (Muncul saat Register Mode - Menawarkan Login) */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transform transition-transform duration-700 ease-in-out 
              ${isSignUp ? 'translate-x-0' : '-translate-x-[20%]'}`}>
                <h1 className="text-4xl font-extrabold mb-4 leading-tight">Sudah Bergabung?</h1>
                <p className="mb-8 text-emerald-100 font-medium leading-relaxed">
                  Selamat datang kembali! Silakan masuk untuk melihat progres kesehatan Anda.
                </p>
                <button 
                  onClick={() => setIsSignUp(false)}
                  className="px-10 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-emerald-600 transition-all shadow-lg"
                >
                  MASUK SEKARANG
                </button>
            </div>

            {/* Panel Kanan Overlay (Muncul saat Login Mode - Menawarkan Daftar) */}
            <div className={`w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transform transition-transform duration-700 ease-in-out 
              ${isSignUp ? 'translate-x-[20%]' : 'translate-x-0'}`}>
                <h1 className="text-4xl font-extrabold mb-4 leading-tight">Belum Punya Akun?</h1>
                <p className="mb-8 text-emerald-100 font-medium leading-relaxed">
                  Bergabunglah dengan NutriCalc+ dan mulai pantau kesehatan Anda secara cerdas hari ini.
                </p>
                <button 
                  onClick={() => setIsSignUp(true)}
                  className="px-10 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-emerald-600 transition-all shadow-lg"
                >
                  DAFTAR GRATIS
                </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}