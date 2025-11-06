'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Food } from '@/lib/supabase'
import { Heart, LogOut, Database, Search, Filter } from 'lucide-react'

export default function DatabasePanganPage() {
  const router = useRouter()
  const [foods, setFoods] = useState<Food[]>([])
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [loading, setLoading] = useState(true)

  const categories = ['Semua', 'Karbohidrat', 'Protein Hewani', 'Protein Nabati', 'Sayuran', 'Buah', 'Susu', 'Minuman']

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load all foods
      const { data: foodsData } = await supabase
        .from('foods')
        .select('*')
        .order('food_name', { ascending: true })

      setFoods(foodsData || [])
      setFilteredFoods(foodsData || [])
      setLoading(false)
    }
    checkUser()
  }, [router])

  // Filter foods
  useEffect(() => {
    let filtered = foods

    // Filter by category
    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(food => food.food_category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(food => 
        food.food_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredFoods(filtered)
  }, [searchQuery, selectedCategory, foods])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat database...</p>
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
              <a href="/riwayat" className="text-gray-700 hover:text-emerald-600">Riwayat</a>
              <a href="/kalkulator" className="text-emerald-600 font-semibold">Database Pangan</a>
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
            <Database className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Database Pangan TKPI
          </h1>
          <p className="text-gray-600">
            Tabel Komposisi Pangan Indonesia - {foods.length} makanan tersedia
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          {/* Search & Filter */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-black"
                placeholder="Cari makanan..."
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-5 h-5 text-gray-600 flex-shrink-0" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Menampilkan {filteredFoods.length} dari {foods.length} makanan
            </div>
          </div>

          {/* Foods Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Makanan</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Kategori</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Energi<br/><span className="text-xs font-normal">(kkal/100g)</span></th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Protein<br/><span className="text-xs font-normal">(g/100g)</span></th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Karbo<br/><span className="text-xs font-normal">(g/100g)</span></th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Lemak<br/><span className="text-xs font-normal">(g/100g)</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-600">
                      Tidak ada makanan ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredFoods.map((food, index) => (
                    <tr 
                      key={food.food_id} 
                      className={`border-b border-gray-100 hover:bg-emerald-50 transition ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{food.food_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          {food.food_category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-emerald-600">{food.energy_kcal}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-blue-600">{food.protein_g}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-amber-600">{food.carbs_g}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-purple-600">{food.fat_g}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            📚 Tentang Database TKPI
          </h3>
          <p className="text-gray-700 mb-4">
            Tabel Komposisi Pangan Indonesia (TKPI) merupakan database resmi yang berisi informasi 
            nilai gizi berbagai jenis pangan yang dikonsumsi masyarakat Indonesia. Data ini digunakan 
            sebagai acuan dalam sistem NutriCalc+ untuk memberikan kalkulasi gizi yang akurat.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700">
              ✅ Data Resmi Kemenkes
            </span>
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700">
              🇮🇩 Makanan Indonesia
            </span>
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700">
              📊 Per 100 gram
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}