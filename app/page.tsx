'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei'
import { Calculator, TrendingUp, Heart, Target } from 'lucide-react'
import { calculateNutrition, activityLevels } from '@/lib/supabase'

// =====================================================
// 3D ANIMATED SPHERE (Hero Section)
// =====================================================
function AnimatedSphere() {
  return (
    <Sphere args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial
        color="#10b981"
        attach="material"
        distort={0.4}
        speed={2}
        roughness={0.2}
      />
    </Sphere>
  )
}

// =====================================================
// MAIN LANDING PAGE COMPONENT
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

    try {
      const data = {
        usia: parseInt(formData.usia),
        gender: formData.gender,
        berat_kg: parseFloat(formData.berat_kg),
        tinggi_cm: parseFloat(formData.tinggi_cm),
        level_aktivitas: formData.level_aktivitas
      }

      const response = await calculateNutrition(data)
      setResult(response.data)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
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
            <div className="flex gap-4">
              <a href="/login" className="px-4 py-2 text-gray-700 hover:text-emerald-600 transition">
                Masuk
              </a>
              <a href="/register" className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all">
                Daftar Gratis
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium">
                ✨ Platform Gizi Terpadu Indonesia
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Hitung Kebutuhan
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {' '}Gizi Personal{' '}
                </span>
                Anda
              </h1>

              <p className="text-xl text-gray-600">
                Kalkulasi ilmiah disesuaikan dengan usia, gender, dan aktivitas Anda. 
                Dapatkan target kalori, protein, karbohidrat, dan lemak yang akurat.
              </p>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Kalkulasi Akurat</div>
                    <div className="text-sm text-gray-600">Berbasis riset ilmiah</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Tracking Harian</div>
                    <div className="text-sm text-gray-600">Monitor progres Anda</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[400px] lg:h-[500px] flex items-center justify-center relative overflow-hidden">
  
            <img
              src="public/char.png"
              alt="Low-Poly Character"
              className="
                w-full h-full object-contain // Pastikan gambar terlihat dengan baik
                animate-floatAndRotate // Nama animasi custom Anda
                transition-transform duration-300 ease-in-out
                hover:scale-105 hover:rotate-2 // Efek saat hover
              "
            />

            <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-emerald-300 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-pulseLight"></div>
            <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-teal-300 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-pulseLight delay-100"></div>
          </div>
          </div>
        </div>
      </section>

      {/* CALCULATOR SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Kalkulator Gizi Cepat
            </h2>
            <p className="text-gray-600">
              Masukkan data Anda untuk mendapatkan rekomendasi gizi personal
            </p>
          </div>

          <form onSubmit={handleCalculate} className="space-y-6">
            {/* Usia & Gender */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usia (tahun)
                </label>
                <input
                  type="number"
                  value={formData.usia}
                  onChange={(e) => setFormData({ ...formData, usia: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-black"
                  placeholder="25"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'pria' | 'wanita' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-black"
                >
                  <option value="pria">Pria</option>
                  <option value="wanita">Wanita</option>
                </select>
              </div>
            </div>

            {/* Berat & Tinggi */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.berat_kg}
                  onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-black"
                  placeholder="70"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tinggi Badan (cm)
                </label>
                <input
                  type="number"
                  value={formData.tinggi_cm}
                  onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-black"
                  placeholder="170"
                  required
                />
              </div>
            </div>

            {/* Level Aktivitas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level Aktivitas
              </label>
              <select
                value={formData.level_aktivitas}
                onChange={(e) => setFormData({ ...formData, level_aktivitas: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-black"
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menghitung...' : '🧮 Hitung Kebutuhan Gizi'}
            </button>
          </form>

          {/* RESULT MODAL/CARD */}
          {result && (
            <div className="mt-10 p-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                📊 Hasil Kalkulasi Anda
              </h3>

              {/* Main Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-emerald-600">{result.tdee}</div>
                  <div className="text-sm text-gray-600">Kalori/Hari</div>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.protein_g}g</div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-amber-600">{result.carbs_g}g</div>
                  <div className="text-sm text-gray-600">Karbohidrat</div>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-purple-600">{result.fat_g}g</div>
                  <div className="text-sm text-gray-600">Lemak</div>
                </div>
              </div>

              {/* BMI & Category */}
              <div className="bg-white p-4 rounded-xl mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">BMI Anda:</span>
                  <span className="font-bold text-lg">{result.bmi}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-700">Kategori:</span>
                  <span className="font-semibold text-emerald-600">{result.bmi_category}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Daftar sekarang untuk tracking progres dan fitur lengkap!
                </p>
                <a
                  href="/register"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all"
                >
                  🚀 Daftar Gratis Sekarang
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Kenapa Memilih NutriCalc+?
          </h2>
          <p className="text-xl text-gray-600">
            Platform gizi terlengkap dengan teknologi terkini
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Kalkulasi Presisi
            </h3>
            <p className="text-gray-600">
              Menggunakan Strategy Design Pattern untuk perhitungan yang disesuaikan dengan segmen usia (anak, dewasa, lansia).
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Tracking Mudah
            </h3>
            <p className="text-gray-600">
              Catat makanan harian Anda dengan database TKPI lengkap dan konversi URT (Ukuran Rumah Tangga).
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Edukasi Gizi
            </h3>
            <p className="text-gray-600">
              Akses artikel dan panduan gizi dari sumber terpercaya seperti Kemenkes dan WHO.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-bold">NutriCalc+</span>
          </div>
          <p className="text-gray-400">
            Platform Kalkulasi Gizi Personal untuk Indonesia
          </p>
          <p className="text-gray-500 text-sm mt-4">
            © 2024 NutriCalc+. Powered by Strategy Design Pattern.
          </p>
        </div>
      </footer>
    </div>
  )
}