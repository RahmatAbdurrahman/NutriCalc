'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Heart, 
  LogOut, 
  Plus, 
  Search, 
  X, 
  Target,
  Activity,
  Edit,
  Save,
  Ruler,
  Weight
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [nutritionTarget, setNutritionTarget] = useState<any>(null)
  const [todayLogs, setTodayLogs] = useState<any[]>([])
  const [todayTotal, setTodayTotal] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })

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
  const [updateFormData, setUpdateFormData] = useState({
    berat_kg: '',
    tinggi_cm: '',
    level_aktivitas: 1.55
  })

  const [loading, setLoading] = useState(true)
  const [addingFood, setAddingFood] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Load user and profile
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        router.push('/lengkapi-profil')
        return
      }

      setProfile(profileData)
      
      // Set form data
      setUpdateFormData({
        berat_kg: profileData.berat_kg.toString(),
        tinggi_cm: profileData.tinggi_cm.toString(),
        level_aktivitas: profileData.level_aktivitas
      })

      // Calculate nutrition target
      const age = calculateAge(profileData.tgl_lahir)
      const nutritionData = await calculateNutrition({
        usia: age,
        gender: profileData.gender,
        berat_kg: profileData.berat_kg,
        tinggi_cm: profileData.tinggi_cm,
        level_aktivitas: profileData.level_aktivitas
      })

      setNutritionTarget(nutritionData.data)

      // Load today's food logs
      await loadTodayLogs(user.id)

      setLoading(false)
    }

    loadData()
  }, [router])

  // Load today's food logs
  const loadTodayLogs = async (userId: string) => {
    const logs = await getTodayFoodLogs(userId)
    setTodayLogs(logs)

    // Calculate totals
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0

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

  // Update profile & recalculate
  const handleUpdateData = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          berat_kg: parseFloat(updateFormData.berat_kg),
          tinggi_cm: parseInt(updateFormData.tinggi_cm),
          level_aktivitas: updateFormData.level_aktivitas
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Recalculate nutrition
      const age = calculateAge(profile.tgl_lahir)
      const nutritionData = await calculateNutrition({
        usia: age,
        gender: profile.gender,
        berat_kg: parseFloat(updateFormData.berat_kg),
        tinggi_cm: parseInt(updateFormData.tinggi_cm),
        level_aktivitas: updateFormData.level_aktivitas
      })

      setNutritionTarget(nutritionData.data)
      
      // Update local profile
      setProfile({
        ...profile,
        berat_kg: parseFloat(updateFormData.berat_kg),
        tinggi_cm: parseInt(updateFormData.tinggi_cm),
        level_aktivitas: updateFormData.level_aktivitas
      })

      setShowUpdateDataModal(false)
      alert('✅ Data berhasil diperbarui!')
    } catch (error) {
      console.error('Error updating data:', error)
      alert('❌ Gagal memperbarui data')
    } finally {
      setUpdating(false)
    }
  }

  // Search foods
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      const results = await searchFoods(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  // Select food
  const handleSelectFood = async (food: Food) => {
    setSelectedFood(food)
    const urts = await getFoodURTs(food.food_id)
    setFoodURTs(urts)
    if (urts.length > 0) {
      setSelectedURT(urts[0])
    }
  }

  // Add food to journal
  const handleAddFood = async () => {
    if (!selectedFood || !selectedURT || !user) return

    setAddingFood(true)

    try {
      const totalGrams = selectedURT.equivalent_grams * quantity

      await addFoodLog({
        user_id: user.id,
        food_id: selectedFood.food_id,
        quantity_grams: totalGrams,
        meal_type: mealType,
        consumed_at: new Date().toISOString()
      })

      // Reload logs
      await loadTodayLogs(user.id)

      // Reset modal
      setShowAddFoodModal(false)
      setSearchQuery('')
      setSearchResults([])
      setSelectedFood(null)
      setSelectedURT(null)
      setQuantity(1)
    } catch (error) {
      console.error('Error adding food:', error)
      alert('Gagal menambahkan makanan')
    } finally {
      setAddingFood(false)
    }
  }

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const calorieProgress = nutritionTarget ? (todayTotal.calories / nutritionTarget.tdee) * 100 : 0
  const proteinProgress = nutritionTarget ? (todayTotal.protein / nutritionTarget.protein_g) * 100 : 0
  const carbsProgress = nutritionTarget ? (todayTotal.carbs / nutritionTarget.carbs_g) * 100 : 0
  const fatProgress = nutritionTarget ? (todayTotal.fat / nutritionTarget.fat_g) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="NutriCalc+ Logo"
                className="mb-1 w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                NutriCalc+
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-emerald-600 font-semibold">Dashboard</a>
              <a href="/riwayat" className="text-gray-700 hover:text-emerald-600">Riwayat</a>
              <a href="/kalkulator" className="text-gray-700 hover:text-emerald-600">Database Pangan</a>
              <a href="/artikel" className="text-gray-700 hover:text-emerald-600">Artikel</a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Mari tracking asupan gizi Anda hari ini
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: Target Harian */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Target Harian
                </h2>
                <button
                  onClick={() => setShowUpdateDataModal(true)}
                  className="p-2 hover:bg-emerald-50 rounded-lg transition group"
                  title="Perbarui Data"
                >
                  <Edit className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                </button>
              </div>

              {nutritionTarget && (
                <div className="space-y-4">
                  {/* Calories */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Kalori</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {todayTotal.calories} / {nutritionTarget.tdee} kkal
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(calorieProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Protein */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Protein</span>
                      <span className="text-sm font-bold text-blue-600">
                        {todayTotal.protein}g / {nutritionTarget.protein_g}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(proteinProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Karbohidrat</span>
                      <span className="text-sm font-bold text-amber-600">
                        {todayTotal.carbs}g / {nutritionTarget.carbs_g}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-amber-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(carbsProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Fat */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Lemak</span>
                      <span className="text-sm font-bold text-purple-600">
                        {todayTotal.fat}g / {nutritionTarget.fat_g}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(fatProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* BMI Info */}
                  <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
                    <div className="text-sm text-gray-700 mb-1">BMI Anda</div>
                    <div className="text-2xl font-bold text-emerald-600">{nutritionTarget.bmi}</div>
                    <div className="text-sm text-gray-600">{nutritionTarget.bmi_category}</div>
                  </div>

                  {/* Info Metode */}
                  <div className="text-xs text-gray-500 text-center">
                    {nutritionTarget.calculation_method}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Food Journal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Jurnal Makanan Hari Ini
                </h2>
                <button
                  onClick={() => setShowAddFoodModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Makanan
                </button>
              </div>

              {/* Food List */}
              <div className="space-y-3 mb-6">
                {todayLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Belum ada makanan dicatat hari ini</p>
                    <p className="text-sm text-gray-500 mt-2">Mulai tambahkan makanan yang Anda konsumsi</p>
                  </div>
                ) : (
                  todayLogs.map((log: any) => {
                    const multiplier = log.quantity_grams / 100
                    const calories = Math.round(log.foods.energy_kcal * multiplier)
                    const protein = Math.round(log.foods.protein_g * multiplier * 10) / 10
                    const carbs = Math.round(log.foods.carbs_g * multiplier * 10) / 10
                    const fat = Math.round(log.foods.fat_g * multiplier * 10) / 10

                    return (
                      <div key={log.log_id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{log.foods.food_name}</h3>
                            <p className="text-sm text-gray-600">{log.quantity_grams}g</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-600">{calories} kkal</div>
                            <div className="text-xs text-gray-500">{new Date(log.consumed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span>P: {protein}g</span>
                          <span>K: {carbs}g</span>
                          <span>L: {fat}g</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Link to History */}
              <div className="text-center">
                <a
                  href="/riwayat"
                  className="inline-block px-6 py-2 text-emerald-600 hover:text-emerald-700 font-medium transition"
                >
                  Lihat Riwayat Lengkap →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPDATE DATA MODAL */}
      {showUpdateDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Perbarui Data Profil</h2>
              <button
                onClick={() => setShowUpdateDataModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateData} className="space-y-6">
              {/* Berat & Tinggi */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                      Berat Badan (kg)
                    </div>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={updateFormData.berat_kg}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, berat_kg: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Tinggi Badan (cm)
                    </div>
                  </label>
                  <input
                    type="number"
                    value={updateFormData.tinggi_cm}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, tinggi_cm: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-black"
                    required
                  />
                </div>
              </div>

              {/* Level Aktivitas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level Aktivitas Fisik
                </label>
                <select
                  value={updateFormData.level_aktivitas}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, level_aktivitas: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-black"
                >
                  {activityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} - {level.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {updating ? 'Menyimpan...' : 'Simpan & Hitung Ulang'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD FOOD MODAL - (sama seperti sebelumnya) */}
      {showAddFoodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tambah Makanan</h2>
              <button
                onClick={() => {
                  setShowAddFoodModal(false)
                  setSearchQuery('')
                  setSearchResults([])
                  setSelectedFood(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-black" />
              </button>
            </div>

            {!selectedFood ? (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-black"
                    placeholder="Cari makanan... (min 3 huruf)"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  {searchResults.map((food) => (
                    <button
                      key={food.food_id}
                      onClick={() => handleSelectFood(food)}
                      className="w-full p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition text-left"
                    >
                      <div className="font-semibold text-gray-900">{food.food_name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {food.energy_kcal} kkal · P: {food.protein_g}g · K: {food.carbs_g}g · L: {food.fat_g}g (per 100g)
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <h3 className="font-bold text-lg text-gray-900">{selectedFood.food_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedFood.energy_kcal} kkal per 100g
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Waktu Makan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'sarapan', label: '🌅 Sarapan' },
                      { value: 'makan_siang', label: '☀️ Makan Siang' },
                      { value: 'makan_malam', label: '🌙 Makan Malam' },
                      { value: 'snack', label: '🍎 Snack' }
                    ].map((meal) => (
                      <button
                        key={meal.value}
                        type="button"
                        onClick={() => setMealType(meal.value as any)}
                        className={`p-3 border-2 rounded-xl transition ${
                          mealType === meal.value
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {meal.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran</label>
                  <select
                    value={selectedURT?.urt_id || ''}
                    onChange={(e) => {
                      const urt = foodURTs.find(u => u.urt_id === e.target.value)
                      setSelectedURT(urt || null)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black"
                  >
                    {foodURTs.map((urt) => (
                      <option key={urt.urt_id} value={urt.urt_id}>
                        {urt.urt_name} ({urt.equivalent_grams}g)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                    min="0.1"
                    step="0.5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black"
                  />
                </div>

                {selectedURT && (
                  <div className="p-4 bg-blue-50 rounded-xl mb-6">
                    <div className="text-sm text-gray-700 mb-2">Total yang akan dicatat:</div>
                    <div className="font-bold text-lg text-blue-600">
                      {Math.round((selectedURT.equivalent_grams * quantity / 100) * selectedFood.energy_kcal)} kkal
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedURT.equivalent_grams * quantity}g
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleAddFood}
                    disabled={addingFood}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50"
                  >
                    {addingFood ? 'Menambahkan...' : 'Tambahkan'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}