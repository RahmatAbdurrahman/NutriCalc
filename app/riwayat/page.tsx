'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
// Impor fungsi-fungsi inti (asumsi Anda memilikinya)
import { 
  supabase, 
  calculateAge, 
  calculateNutrition,
  type Food,
  type Profile
} from '@/lib/supabase'
import { 
  LogOut, Activity, BarChart2, Zap, Droplet, Flame, Target, BookOpen, ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, 
  PieChart, Pie, Cell, Sector // Untuk Donut Chart
} from 'recharts'
import { 
  format, subDays, addDays, startOfISOWeek, endOfISOWeek, isSameDay, eachDayOfInterval, isBefore 
} from 'date-fns'
import { id as indonesiaLocale } from 'date-fns/locale'

// =====================================================
// 1. Tipe Data untuk Agregasi
// =====================================================
type DailyAggregate = {
  date: string; // 'yyyy-MM-dd'
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  status: 'onTarget' | 'overTarget' | 'underTarget' | 'noData';
}

type HabitStats = {
  name: string;
  count: number;
  totalCalories: number;
}

type ConsistencyData = {
  name: 'Sesuai Target' | 'Di Atas Target' | 'Di Bawah Target';
  value: number;
}

// =====================================================
// 2. REUSABLE 3D BACKGROUND
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
// 3. MAIN RIWAYAT PAGE
// =====================================================
export default function RiwayatPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [nutritionTarget, setNutritionTarget] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // State untuk data yang sudah diproses
  const [allDailyData, setAllDailyData] = useState<Map<string, DailyAggregate>>(new Map())
  const [trendData, setTrendData] = useState<any[]>([])
  const [reportCardData, setReportCardData] = useState<any>(null)
  const [habitData, setHabitData] = useState<any>(null)
  const [consistencyData, setConsistencyData] = useState<ConsistencyData[]>([])
  const [streakData, setStreakData] = useState(0)

  // State untuk navigasi chart
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfISOWeek(new Date()))

  // --- Efek Utama: Load dan Proses Semua Data ---
  useEffect(() => {
    const processAllData = async () => {
      // 1. Dapatkan User & Profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profile) { router.push('/lengkapi-profil'); return }

      // 2. Hitung Target Nutrisi
      const age = calculateAge(profile.tgl_lahir)
      const { data: target } = await calculateNutrition({
        usia: age, gender: profile.gender, berat_kg: profile.berat_kg, tinggi_cm: profile.tinggi_cm, level_aktivitas: profile.level_aktivitas
      })
      setNutritionTarget(target)
      const TDEE = target.tdee

      // 3. Ambil Log 90 Hari Terakhir (untuk data yang cukup)
      const ninetyDaysAgo = subDays(new Date(), 90).toISOString()
      const { data: rawLogs } = await supabase
        .from('food_logs')
        .select('*, foods(*)')
        .eq('user_id', user.id)
        .gte('consumed_at', ninetyDaysAgo)
      
      if (!rawLogs) { setLoading(false); return }

      // --- 4. INTI LOGIKA AGREGRASI DATA ---

      // A. Agregasi Per Hari & Kebiasaan
      const dailyAggregates = new Map<string, Omit<DailyAggregate, 'status'>>()
      const habitAggregates = new Map<string, HabitStats>()

      for (const log of rawLogs) {
        const dateKey = format(new Date(log.consumed_at), 'yyyy-MM-dd')
        const logCalories = (log.foods.energy_kcal / 100) * log.quantity_grams
        const logProtein = (log.foods.protein_g / 100) * log.quantity_grams
        const logCarbs = (log.foods.carbs_g / 100) * log.quantity_grams
        const logFat = (log.foods.fat_g / 100) * log.quantity_grams
        const foodName = log.foods.food_name

        // Agregasi harian
        const dayData = dailyAggregates.get(dateKey) || { date: dateKey, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
        dayData.totalCalories += logCalories
        dayData.totalProtein += logProtein
        dayData.totalCarbs += logCarbs
        dayData.totalFat += logFat
        dailyAggregates.set(dateKey, dayData)

        // Agregasi kebiasaan
        const habitData = habitAggregates.get(foodName) || { name: foodName, count: 0, totalCalories: 0 }
        habitData.count += 1
        habitData.totalCalories += logCalories
        habitAggregates.set(foodName, habitData)
      }

      // B. Finalisasi Data Harian (Menambahkan Status)
      const finalDailyData = new Map<string, DailyAggregate>()
      const thirtyDaysInterval = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
      
      let consistencyCounts = { onTarget: 0, overTarget: 0, underTarget: 0 }
      let currentStreak = 0
      let lastDayWasOnTarget = false
      let totalCaloriesLast30Days = 0

      // Urutkan interval agar bisa hitung streak
      const sortedInterval = thirtyDaysInterval.sort((a, b) => a.getTime() - b.getTime())

      for (const day of sortedInterval) {
        const dateKey = format(day, 'yyyy-MM-dd')
        const data = dailyAggregates.get(dateKey)
        let status: DailyAggregate['status'] = 'noData'
        let totalCalories = 0
        
        if (data) {
          totalCalories = data.totalCalories
          totalCaloriesLast30Days += totalCalories
          // Tentukan status (misal, 10% toleransi)
          if (totalCalories > TDEE * 1.1) {
            status = 'overTarget'
            consistencyCounts.overTarget++
            lastDayWasOnTarget = false
          } else if (totalCalories < TDEE * 0.9) {
            status = 'underTarget'
            consistencyCounts.underTarget++
            lastDayWasOnTarget = false
          } else {
            status = 'onTarget'
            consistencyCounts.onTarget++
            currentStreak = lastDayWasOnTarget || currentStreak === 0 ? currentStreak + 1 : 1
            lastDayWasOnTarget = true
          }
        } else {
          lastDayWasOnTarget = false
        }
        
        finalDailyData.set(dateKey, { 
          date: dateKey, 
          totalCalories: data?.totalCalories || 0,
          totalProtein: data?.totalProtein || 0,
          totalCarbs: data?.totalCarbs || 0,
          totalFat: data?.totalFat || 0,
          status 
        })
      }

      // C. Set State untuk Visualisasi
      setAllDailyData(finalDailyData) // Data mentah untuk chart

      // Fitur Donut Chart
      setConsistencyData([
        { name: 'Sesuai Target', value: consistencyCounts.onTarget },
        { name: 'Di Atas Target', value: consistencyCounts.overTarget },
        { name: 'Di Bawah Target', value: consistencyCounts.underTarget },
      ])

      // Fitur Streak
      setStreakData(currentStreak)

      // Fitur Report Card
      const loggedDays = consistencyCounts.onTarget + consistencyCounts.overTarget + consistencyCounts.underTarget
      setReportCardData({
        avgCalories: loggedDays > 0 ? Math.round(totalCaloriesLast30Days / loggedDays) : 0,
        successDays: consistencyCounts.onTarget,
        totalDays: 30
      })

      // Fitur Habit
      const habits = Array.from(habitAggregates.values())
      setHabitData({
        topByFrequency: [...habits].sort((a, b) => b.count - a.count).slice(0, 3),
        topByCalories: [...habits].sort((a, b) => b.totalCalories - a.totalCalories).slice(0, 3)
      })

      setLoading(false)
    }

    processAllData()
  }, [router]) // Hanya run sekali saat load

  // --- Efek Kedua: Update Chart saat navigasi minggu ---
  useEffect(() => {
    if (allDailyData.size === 0) return // Jangan run jika data belum siap

    const weekInterval = eachDayOfInterval({ start: currentWeekStart, end: addDays(currentWeekStart, 6) })
    
    const newTrendData = weekInterval.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const data = allDailyData.get(dateKey)
      return {
        name: format(day, 'E', { locale: indonesiaLocale }), // Sen, Sel, Rab...
        kalori: data ? Math.round(data.totalCalories) : 0,
        target: nutritionTarget.tdee
      }
    })
    
    setTrendData(newTrendData)

  }, [currentWeekStart, allDailyData, nutritionTarget])


  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  // --- Navigasi Chart ---
  const handlePrevWeek = () => {
    setCurrentWeekStart(subDays(currentWeekStart, 7))
  }
  const handleNextWeek = () => {
    // Jangan biarkan navigasi ke masa depan
    if (isBefore(endOfISOWeek(currentWeekStart), new Date())) {
      setCurrentWeekStart(addDays(currentWeekStart, 7))
    }
  }
  const chartTitle = `${format(currentWeekStart, 'd MMM', { locale: indonesiaLocale })} - ${format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: indonesiaLocale })}`
  const isNextWeekDisabled = !isBefore(endOfISOWeek(currentWeekStart), new Date())

  // --- Data & Styling Donut Chart ---
  const DONUT_COLORS = ['#10B981', '#EF4444', '#3B82F6']; // Sesuai, Di Atas, Di Bawah
  const totalConsistency = consistencyData.reduce((acc, cur) => acc + cur.value, 0)

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
          <p className="text-gray-500 font-medium">Lihat tren dan pola konsumsi Anda.</p>
        </motion.div>

        {/* --- Grid Layout --- */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- FITUR 2 (MODIFIKASI): GRAFIK TREN MINGGUAN --- */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="text-blue-600" /> 
                Tren Asupan: {chartTitle}
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevWeek}
                  className="p-2 bg-white/50 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={handleNextWeek}
                  disabled={isNextWeekDisabled}
                  className="p-2 bg-white/50 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
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

          {/* --- FITUR 1 (PENGGANTI): KONSISTENSI (Kiri Bawah) --- */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-6"
          >
            {/* Bagian Kiri: Donut Chart */}
            <div className="w-full md:w-1/2 h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={consistencyData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60} // Ini yang membuatnya jadi Donut
                    outerRadius={90}
                    paddingAngle={3}
                    isAnimationActive={true} // Animasi "fan-out" saat load
                  >
                    {consistencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-3xl font-extrabold text-gray-800">{totalConsistency}</div>
                <div className="text-sm text-gray-500">Hari Dicatat</div>
              </div>
            </div>
            
            {/* Bagian Kanan: Legenda & Streak */}
            <div className="w-full md:w-1/2 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Konsistensi (30 Hari)
              </h2>
              <ul className="space-y-3">
                {consistencyData.map((entry, index) => (
                  <li key={entry.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[index] }} />
                      <span className="text-gray-600">{entry.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{entry.value} Hari</span>
                  </li>
                ))}
              </ul>
              
              {/* FITUR BARU: KARTU STREAK */}
              <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-white/60 flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl text-white shadow-lg">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{streakData} Hari</div>
                  <div className="text-sm font-medium text-gray-500">Rentetan Sesuai Target</div>
                </div>
              </div>
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
                    <span className="text-sm font-medium text-gray-600">Hari Sukses</span>
                    <span className="text-lg font-bold text-emerald-600">{reportCardData.successDays} / {reportCardData.totalDays} hari</span>
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
                      {habitData.topByFrequency.map((item: HabitStats) => (
                        <li key={item.name} className="flex justify-between text-sm p-2 bg-white/40 rounded-lg">
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="text-gray-500 font-bold">{item.count}x</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Kontributor Kalori Terbanyak</h3>
                    <ul className="space-y-2">
                      {habitData.topByCalories.map((item: HabitStats) => (
                        <li key={item.name} className="flex justify-between text-sm p-2 bg-white/40 rounded-lg">
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="text-red-600 font-bold">{Math.round(item.totalCalories)} kkal</span>
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
    </div>
  )
}