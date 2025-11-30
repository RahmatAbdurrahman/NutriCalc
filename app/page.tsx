'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { Calculator, TrendingUp, Heart, Target, Activity, ChevronRight } from 'lucide-react'
import { activityLevels } from '@/lib/supabase' // Hapus calculateNutrition jika tidak dipakai langsung di sini, atau biarkan jika untuk kalkulator guest
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue } from 'framer-motion'

// =====================================================
// 1. COMPONENT: 3D ANIMATED BACKGROUND
// =====================================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Floating Organic Blob 1 */}
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
          <Sphere args={[1, 100, 200]} scale={1.8} position={[2, 0, -2]}>
            <MeshDistortMaterial
              color="#34d399"
              attach="material"
              distort={0.6}
              speed={2}
              roughness={0.2}
            />
          </Sphere>
        </Float>
        
        {/* Floating Organic Blob 2 */}
        <Float speed={1.5} rotationIntensity={1.5} floatIntensity={1.5}>
           <Sphere args={[1, 64, 64]} scale={1.2} position={[-2, -1, -3]}>
            <MeshDistortMaterial
              color="#2dd4bf"
              attach="material"
              distort={0.4}
              speed={3}
              opacity={0.6}
              transparent
            />
          </Sphere>
        </Float>

        {/* Particles */}
        <Stars radius={10} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
      
      {/* Abstract Blur Overlay */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-emerald-300/30 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] bg-teal-400/30 rounded-full blur-[120px]" />
      </div>
    </div>
  )
}

// =====================================================
// 2. COMPONENT: INTERACTIVE TILT CARD
// =====================================================
function TiltCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={{ scale: 1.01 }}
      className={`transform-style-3d transition-all duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// =====================================================
// MAIN PAGE COMPONENT
// =====================================================
export default function LandingPage() {
  const [formData, setFormData] = useState({
    usia: '',
    gender: 'pria' as 'pria' | 'wanita',
    berat_kg: '',
    tinggi_cm: '',
    level_aktivitas: 1.55
  })

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simulasi delay jaringan agar loading state terlihat
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    try {
      // Mock result (Ganti dengan calculateNutrition(data) asli jika backend siap)
      // Ini kalkulator "Guest Mode" yang cepat
      setResult({
         tdee: 2450,
         protein_g: 150,
         carbs_g: 300,
         fat_g: 70,
         bmi: 22.5,
         bmi_category: "Normal"
      })

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen text-gray-800 selection:bg-emerald-200 font-sans overflow-x-hidden">
      <AnimatedBackground />

      {/* NAVBAR (UPDATED LINKS) */}
      <motion.nav 
        initial={{ y: -100 }} 
        animate={{ y: 0 }} 
        className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Custom */}
            <div className="flex items-center gap-3">
              <motion.img 
                src="/logo.png" 
                alt="NutriCalc+ Logo"
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-500/20"
              />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-emerald-800">
                NutriCalc<span className="text-emerald-500">+</span>
              </span>
            </div>

            {/* Nav Links (UPDATED TO /auth) */}
            <div className="flex gap-4">
              <a href="/auth" className="hidden sm:block px-5 py-2 font-medium hover:text-emerald-600 transition-colors">
                Masuk
              </a>
              <a href="/auth" className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                Daftar Gratis
              </a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 z-10"
            >
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 backdrop-blur-md rounded-full border border-emerald-200">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-bold text-emerald-800">AI-Powered Nutrition</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                Hitung Gizi.<br/>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-teal-500">
                  Tanpa Kompromi.
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Optimalkan kesehatan Anda dengan kalkulasi presisi berbasis data biometrik. 
                Simpel, akurat, dan personal.
              </p>

              <div className="flex gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-all flex items-center gap-2"
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Mulai Kalkulasi <ChevronRight size={20} />
                </motion.button>
              </div>
            </motion.div>

            {/* Right: TiltCard Interactive Image */}
            <div className="relative flex items-center justify-center perspective-1000 hidden lg:flex">
               <TiltCard className="relative w-full max-w-lg aspect-square bg-white/10 backdrop-blur-sm rounded-[3rem] border border-white/20 shadow-2xl shadow-emerald-500/10 flex items-center justify-center">
                  {/* Background Glow inside Card */}
                  <div className="absolute inset-0 bg-linear-to-tr from-emerald-500/10 to-teal-500/10 rounded-[3rem] -z-10" />

                  {/* Main Character */}
                  <motion.img
                    src="/char.png"
                    alt="3D Character"
                    className="w-[85%] h-[85%] object-contain drop-shadow-2xl z-10"
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Floating Elements (Decorations) */}
                  <div className="absolute top-10 -right-6 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/50 animate-float-slow z-20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                        <Activity size={20} />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-bold">Metabolisme</div>
                        <div className="text-gray-900 font-bold text-sm">Excellent</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-10 -left-6 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/50 animate-float-delayed z-20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500">
                        <Calculator size={20} />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-bold">Akurasi</div>
                        <div className="text-gray-900 font-bold text-sm">99.8%</div>
                      </div>
                    </div>
                  </div>
               </TiltCard>
               
               {/* Decorative Blur behind */}
               <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* CALCULATOR SECTION */}
      <section id="calculator" className="relative py-16">
        <div className="max-w-4xl mx-auto px-4">
          <TiltCard className="relative bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 p-8 md:p-12 overflow-hidden">
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Kalkulator Gizi Cepat
              </h2>
              <p className="text-gray-600">
                Masukkan data Anda untuk mendapatkan rekomendasi gizi personal
              </p>
            </div>

            <form onSubmit={handleCalculate} className="space-y-6 relative z-10">
              {/* Form Inputs (Same as before) */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Usia (tahun)</label>
                  <input
                    type="number"
                    value={formData.usia}
                    onChange={(e) => setFormData({ ...formData, usia: e.target.value })}
                    className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-inner focus:bg-white text-gray-900 placeholder-gray-400"
                    placeholder="25"
                    required
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'pria' | 'wanita' })}
                    className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-sm cursor-pointer text-gray-900"
                  >
                    <option value="pria">Pria</option>
                    <option value="wanita">Wanita</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Berat Badan (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.berat_kg}
                    onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                    className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-inner focus:bg-white text-gray-900 placeholder-gray-400"
                    placeholder="70"
                    required
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Tinggi Badan (cm)</label>
                  <input
                    type="number"
                    value={formData.tinggi_cm}
                    onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                    className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-inner focus:bg-white text-gray-900 placeholder-gray-400"
                    placeholder="170"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Level Aktivitas</label>
                <select
                  value={formData.level_aktivitas}
                  onChange={(e) => setFormData({ ...formData, level_aktivitas: parseFloat(e.target.value) })}
                  className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-sm cursor-pointer text-gray-900"
                >
                  {activityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} - {level.description}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl text-red-700 text-center">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-linear-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                {loading ? 'Menghitung...' : '🧮 Hitung Kebutuhan Gizi'}
              </motion.button>
            </form>

            {/* RESULT SECTION */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-10 p-8 bg-linear-to-br from-emerald-50/80 to-teal-50/80 rounded-3xl border border-emerald-100/50 backdrop-blur-sm"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    📊 Hasil Kalkulasi Anda
                  </h3>

                  {/* Main Stats Grid */}
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/90 backdrop-blur p-4 rounded-2xl text-center shadow-sm">
                      <div className="text-3xl font-bold text-emerald-600">{result.tdee}</div>
                      <div className="text-sm text-gray-600">Kalori/Hari</div>
                    </div>
                    <div className="bg-white/90 backdrop-blur p-4 rounded-2xl text-center shadow-sm">
                      <div className="text-3xl font-bold text-blue-600">{result.protein_g}g</div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                    <div className="bg-white/90 backdrop-blur p-4 rounded-2xl text-center shadow-sm">
                      <div className="text-3xl font-bold text-amber-600">{result.carbs_g}g</div>
                      <div className="text-sm text-gray-600">Karbohidrat</div>
                    </div>
                    <div className="bg-white/90 backdrop-blur p-4 rounded-2xl text-center shadow-sm">
                      <div className="text-3xl font-bold text-purple-600">{result.fat_g}g</div>
                      <div className="text-sm text-gray-600">Lemak</div>
                    </div>
                  </div>

                  {/* BMI & Category */}
                  <div className="bg-white/90 backdrop-blur p-5 rounded-2xl mb-8 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">BMI Anda:</span>
                      <span className="font-bold text-xl">{result.bmi}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-700 font-medium">Kategori:</span>
                      <span className="font-bold text-emerald-600 px-3 py-1 bg-emerald-100 rounded-full text-sm">
                        {result.bmi_category}
                      </span>
                    </div>
                  </div>

                  {/* Call To Action (CTA) - Redirects to Auth */}
                  <div className="text-center pt-4 border-t border-emerald-200/50">
                    <p className="text-gray-700 mb-4 font-medium">
                      Daftar sekarang untuk tracking progres dan fitur lengkap!
                    </p>
                    <motion.a
                      href="/auth"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-xl hover:shadow-xl transition-all"
                    >
                      🚀 Daftar Gratis Sekarang
                    </motion.a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TiltCard>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Kenapa Memilih NutriCalc+?
          </h2>
          <p className="text-xl text-gray-600">
            Platform gizi terlengkap dengan teknologi terkini
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature Cards (Same as before) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl hover:bg-white/60 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">Tracking Harian</div>
                <div className="text-sm text-gray-600">Monitor progres Anda</div>
              </div>
            </div>
            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
               Catat asupan harian Anda dengan database lengkap dan visualisasi grafik yang mudah dipahami.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl hover:bg-white/60 transition-all"
          >
             <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">Kalkulasi Presisi</div>
                <div className="text-sm text-gray-600">Berbasis Strategy Pattern</div>
              </div>
            </div>
            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
               Perhitungan algoritma yang menyesuaikan secara dinamis berdasarkan kelompok usia (Anak/Dewasa/Lansia).
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl hover:bg-white/60 transition-all"
          >
             <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">Edukasi Gizi</div>
                <div className="text-sm text-gray-600">Sumber Terpercaya</div>
              </div>
            </div>
            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
               Akses artikel kesehatan yang dikurasi dari jurnal medis terkemuka untuk panduan hidup sehat.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-bold">NutriCalc+</span>
          </div>
          <p className="text-gray-400">
            Platform Kalkulasi Gizi Personal untuk Indonesia
          </p>
          <p className="text-gray-500 text-sm mt-4">
            © 2025 NutriCalc+. Engineered for Health.
          </p>
        </div>
      </footer>
    </div>
  )
}