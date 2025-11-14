'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { 
  Heart, LogOut, Activity, BarChart2, CalendarDays, Zap, Droplet, Flame, Target, BookOpen, Clock
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { id as indonesiaLocale } from 'date-fns/locale'

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
// 2. MAIN RIWAYAT PAGE
// =====================================================
export default function RiwayatPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [nutritionTarget, setNutritionTarget] = useState<any>(null) // Target harian
  const [loading, setLoading] = useState(true)
  
  // States untuk 4 Fitur Fungsional
  // (CATATAN: Ini adalah data MOCK. Anda perlu logika agregasi data dari Supabase)
  const [trendData, setTrendData] = useState<any[]>([])
  const [reportCardData, setReportCardData] = useState<any>(null)
  const [habitData, setHabitData] = useState<any>(null)
  const [calendarModifiers, setCalendarModifiers] = useState<any>({
    onTarget: [],
    overTarget: [],
    underTarget: []
  })

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // 1. Ambil target nutrisi (asumsi dari profile, ini perlu disesuaikan)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      // (Anda perlu logika `calculateNutrition` di sini seperti di dashboard)
      const mockTarget = { tdee: 2200, protein_g: 120, carbs_g: 250, fat_g: 60 }
      setNutritionTarget(mockTarget)

      // 2. Ambil data log 30 hari terakhir
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
      const { data: logsData } = await supabase
        .from('food_logs')
        .select('*, foods(*)')
        .eq('user_id', user.id)
        .gte('consumed_at', thirtyDaysAgo)
      
      // 3. (LANGKAH PENTING) Proses data mentah `logsData` menjadi data visual
      // Ini adalah logika agregasi yang kompleks (group by day, sum, count, etc.)
      // Untuk demo ini, kita akan MOCK hasilnya:
      
      // --- MOCK DATA UNTUK VISUALISASI ---

      // Fitur 1: Data Kalender
      setCalendarModifiers({
        onTarget: [new Date(2025, 10, 10), new Date(2025, 10, 11), new Date(2025, 10, 13)],
        overTarget: [new Date(2025, 10, 8), new Date(2025, 10, 12)],
        underTarget: [new Date(2025, 10, 9), new Date(2025, 10, 14)]
      })

      // Fitur 2: Data Grafik Tren (7 hari terakhir)
      setTrendData([
        { name: '08 Nov', kalori: 2500, target: 2200 },
        { name: '09 Nov', kalori: 1800, target: 2200 },
        { name: '10 Nov', kalori: 2150, target: 2200 },
        { name: '11 Nov', kalori: 2250, target: 2200 },
        { name: '12 Nov', kalori: 2800, target: 2200 },
        { name: '13 Nov', kalori: 2200, target: 2200 },
        { name: '14 Nov', kalori: 1900, target: 2200 },
      ])

      // Fitur 3: Data Report Card (30 hari terakhir)
      setReportCardData({
        avgCalories: 2250,
        successDays: 12,
        totalDays: 30,
        weakestDay: 'Sabtu'
      })

      // Fitur 4: Data Pola Makan
      setHabitData({
        topByFrequency: [
          { name: 'Nasi Putih', count: 28 },
          { name: 'Kopi Susu', count: 25 },
          { name: 'Telur Dadar', count: 19 },
        ],
        topByCalories: [
          { name: 'Kopi Susu', calories: 4500 },
          { name: 'Nasi Goreng Spesial', calories: 3800 },
          { name: 'Nasi Putih', calories: 3500 },
        ]
      })
      // --- AKHIR MOCK DATA ---

      setLoading(false)
    }

    loadData()
  }, [router])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  // Style untuk kalender heatmap
  const modifierStyles = {
    onTarget: { backgroundColor: '#10B981', color: 'white', fontWeight: 'bold' },
    overTarget: { backgroundColor: '#EF4444', color: 'white', fontWeight: 'bold' },
    underTarget: { backgroundColor: '#3B82F6', color: 'white', fontWeight: 'bold' },
    today: { border: '2px solid #059669', borderRadius: '50%' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-emerald-700 font-medium animate-pulse">Menganalisis riwayat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen text-gray-800 font-sans overflow-x-hidden">
      <AnimatedBackground />

      {/* --- GLASS NAVBAR --- */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <motion.img src="/logo.png" alt="Logo" whileHover={{ rotate: 10, scale: 1.1 }} className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-500/20" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-emerald-800">
                NutriCalc<span className="text-emerald-500">+</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                <a href="/dashboard" className="hover:text-emerald-600 transition">Dashboard</a>
                <a href="/riwayat" className="text-emerald-700 font-bold">Riwayat</a>
                <a href="/kalkulator" className="hover:text-emerald-600 transition">Database Pangan</a>
                <a href="/artikel" className="hover:text-emerald-600 transition">Artikel</a>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-full border border-transparent hover:border-red-200 transition-all text-sm font-bold">
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Riwayat & Analisis</h1>
          <p className="text-gray-500 font-medium">Lihat tren dan pola konsumsi Anda selama 30 hari terakhir.</p>
        </motion.div>

        {/* --- Grid Layout --- */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- FITUR 2: GRAFIK TREN (Kiri Atas) --- */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <BarChart2 className="text-blue-600" /> Tren Asupan Kalori (7 Hari Terakhir)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000000" strokeOpacity={0.1} />
                  <XAxis dataKey="name" fontSize={12} stroke="#374151" />
                  <YAxis fontSize={12} stroke="#374151" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                      backdropFilter: 'blur(10px)',
                      borderRadius: '1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="kalori" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} name="Kalori Anda" />
                  <Line type="monotone" dataKey="target" stroke="#6B7280" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* --- FITUR 1: KALENDER (Kiri Bawah) --- */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <CalendarDays className="text-emerald-600" /> Kalender Konsistensi
            </h2>
            <div className="flex justify-center">
              {/* CSS untuk kustomisasi DayPicker ada di <style> tag di bawah */}
              <DayPicker
                mode="single"
                selected={new Date()}
                modifiers={calendarModifiers}
                modifiersStyles={modifierStyles}
                locale={indonesiaLocale}
                className="riwayat-calendar"
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10B981]"></div> Sesuai Target</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#EF4444]"></div> Di Atas Target</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div> Di Bawah Target</span>
            </div>
          </motion.div>

          {/* --- SISI KANAN (FITUR 3 & 4) --- */}
          <div className="lg:col-span-1 space-y-8">
            {/* --- FITUR 3: REPORT CARD --- */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Target className="text-red-600" /> Rapor 30 Hari
              </h2>
              {reportCardData && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Rata-rata Kalori</span>
                    <span className="text-lg font-bold text-gray-900">{reportCardData.avgCalories} kkal</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Tingkat Sukses</span>
                    <span className="text-lg font-bold text-emerald-600">{reportCardData.successDays} / {reportCardData.totalDays} hari</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Hari Terlemah</span>
                    <span className="text-lg font-bold text-red-600">{reportCardData.weakestDay}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* --- FITUR 4: POLA MAKAN --- */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <BookOpen className="text-purple-600" /> Pola Makan
              </h2>
              {habitData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Paling Sering Dicatat</h3>
                    <ul className="space-y-2">
                      {habitData.topByFrequency.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between text-sm p-2 bg-white/40 rounded-lg">
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="text-gray-500 font-bold">{item.count}x</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Kontributor Kalori Terbanyak</h3>
                    <ul className="space-y-2">
                      {habitData.topByCalories.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between text-sm p-2 bg-white/40 rounded-lg">
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="text-red-600 font-bold">{item.calories} kkal</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Inject CSS untuk kustomisasi react-day-picker */}
      <style>{`
        .riwayat-calendar .rdp-day {
          border-radius: 50%;
        }
        .riwayat-calendar .rdp-day:not([disabled]):hover {
          background-color: #d1fae5;
        }
        .riwayat-calendar .rdp-head_cell {
          font-weight: bold;
          font-size: 0.8rem;
          color: #374151;
        }
        .riwayat-calendar .rdp-caption_label {
          font-size: 1.1rem;
          font-weight: bold;
          color: #1f2937;
        }
      `}</style>
    </div>
  )
}