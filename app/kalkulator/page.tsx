'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { motion } from 'framer-motion'
import { supabase, type Food } from '@/lib/supabase'
import { 
  LogOut, Database, Search, Flame, Zap, Droplet, Activity, Download, Loader2, ExternalLink 
} from 'lucide-react'

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


export default function DatabasePanganPage() {
  const router = useRouter()
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false) 

  useEffect(() => {
    const fetchFilteredFoods = async () => {
      setLoading(true)
      let query = supabase.from('foods').select('*')
      if (searchQuery.length > 2) {
        query = query.ilike('food_name', `%${searchQuery}%`)
      }
      query = query.limit(30).order('food_name', { ascending: true })
      const { data: foodsData, error } = await query
      if (error) {
        console.error('Error fetching foods:', error)
      }
      setFilteredFoods(foodsData || [])
      setLoading(false)
    }
    const handler = setTimeout(() => {
      fetchFilteredFoods()
    }, 300) 
    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery, router]) 

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDownloadCSV = async () => {
    setIsDownloading(true)
    try {
      const { data: allFoods, error } = await supabase
        .from('foods')
        .select('food_name, energy_kcal, protein_g, carbs_g, fat_g') 
        .order('food_name', { ascending: true })
      if (error) throw error
      if (!allFoods || allFoods.length === 0) {
        setIsDownloading(false)
        return
      }
      const headers = "food_name,energy_kcal,protein_g,carbs_g,fat_g";
      const rows = allFoods.map(food => 
        `${food.food_name.replace(/,/g, '')},${food.energy_kcal},${food.protein_g},${food.carbs_g},${food.fat_g}`
      );
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "database_pangan_nutricalc.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error downloading CSV:', err.message);
      alert('Gagal mengunduh CSV: ' + err.message);
    } finally {
      setIsDownloading(false)
    }
  };

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
                <a href="/riwayat" className="hover:text-emerald-600 transition">Riwayat</a>
                <a href="/kalkulator" className="text-emerald-700 font-bold">Database Pangan</a>
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
        
        {/* 2. HEADER DIPERBARUI DENGAN TOMBOL BARU */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Kiri: Judul */}
            <div>
              <div className="inline-block p-4 bg-white/50 backdrop-blur-lg rounded-2xl mb-4 border border-white/60">
                <Database className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                Database Pangan TKPI
              </h1>
              <p className="text-gray-500 font-medium">
                Tabel Komposisi Pangan Indonesia. (Menampilkan 30 hasil teratas)
              </p>
            </div>
            
            {/* Kanan: Grup Tombol Aksi */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Tombol 1: Download CSV */}
              <motion.button
                onClick={handleDownloadCSV}
                disabled={isDownloading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 px-6 py-3 bg-white/80 backdrop-blur-md border border-white/60 rounded-xl font-bold text-gray-800 shadow-md hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download CSV
                  </>
                )}
              </motion.button>

              {/* Tombol 2: Kunjungi Penyedia (BARU) */}
              <motion.a
                href="http://www.panganku.org"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Kunjungi Panganku.org
              </motion.a>
            </div>

          </div>
        </motion.div>

        {/* Kontainer Filter & Hasil */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-4xl shadow-xl p-6"
        >
          {/* Search */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-transparent focus:border-emerald-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 placeholder-gray-500 transition focus:bg-white"
                placeholder="Cari makanan (min. 3 huruf)..."
              />
            </div>
          </div>

          {/* --- Grid Kartu Kaca --- */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <Search size={40} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold">Tidak Ada Makanan Ditemukan</h3>
              <p>Coba ubah kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map((food, index) => (
                <motion.div
                  key={food.food_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-3xl p-5 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {food.food_name}
                    </h3>
                  </div>
                  
                  <div className="border-t border-white/80 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5"><Flame size={14} className="text-orange-500" /> Energi</span>
                      <span className="font-bold text-gray-800">{food.energy_kcal} kkal</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5"><Zap size={14} className="text-blue-500" /> Protein</span>
                      <span className="font-bold text-gray-800">{food.protein_g} g</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5"><Activity size={14} className="text-amber-500" /> Karbo</span>
                      <span className="font-bold text-gray-800">{food.carbs_g} g</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5"><Droplet size={14} className="text-purple-500" /> Lemak</span>
                      <span className="font-bold text-gray-800">{food.fat_g} g</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}