'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  supabase, 
  calculateNutrition, 
  calculateAge, 
  getTodayFoodLogs,
  searchFoods,
  getFoodURTs,
  addFoodLog,
  activityLevels,
  type Food,
  type URTConversion
} from '@/lib/supabase'
import { 
  Heart, LogOut, Plus, Search, X, Target, Activity, Edit, Save, Ruler, Weight, ChevronRight, Flame, Zap, Droplet
} from 'lucide-react'

// 1. REUSABLE 3D BACKGROUND
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

// 2. MAIN DASHBOARD COMPONENT
export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [nutritionTarget, setNutritionTarget] = useState<any>(null)
  const [todayLogs, setTodayLogs] = useState<any[]>([])
  const [todayTotal, setTodayTotal] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })

  // Modal states
  const [showAddFoodModal, setShowAddFoodModal] = useState(false)
  const [showUpdateDataModal, setShowUpdateDataModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [foodURTs, setFoodURTs] = useState<URTConversion[]>([])
  const [selectedURT, setSelectedURT] = useState<URTConversion | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [mealType, setMealType] = useState<'sarapan' | 'makan_siang' | 'makan_malam' | 'snack'>('sarapan')

  // Update data form
  const [updateFormData, setUpdateFormData] = useState({ berat_kg: '', tinggi_cm: '', level_aktivitas: 1.55 })

  const [loading, setLoading] = useState(true)
  const [addingFood, setAddingFood] = useState(false)
  const [updating, setUpdating] = useState(false)

  // --- LOGIC: KEEP EXISTING LOGIC INTACT ---
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profileData) { router.push('/lengkapi-profil'); return }
      setProfile(profileData)
      
      setUpdateFormData({
        berat_kg: profileData.berat_kg.toString(),
        tinggi_cm: profileData.tinggi_cm.toString(),
        level_aktivitas: profileData.level_aktivitas
      })

      const age = calculateAge(profileData.tgl_lahir)
      const nutritionData = await calculateNutrition({
        usia: age, gender: profileData.gender, berat_kg: profileData.berat_kg, tinggi_cm: profileData.tinggi_cm, level_aktivitas: profileData.level_aktivitas
      })
      setNutritionTarget(nutritionData.data)
      await loadTodayLogs(user.id)
      setLoading(false)
    }
    loadData()
  }, [router])

  const loadTodayLogs = async (userId: string) => {
    const logs = await getTodayFoodLogs(userId)
    setTodayLogs(logs)
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
    logs.forEach((log: any) => {
      const multiplier = log.quantity_grams / 100
      totalCalories += log.foods.energy_kcal * multiplier
      totalProtein += log.foods.protein_g * multiplier
      totalCarbs += log.foods.carbs_g * multiplier
      totalFat += log.foods.fat_g * multiplier
    })
    setTodayTotal({
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    })
  }

  const handleUpdateData = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const { error: updateError } = await supabase.from('profiles').update({
          berat_kg: parseFloat(updateFormData.berat_kg),
          tinggi_cm: parseInt(updateFormData.tinggi_cm),
          level_aktivitas: updateFormData.level_aktivitas
        }).eq('id', user.id)
      if (updateError) throw updateError

      const age = calculateAge(profile.tgl_lahir)
      const nutritionData = await calculateNutrition({
        usia: age, gender: profile.gender, berat_kg: parseFloat(updateFormData.berat_kg), tinggi_cm: parseInt(updateFormData.tinggi_cm), level_aktivitas: updateFormData.level_aktivitas
      })
      setNutritionTarget(nutritionData.data)
      setProfile({ ...profile, berat_kg: parseFloat(updateFormData.berat_kg), tinggi_cm: parseInt(updateFormData.tinggi_cm), level_aktivitas: updateFormData.level_aktivitas })
      setShowUpdateDataModal(false)
    } catch (error) { console.error('Error:', error) } finally { setUpdating(false) }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) { const results = await searchFoods(query); setSearchResults(results) } else { setSearchResults([]) }
  }

  const handleSelectFood = async (food: Food) => {
    setSelectedFood(food)
    const urts = await getFoodURTs(food.food_id)
    setFoodURTs(urts)
    if (urts.length > 0) { setSelectedURT(urts[0]) }
  }

  const handleAddFood = async () => {
    if (!selectedFood || !selectedURT || !user) return
    setAddingFood(true)
    try {
      const totalGrams = selectedURT.equivalent_grams * quantity
      await addFoodLog({ user_id: user.id, food_id: selectedFood.food_id, quantity_grams: totalGrams, meal_type: mealType, consumed_at: new Date().toISOString() })
      await loadTodayLogs(user.id)
      setShowAddFoodModal(false); setSearchQuery(''); setSearchResults([]); setSelectedFood(null); setSelectedURT(null); setQuantity(1)
    } catch (error) { console.error('Error:', error) } finally { setAddingFood(false) }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  // Progress Calculation
  const calorieProgress = nutritionTarget ? (todayTotal.calories / nutritionTarget.tdee) * 100 : 0
  const proteinProgress = nutritionTarget ? (todayTotal.protein / nutritionTarget.protein_g) * 100 : 0
  const carbsProgress = nutritionTarget ? (todayTotal.carbs / nutritionTarget.carbs_g) * 100 : 0
  const fatProgress = nutritionTarget ? (todayTotal.fat / nutritionTarget.fat_g) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-emerald-700 font-medium animate-pulse">Memuat data biometrik...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen text-gray-800 font-sans overflow-x-hidden">
      <AnimatedBackground />

      {/* --- GLASS NAVBAR (FIXED) --- */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <motion.img src="/logo.png" alt="Logo" whileHover={{ rotate: 10, scale: 1.1 }} className="w-10 h-10 mb-1.5 rounded-xl object-cover shadow-lg shadow-emerald-500/20" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-emerald-800">
                NutriCalc<span className="text-emerald-500">+</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                <a href="/dashboard" className="text-emerald-700 font-bold">Dashboard</a>
                <a href="/riwayat" className="hover:text-emerald-600 transition">Riwayat</a>
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
        
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex justify-between items-end"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">              Halo, <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-teal-500">{user?.email?.split('@')[0]}</span> 👋
            </h1>
            <p className="text-gray-500 font-medium">Ayo capai target nutrisi hari ini!</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: TARGETS --- */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-8"
          >
            <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Target size={20} /></div>
                  Target Harian
                </h2>
                <button onClick={() => setShowUpdateDataModal(true)} className="p-2 hover:bg-white/80 rounded-full transition shadow-sm border border-transparent hover:border-emerald-100 text-gray-500 hover:text-emerald-600">
                  <Edit size={18} />
                </button>
              </div>

              {nutritionTarget && (
                <div className="space-y-6 relative z-10">
                  {/* Calories Circle/Bar */}
                  <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-bold text-gray-600 flex items-center gap-1"><Flame size={14} className="text-orange-500"/> Kalori</span>
                      <span className="text-sm font-bold text-emerald-600">{todayTotal.calories} / {nutritionTarget.tdee}</span>
                    </div>
                    <div className="w-full bg-gray-200/50 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${Math.min(calorieProgress, 100)}%` }}
                        className="h-full bg-linear-to-r from-orange-400 to-red-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Macros Grid */}
                  <div className="space-y-4">
                     {/* Protein */}
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1 text-gray-500">
                          <span className="flex items-center gap-1"><Zap size={12} className="text-blue-500"/> Protein</span>
                          <span>{todayTotal.protein} / {nutritionTarget.protein_g}g</span>
                       </div>
                       <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                         {/* Tailwind FIX: bg-gradient-to-r -> bg-linear-to-r */}
                         <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(proteinProgress, 100)}%` }} className="h-full bg-linear-to-r from-blue-400 to-blue-600" />
                       </div>
                     </div>
                     {/* Carbs */}
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1 text-gray-500">
                          <span className="flex items-center gap-1"><Activity size={12} className="text-amber-500"/> Karbo</span>
                          <span>{todayTotal.carbs} / {nutritionTarget.carbs_g}g</span>
                       </div>
                       <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(carbsProgress, 100)}%` }} className="h-full bg-linear-to-r from-amber-400 to-yellow-500" />
                       </div>
                     </div>
                     {/* Fat */}
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1 text-gray-500">
                          <span className="flex items-center gap-1"><Droplet size={12} className="text-purple-500"/> Lemak</span>
                          <span>{todayTotal.fat} / {nutritionTarget.fat_g}g</span>
                       </div>
                       <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                         {/* Tailwind FIX: bg-gradient-to-r -> bg-linear-to-r */}
                         <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(fatProgress, 100)}%` }} className="h-full bg-linear-to-r from-purple-400 to-purple-600" />
                       </div>
                     </div>
                  </div>

                  {/* BMI Card */}
                  <div className="mt-4 p-4 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                    <div className="text-xs font-medium opacity-80">Status BMI</div>
                    <div className="flex justify-between items-end mt-1">
                      <div className="text-3xl font-bold">{nutritionTarget.bmi}</div>
                      <div className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                        {nutritionTarget.bmi_category}
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-gray-400 font-medium pt-2">
                    Metode Kalkulasi: {nutritionTarget.calculation_method}
                  </div>
                </div>
              )}
              {/* Decor */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl" />
            </div>
          </motion.div>

          {/* --- RIGHT COLUMN: JOURNAL --- */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-8 min-h-[500px] relative">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Activity size={24} /></div>
                  Jurnal Makanan
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddFoodModal(true)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                >
                  <Plus size={20} /> Tambah Menu
                </motion.button>
              </div>

              <div className="space-y-4">
                {todayLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300/50 rounded-3xl bg-white/20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                      <Search size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">Belum ada makanan tercatat.</p>
                    <p className="text-sm text-gray-400">Mulai hari sehatmu sekarang!</p>
                  </div>
                ) : (
                  todayLogs.map((log: any, idx) => {
                    const multiplier = log.quantity_grams / 100
                    return (
                      <motion.div 
                        key={log.log_id} 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.8)' }}
                        className="p-5 bg-white/40 border border-white/60 rounded-2xl shadow-sm flex justify-between items-center group transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-linear-to-br from-orange-100 to-yellow-100 rounded-xl flex items-center justify-center text-2xl">
                              {log.meal_type === 'sarapan' ? '🌅' : log.meal_type === 'makan_siang' ? '☀️' : log.meal_type === 'makan_malam' ? '🌙' : '🍎'}
                           </div>
                           <div>
                              <h3 className="font-bold text-gray-800 text-lg">{log.foods.food_name}</h3>
                              <div className="flex gap-3 text-xs text-gray-500 font-medium mt-1">
                                <span className="bg-white/50 px-2 py-1 rounded-md">{log.quantity_grams}g</span>
                                <span className="flex items-center gap-1"><Zap size={10} /> {Math.round(log.foods.protein_g * multiplier)}g P</span>
                                <span className="flex items-center gap-1"><Activity size={10} /> {Math.round(log.foods.carbs_g * multiplier)}g K</span>
                                <span className="flex items-center gap-1"><Droplet size={10} /> {Math.round(log.foods.fat_g * multiplier)}g L</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xl font-extrabold text-emerald-600">{Math.round(log.foods.energy_kcal * multiplier)}</div>
                           <div className="text-xs text-gray-400 font-medium">kkal</div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
              
              {todayLogs.length > 0 && (
                <div className="text-center mt-8">
                  <a
                    href="/riwayat"
                    className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-800 transition group"
                  >
                    Lihat Riwayat Lengkap 
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showUpdateDataModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-xl rounded-4xl w-full max-w-md p-8 border border-white/50 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Update Biometrik</h2>
                <button onClick={() => setShowUpdateDataModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X size={20}/></button>
              </div>
              <form onSubmit={handleUpdateData} className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-sm font-bold text-gray-600 mb-1 block">Berat (kg)</label>
                       <input type="number" step="0.1" value={updateFormData.berat_kg} onChange={e => setUpdateFormData({...updateFormData, berat_kg: e.target.value})} 
                         className="w-full bg-white/50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                       <label className="text-sm font-bold text-gray-600 mb-1 block">Tinggi (cm)</label>
                       <input type="number" value={updateFormData.tinggi_cm} onChange={e => setUpdateFormData({...updateFormData, tinggi_cm: e.target.value})} 
                         className="w-full bg-white/50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-gray-600 mb-1 block">Aktivitas</label>
                    <select value={updateFormData.level_aktivitas} onChange={e => setUpdateFormData({...updateFormData, level_aktivitas: parseFloat(e.target.value)})}
                      className="w-full bg-white/50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer">
                      {activityLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                 </div>
                 <button type="submit" disabled={updating} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2">
                    {updating ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
                 </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAddFoodModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
               initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
               className="bg-white/95 backdrop-blur-xl rounded-4xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-white/50 shadow-2xl overflow-hidden"
            >
               {/* Header */}
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
                  <h2 className="text-2xl font-bold text-gray-800">Tambah Asupan</h2>
                  <button onClick={() => {setShowAddFoodModal(false); setSelectedFood(null); setSearchQuery('')}} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {!selectedFood ? (
                    <div className="space-y-4">
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} autoFocus
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg" placeholder="Cari nasi goreng, dada ayam..." />
                       </div>
                       <div className="space-y-2">
                          {searchResults.map(food => (
                             <motion.button whileHover={{ scale: 1.01, x: 5 }} key={food.food_id} onClick={() => handleSelectFood(food)}
                               className="w-full p-4 flex justify-between items-center bg-white border border-gray-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition text-left shadow-sm">
                                <div>
                                   <div className="font-bold text-gray-800">{food.food_name}</div>
                                   <div className="text-xs text-gray-500 mt-1">{food.energy_kcal} kkal / 100g</div>
                                </div>
                                <div className="p-2 bg-white rounded-lg text-emerald-600"><ChevronRight size={18}/></div>
                             </motion.button>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                       <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                          <div>
                             <h3 className="font-bold text-xl text-gray-900">{selectedFood.food_name}</h3>
                             <p className="text-sm text-emerald-700 font-medium">{selectedFood.energy_kcal} kkal (per 100g)</p>
                          </div>
                          <button onClick={() => setSelectedFood(null)} className="text-sm text-emerald-600 hover:underline">Ubah</button>
                       </div>
                       
                       {/* Meal Type Selector */}
                       <div>
                         <label className="text-sm font-bold text-gray-600 mb-2 block">Waktu Makan</label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {/* TypeScript Kritis FIX Line 504: v. -> v: */}
                            {[{v:'sarapan',l:'🌅 Pagi'},{v:'makan_siang',l:'☀️ Siang'},{v:'makan_malam',l:'🌙 Malam'},{v:'snack',l:'🍎 Snack'}].map(m => (
                               <button key={m.v} onClick={() => setMealType(m.v as any)} 
                                 className={`py-3 rounded-xl text-sm font-bold transition border ${mealType===m.v ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                 {m.l}
                               </button>
                            ))}
                         </div>
                       </div>

                       {/* Quantity & URT */}
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-sm font-bold text-gray-600 mb-2 block">Satuan</label>
                             <select onChange={e => setSelectedURT(foodURTs.find(u => u.urt_id === e.target.value) || null)} 
                               className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500">
                                {/* TypeScript Kritis FIX Line 519: u.urt_d -> u.urt_id */}
                                {foodURTs.map(u => <option key={u.urt_id} value={u.urt_id}>{u.urt_name} ({u.equivalent_grams}g)</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="text-sm font-bold text-gray-600 mb-2 block">Jumlah</label>
                             <input type="number" step="0.5" min="0.5" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value))}
                               className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                          </div>
                       </div>
                       
                       {/* Summary Card */}
                       {selectedURT && (
                          <div className="p-5 bg-gray-900 text-white rounded-2xl shadow-xl flex justify-between items-center">
                             <div>
                                <div className="text-gray-400 text-sm font-medium">Total Asupan</div>
                                <div className="text-2xl font-bold">{Math.round((selectedURT.equivalent_grams * quantity / 100) * selectedFood.energy_kcal)} kkal</div>
                             </div>
                             <div className="text-right">
                                <div className="text-sm font-bold text-emerald-400">{selectedURT.equivalent_grams * quantity} gram</div>
                             </div>
                          </div>
                       )}

                       {/* Tombol Kembali dan Simpan */}
                       <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setSelectedFood(null)}
                            className="flex-1 py-3 bg-white/80 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-700 font-bold"
                          >
                            Kembali
                          </button>
                          {/* Tailwind FIX: bg-gradient-to-r -> bg-linear-to-r */}
                          <button
                            onClick={handleAddFood}
                            disabled={addingFood}
                            className="flex-1 py-3 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 transition transform active:scale-95"
                          >
                            {addingFood ? 'Menyimpan...' : 'Simpan'}
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}