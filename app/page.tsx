'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { Calculator, TrendingUp, Heart, Target, Activity, ChevronRight } from 'lucide-react'
import { calculateNutrition, activityLevels } from '@/lib/supabase'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue } from 'framer-motion'

// --- 1. BACKGROUND COMPONENT (Tetap sama) ---
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
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

// --- 2. TILT CARD COMPONENT (Tetap sama) ---
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
      className={`relative transform-style-3d transition-all duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// --- MAIN PAGE ---
export default function LandingPage() {
  const [formData, setFormData] = useState({
    usia: '', gender: 'pria', berat_kg: '', tinggi_cm: '', level_aktivitas: 1.55
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulasi loading
    
    try {
        // Mock result (Ganti dengan calculateNutrition(data) asli Anda)
        setResult({ tdee: 2450, protein_g: 150, carbs_g: 300, fat_g: 70, bmi: 22.5, bmi_category: "Normal" })
    } catch (err: any) { setError(err.message) } 
    finally { setLoading(false) }
  }

  return (
    <div className="relative min-h-screen text-gray-800 selection:bg-emerald-200 font-sans">
      <AnimatedBackground />

      {/* NAVBAR */}
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <motion.img 
                src="/logo.png" 
                alt="NutriCalc+ Logo"
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-500/20"
              />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-emerald-800">
                NutriCalc<span className="text-emerald-500">+</span>
              </span>
            </div>
            <div className="flex gap-4">
              <a href="/login/page.tsx" className="px-5 py-2 font-medium hover:text-emerald-600 transition-colors">Masuk</a>
              <a href="/register/page.tsx" className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                Daftar Gratis
              </a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-10 lg:pt-48 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6"
            >
              Hitung Gizi. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Raih Potensi.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto mb-10"
            >
              Platform pintar yang menyesuaikan kalkulasi nutrisi dengan biometrik unik tubuh Anda.
            </motion.p>
            <motion.button 
               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
               onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
               className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/30"
            >
              Mulai Sekarang
            </motion.button>
        </div>
      </section>

      {/* CALCULATOR SECTION (MODIFIKASI UTAMA) */}
      <section id="calculator" className="relative py-16">
        <div className="max-w-4xl mx-auto px-4">
          <TiltCard className="bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 p-8 md:p-12 overflow-hidden">
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Kalkulator Gizi Cepat</h2>
              <p className="text-gray-600">Masukkan data Anda untuk mendapatkan rekomendasi gizi personal</p>
            </div>

            <form onSubmit={handleCalculate} className="space-y-6 relative z-10">
               {/* Usia & Gender */}
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Usia (tahun)</label>
                    <input
                      type="number"
                      value={formData.usia}
                      onChange={(e) => setFormData({ ...formData, usia: e.target.value })}
                      className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-inner focus:bg-white"
                      placeholder="25"
                      required
                    />
                  </div>
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-sm cursor-pointer"
                    >
                      <option value="pria">Pria</option>
                      <option value="wanita">Wanita</option>
                    </select>
                  </div>
               </div>

               {/* Berat & Tinggi */}
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Berat Badan (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.berat_kg}
                      onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                      className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-inner focus:bg-white"
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
                      className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-inner focus:bg-white"
                      placeholder="170"
                      required
                    />
                  </div>
               </div>

               {/* Level Aktivitas */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Level Aktivitas</label>
                  <select
                    value={formData.level_aktivitas}
                    onChange={(e) => setFormData({ ...formData, level_aktivitas: parseFloat(e.target.value) })}
                    className="w-full px-5 py-4 bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none transition shadow-sm cursor-pointer"
                  >
                    {activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label} - {level.description}</option>
                    ))}
                  </select>
               </div>

               {/* Submit Button */}
               <motion.button
                 type="submit"
                 disabled={loading}
                 whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                 className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
               >
                 {loading ? 'Menghitung...' : '🧮 Hitung Kebutuhan Gizi'}
               </motion.button>
            </form>

            {/* RESULT SECTION (ORIGINAL CODE STRUCTURE RESTORED) */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-10 p-8 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 rounded-3xl border border-emerald-100/50 backdrop-blur-sm"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    📊 Hasil Kalkulasi Anda
                  </h3>

                  {/* Main Stats (Original Grid) */}
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

                  {/* CTA (Original Logic) */}
                  <div className="text-center pt-4 border-t border-emerald-200/50">
                    <p className="text-gray-700 mb-4 font-medium">
                      Daftar sekarang untuk tracking progres dan fitur lengkap!
                    </p>
                    <motion.a
                      href="/register"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
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

      {/* FEATURES SECTION (MODIFIKASI SESUAI PERMINTAAN) */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Kenapa Memilih NutriCalc+?</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* CARD 1: Custom Style yang diminta User */}
          <motion.div
             initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
             className="p-6 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl hover:bg-white/60 transition-all"
          >
            <div className="flex items-center gap-4">
              {/* Bagian ini persis kode Anda */}
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

          {/* CARD 2 */}
          <motion.div
             initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
             className="p-6 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl hover:bg-white/60 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calculator className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">Kalkulasi Presisi</div>
                <div className="text-sm text-gray-600">Berbasis Strategy Pattern</div>
              </div>
            </div>
            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
               Perhitungan algoritma yang menyesuaikan secara dinamis berdasarkan kelompok usia dan kondisi fisik.
            </p>
          </motion.div>

          {/* CARD 3 */}
          <motion.div
             initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
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
               Akses ribuan artikel kesehatan yang dikurasi dari jurnal medis terkemuka untuk panduan hidup sehat.
            </p>
          </motion.div>
        </div>
      </section>

      <footer className="text-center py-12 text-gray-400 text-sm font-medium">
        <p>© 2025 NutriCalc+. Engineered for Health.</p>
      </footer>
    </div>
  )
}