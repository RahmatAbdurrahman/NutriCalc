'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { motion } from 'framer-motion'
import { supabase, activityLevels } from '@/lib/supabase' // Pastikan path ini benar
import { Calendar, User, Ruler, Weight, Activity, Check, Target, TrendingDown, Minus, TrendingUp } from 'lucide-react'

// =====================================================
// 1. REUSABLE 3D BACKGROUND
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
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-emerald-300/30 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] bg-teal-400/30 rounded-full blur-[120px]" />
      </div>
    </div>
  )
}

// =====================================================
// 2. MAIN COMPLETE PROFILE PAGE
// =====================================================
export default function CompleteProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  
  // State Form (Ditambah 'tujuan')
  const [formData, setFormData] = useState({
    tgl_lahir: '',
    gender: 'pria' as 'pria' | 'wanita',
    tinggi_cm: '',
    berat_kg: '',
    level_aktivitas: 1.55,
    tujuan: 'tetap' as 'turun' | 'tetap' | 'naik' // Default maintenance
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth') 
        return
      }
      setUserId(user.id)
      
      // Cek apakah profil sudah ada
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!userId) return

    try {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          tgl_lahir: formData.tgl_lahir,
          gender: formData.gender,
          tinggi_cm: parseInt(formData.tinggi_cm),
          berat_kg: parseFloat(formData.berat_kg),
          level_aktivitas: formData.level_aktivitas,
          tujuan: formData.tujuan // Simpan tujuan ke DB
        })

      if (insertError) throw insertError
      
      // Redirect ke dashboard setelah sukses
      router.push('/dashboard')
      
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans text-gray-800">
      <AnimatedBackground />

      <div className="w-full max-w-2xl my-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl">
              🥗 {/* Placeholder Logo jika image belum load */}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Lengkapi Profil Anda
          </h1>
          <p className="text-gray-500 font-medium">
            Agar NutriCalc+ bisa merancang rencana gizi yang presisi untuk Anda.
          </p>
        </motion.div>

        {/* Glass Form Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl p-8 md:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. GENDER SELECTION */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <User size={18} className="text-emerald-600" /> Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['pria', 'wanita'].map((g) => (
                  <div key={g} className="relative">
                    <input
                      type="radio"
                      name="gender"
                      id={g}
                      value={g}
                      checked={formData.gender === g}
                      onChange={() => setFormData({ ...formData, gender: g as any })}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={g}
                      className="flex flex-col items-center justify-center p-4 bg-white/50 border-2 border-transparent rounded-2xl cursor-pointer transition-all hover:bg-white hover:shadow-md peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:shadow-lg peer-checked:scale-[1.02]"
                    >
                      <div className="text-4xl mb-2">{g === 'pria' ? '👨' : '👩'}</div>
                      <div className="font-bold text-gray-700 capitalize">{g}</div>
                      
                      {/* Check Icon */}
                      <div className="absolute top-3 right-3 text-emerald-600 opacity-0 peer-checked:opacity-100 transition-opacity">
                        <div className="bg-emerald-100 rounded-full p-1">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TANGGAL LAHIR */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <Calendar size={18} className="text-emerald-600" /> Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.tgl_lahir}
                onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm text-gray-900 cursor-pointer"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* 3. TINGGI & BERAT */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                  <Ruler size={18} className="text-emerald-600" /> Tinggi Badan (cm)
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={formData.tinggi_cm}
                    onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                    className="w-full pl-5 pr-12 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm text-gray-900 placeholder-gray-400 group-hover:bg-white"
                    placeholder="170"
                    required
                    min="50" max="250"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                  <Weight size={18} className="text-emerald-600" /> Berat Badan (kg)
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.berat_kg}
                    onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                    className="w-full pl-5 pr-12 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm text-gray-900 placeholder-gray-400 group-hover:bg-white"
                    placeholder="70"
                    required
                    min="10" max="300"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">kg</span>
                </div>
              </div>
            </div>

            {/* 4. LEVEL AKTIVITAS */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <Activity size={18} className="text-emerald-600" /> Aktivitas Fisik
              </label>
              <div className="relative">
                <select
                  value={formData.level_aktivitas}
                  onChange={(e) => setFormData({ ...formData, level_aktivitas: parseFloat(e.target.value) })}
                  className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-sm text-gray-900 cursor-pointer appearance-none"
                >
                  {activityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} ({level.description})
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* 5. TUJUAN (NEW ADDITION) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 ml-1 flex items-center gap-2">
                <Target size={18} className="text-emerald-600" /> Tujuan Diet
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'turun', label: 'Turun Berat', icon: TrendingDown, color: 'text-orange-500', bg: 'peer-checked:bg-orange-50', border: 'peer-checked:border-orange-500' },
                  { id: 'tetap', label: 'Pertahankan', icon: Minus, color: 'text-blue-500', bg: 'peer-checked:bg-blue-50', border: 'peer-checked:border-blue-500' },
                  { id: 'naik', label: 'Naik Berat', icon: TrendingUp, color: 'text-green-500', bg: 'peer-checked:bg-green-50', border: 'peer-checked:border-green-500' }
                ].map((item) => (
                  <div key={item.id} className="relative">
                    <input
                      type="radio"
                      name="tujuan"
                      id={item.id}
                      value={item.id}
                      checked={formData.tujuan === item.id}
                      onChange={() => setFormData({ ...formData, tujuan: item.id as any })}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={item.id}
                      className={`flex flex-col items-center justify-center p-4 bg-white/50 border-2 border-transparent rounded-2xl cursor-pointer transition-all hover:bg-white hover:shadow-md ${item.bg} ${item.border} peer-checked:shadow-md peer-checked:scale-[1.02]`}
                    >
                      <item.icon size={24} className={`mb-2 ${item.color}`} />
                      <div className="font-bold text-gray-700 text-sm">{item.label}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl text-red-700 text-sm text-center font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? 'Menyimpan...' : '🚀 Mulai Petualangan Sehat'}
            </motion.button>

          </form>
        </motion.div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm font-medium text-gray-500">
          🔒 Data Anda aman & terenkripsi. Hanya digunakan untuk kalkulasi.
        </div>
      </div>
    </div>
  )
}