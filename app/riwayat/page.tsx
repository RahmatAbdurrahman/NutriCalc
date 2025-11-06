'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Heart, LogOut, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

export default function RiwayatPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailyLogs, setDailyLogs] = useState<any[]>([])
  const [dailyTotal, setDailyTotal] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await loadDailyData(user.id, selectedDate)
      await loadWeeklyData(user.id)
      setLoading(false)
    }
    checkUser()
  }, [router, selectedDate])

  const loadDailyData = async (userId: string, date: Date) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: logs } = await supabase
      .from('daily_logs')
      .select(`
        *,
        foods (*)
      `)
      .eq('user_id', userId)
      .gte('consumed_at', startOfDay.toISOString())
      .lte('consumed_at', endOfDay.toISOString())
      .order('consumed_at', { ascending: false })

    setDailyLogs(logs || [])

    // Calculate totals
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0

    logs?.forEach((log: any) => {
      const multiplier = log.quantity_grams / 100
      totalCalories += log.foods.energy_kcal * multiplier
      totalProtein += log.foods.protein_g * multiplier
      totalCarbs += log.foods.carbs_g * multiplier
      totalFat += log.foods.fat_g * multiplier
    })

    setDailyTotal({
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    })
  }

  const loadWeeklyData = async (userId: string) => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: logs } = await supabase
      .from('daily_logs')
      .select(`
        consumed_at,
        quantity_grams,
        foods (energy_kcal)
      `)
      .eq('user_id', userId)
      .gte('consumed_at', sevenDaysAgo.toISOString())
      .order('consumed_at', { ascending: true })

    // Group by date
    const dailyData: { [key: string]: number } = {}
    
    logs?.forEach((log: any) => {
      const date = new Date(log.consumed_at).toLocaleDateString('id-ID')
      const calories = (log.quantity_grams / 100) * log.foods.energy_kcal
      dailyData[date] = (dailyData[date] || 0) + calories
    })

    // Create array for last 7 days
    const weekData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toLocaleDateString('id-ID')
      weekData.push({
        date: dateStr,
        day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        calories: Math.round(dailyData[dateStr] || 0)
      })
    }

    setWeeklyData(weekData)
  }

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const maxCaloriesInWeek = Math.max(...weeklyData.map(d => d.calories), 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat riwayat...</p>
        </div>
      </div>
    )
  }

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
              <a href="/dashboard" className="text-gray-700 hover:text-emerald-600">Dashboard</a>
              <a href="/riwayat" className="text-emerald-600 font-semibold">Riwayat</a>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block p-3 bg-emerald-100 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Riwayat Tracking Harian
          </h1>
          <p className="text-gray-600">
            Pantau progres asupan gizi Anda dari waktu ke waktu
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: Weekly Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Grafik 7 Hari Terakhir
              </h2>

              <div className="flex items-end justify-between gap-2 h-64">
                {weeklyData.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-teal-600 rounded-t-lg transition-all hover:opacity-80 relative group"
                        style={{ 
                          height: `${(day.calories / maxCaloriesInWeek) * 100}%`,
                          minHeight: day.calories > 0 ? '20px' : '0'
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.calories} kkal
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-600 mt-2">
                      {day.day}
                    </div>
                    <div className="text-xs text-gray-400">
                      {day.date.split('/')[0]}/{day.date.split('/')[1]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Summary */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePreviousDay}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>

                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedDate.toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h2>
                  </div>
                  {isToday && (
                    <span className="text-xs font-medium text-emerald-600">Hari Ini</span>
                  )}
                </div>

                <button
                  onClick={handleNextDay}
                  disabled={isToday}
                  className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Makanan yang dikonsumsi */}
              <div className="space-y-3">
                {dailyLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Tidak ada data untuk tanggal ini</p>
                  </div>
                ) : (
                  dailyLogs.map((log: any) => {
                    const multiplier = log.quantity_grams / 100
                    const calories = Math.round(log.foods.energy_kcal * multiplier)
                    const protein = Math.round(log.foods.protein_g * multiplier * 10) / 10
                    const carbs = Math.round(log.foods.carbs_g * multiplier * 10) / 10
                    const fat = Math.round(log.foods.fat_g * multiplier * 10) / 10

                    return (
                      <div key={log.log_id} className="p-4 border border-gray-200 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{log.foods.food_name}</h3>
                            <p className="text-sm text-gray-600">{log.quantity_grams}g</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-600">{calories} kkal</div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.consumed_at).toLocaleTimeString('id-ID', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
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
            </div>
          </div>

          {/* RIGHT: Daily Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Total {isToday ? 'Hari Ini' : 'Tanggal Dipilih'}
              </h2>

              <div className="space-y-4">
                {/* Calories */}
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-sm text-gray-700 mb-1">Total Kalori</div>
                  <div className="text-3xl font-bold text-emerald-600">
                    {dailyTotal.calories}
                  </div>
                  <div className="text-sm text-gray-600">kkal</div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {dailyTotal.protein}
                    </div>
                    <div className="text-xs text-gray-600">Protein (g)</div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {dailyTotal.carbs}
                    </div>
                    <div className="text-xs text-gray-600">Karbo (g)</div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {dailyTotal.fat}
                    </div>
                    <div className="text-xs text-gray-600">Lemak (g)</div>
                  </div>
                </div>

                {/* Average Weekly */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Rata-rata 7 Hari
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(weeklyData.reduce((sum, d) => sum + d.calories, 0) / 7)}
                    </div>
                    <div className="text-sm text-gray-600">kkal/hari</div>
                  </div>
                </div>

                {/* Total Weekly */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
                  <div className="text-sm text-gray-700 mb-1">Total Minggu Ini</div>
                  <div className="text-3xl font-bold text-emerald-600">
                    {weeklyData.reduce((sum, d) => sum + d.calories, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">kkal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}