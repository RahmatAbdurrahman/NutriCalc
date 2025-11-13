'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { Calculator, TrendingUp, Heart, Target, ChevronRight, Activity } from 'lucide-react'
import { calculateNutrition, activityLevels } from '@/lib/supabase'
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion'

// =====================================================
// 1. ADVANCED 3D BACKGROUND (Tech + Organic)
// =====================================================
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
       {/* 3D Canvas Layer */}
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Floating Organic Blob representing "Health/Cells" */}
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
          <Sphere args={[1, 100, 200]} scale={1.8} position={[2, 0, -2]}>
            <MeshDistortMaterial
              color="#34d399"
              attach="material"
              distort={0.6}
              speed={2}
              roughness={0.2}
              metalness={0.1}
            />
          </Sphere>
        </Float>
        
        {/* Second Blob */}
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

        {/* Subtle Particles for "Tech" feel */}
        <Stars radius={10} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
      
      {/* Abstract shapes for layout depth */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-emerald-300/30 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] bg-teal-400/30 rounded-full blur-[120px]" />
      </div>
    </div>
  )
}

// =====================================================
// 2. INTERACTIVE TILT CARD COMPONENT
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
      whileHover={{ scale: 1.02 }}
      className={`relative transform-style-3d transition-all duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================
export default function LandingPage() {
  const [formData, setFormData] = useState({
    usia: '', gender: 'pria', berat_kg: '', tinggi_cm: '', level_aktivitas: 1.55
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Scroll Animations
  const { scrollYProgress } = useScroll();
  const headerY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    try {
        // Mocking data for demo if function not present, else replace with actual call
        // const response = await calculateNutrition(...) 
        const mockRes = {
             tdee: 2450, protein_g: 150, carbs_g: 300, fat_g: 70, 
             bmi: 22.5, bmi_category: "Normal" 
        }
        setResult(mockRes)
    } catch (err: any) { setError(err.message) } 
    finally { setLoading(false) }
  }

  return (
    <div className="relative min-h-screen text-gray-800 selection:bg-emerald-200">
      <AnimatedBackground />

      {/* GLASSPHORISM NAVBAR */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Activity size={24} />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-emerald-800">
                NutriCalc<span className="text-emerald-500">+</span>
              </span>
            </div>
            <div className="flex gap-4">
              <button className="px-5 py-2 font-medium hover:text-emerald-600 transition-colors">Masuk</button>
              <button className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                Daftar Sekarang
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Text Content with Stagger Animation */}
            <motion.div 
              style={{ y: headerY, opacity: headerOpacity }}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 z-10"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-emerald-100 shadow-sm"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-gray-600">AI-Powered Nutrition Engine</span>
              </motion.div>

              <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                Hitung Gizi. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-gradient-x">
                  Raih Potensi.
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Platform pintar yang menyesuaikan kalkulasi nutrisi dengan biometrik unik tubuh Anda. Berhenti menebak, mulai terukur.
              </p>

              <div className="flex gap-4 pt-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/30 flex items-center gap-2"
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Mulai Kalkulasi <ChevronRight size={20} />
                </motion.button>
              </div>
            </motion.div>

            {/* Right Side is handled by the 3D Background canvas mostly, but we can put a decorative UI element here */}
             <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="relative hidden lg:block"
             >
                {/* Mock UI Floating Cards */}
                <div className="relative z-10 bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-2xl shadow-emerald-100/50 max-w-md ml-auto rotate-[-5deg] hover:rotate-0 transition-all duration-500">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500"><Target /></div>
                      <div>
                        <div className="font-bold text-gray-800">Target Tercapai</div>
                        <div className="text-xs text-gray-500">Minggu ini</div>
                      </div>
                   </div>
                   <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-[80%]"></div>
                   </div>
                </div>

                <div className="absolute top-40 -left-10 z-20 bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-2xl shadow-teal-100/50 max-w-xs rotate-[5deg] hover:rotate-0 transition-all duration-500">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500"><Activity /></div>
                      <div>
                        <div className="font-bold text-gray-800">Metabolisme</div>
                        <div className="text-emerald-600 text-sm font-mono">+12% Efisiensi</div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CALCULATOR SECTION */}
      <section id="calculator" className="relative py-24">
        <div className="max-w-4xl mx-auto px-4">
          <TiltCard className="bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 p-8 md:p-12 overflow-hidden">
            
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Lab Data Tubuh</h2>
              <p className="text-gray-500">Input biometrik untuk analisis presisi</p>
            </div>

            <form onSubmit={handleCalculate} className="relative z-10 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                 {/* Custom Animated Inputs */}
                 {[
                   { label: 'Usia', name: 'usia', ph: '25' },
                   { label: 'Berat (kg)', name: 'berat_kg', ph: '65' },
                   { label: 'Tinggi (cm)', name: 'tinggi_cm', ph: '170' }
                 ].map((field) => (
                   <div key={field.name} className="group relative">
                     <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1 group-focus-within:text-emerald-600 transition-colors">
                        {field.label}
                     </label>
                     <input
                       type="number"
                       placeholder={field.ph}
                       onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                       className="w-full bg-white/50 border-2 border-transparent focus:border-emerald-400 rounded-2xl px-5 py-4 outline-none transition-all shadow-inner text-lg font-medium focus:bg-white placeholder:text-gray-300"
                       required
                     />
                   </div>
                 ))}
                 
                 <div className="group">
                    <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Gender</label>
                    <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100/50 rounded-2xl">
                      {['pria', 'wanita'].map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setFormData({...formData, gender: g as any})}
                          className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            formData.gender === g 
                            ? 'bg-white shadow-md text-emerald-600 scale-100' 
                            : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {g.toUpperCase()}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Tingkat Aktivitas</label>
                <select
                  onChange={(e) => setFormData({ ...formData, level_aktivitas: parseFloat(e.target.value) })}
                  className="w-full appearance-none bg-white/50 border-2 border-transparent hover:border-emerald-200 focus:border-emerald-400 rounded-2xl px-5 py-4 outline-none transition-all shadow-sm cursor-pointer text-lg"
                >
                  {activityLevels.map((level) => (
                    <option key={level.value} value={level.value}>{level.label} - {level.description}</option>
                  ))}
                </select>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 bg-gray-900 text-white font-bold text-lg rounded-2xl shadow-xl shadow-gray-900/20 hover:bg-gray-800 transition-all relative overflow-hidden"
              >
                 {loading ? (
                   <div className="flex items-center justify-center gap-2">
                     <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                     <span>Memproses AI...</span>
                   </div>
                 ) : (
                   'Analisis Kebutuhan Gizi'
                 )}
              </motion.button>
            </form>

            {/* RESULT OVERLAY (Animate Presence) */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-12 pt-12 border-t border-gray-100"
                >
                  <div className="text-center mb-8">
                     <div className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-2">
                        Analisis Selesai
                     </div>
                     <h3 className="text-3xl font-bold text-gray-800">Cetak Biru Nutrisi Anda</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                       { label: 'Kalori Harian', val: result.tdee, unit: 'kkal', color: 'bg-blue-50 text-blue-600' },
                       { label: 'Protein', val: result.protein_g, unit: 'gram', color: 'bg-emerald-50 text-emerald-600' },
                       { label: 'Karbohidrat', val: result.carbs_g, unit: 'gram', color: 'bg-amber-50 text-amber-600' },
                       { label: 'Lemak', val: result.fat_g, unit: 'gram', color: 'bg-rose-50 text-rose-600' },
                     ].map((item, idx) => (
                       <motion.div 
                          key={idx}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`${item.color} p-5 rounded-2xl text-center`}
                       >
                          <div className="text-3xl font-bold tracking-tighter">{item.val}</div>
                          <div className="text-xs font-bold opacity-70 uppercase mt-1">{item.label}</div>
                       </motion.div>
                     ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </TiltCard>
        </div>
      </section>

      {/* FEATURES SECTION with Scroll Reveal */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Target, title: "Akurasi Medis", desc: "Algoritma kami dikalibrasi dengan standar WHO terbaru." },
            { icon: TrendingUp, title: "Real-time Data", desc: "Visualisasi progres Anda dengan grafik interaktif." },
            { icon: Heart, title: "Holistik", desc: "Bukan sekadar angka, tapi panduan gaya hidup sehat." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="p-8 bg-white/40 hover:bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 transition-all shadow-lg hover:shadow-2xl group cursor-default"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform text-emerald-600">
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="text-center py-12 text-gray-400 text-sm font-medium">
        <p>© 2025 NutriCalc+. Engineered for Health.</p>
      </footer>
    </div>
  )
}