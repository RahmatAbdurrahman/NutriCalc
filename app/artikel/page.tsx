'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { LogOut, BookOpen, Calendar, Tag, ArrowRight, ExternalLink, Loader2 } from 'lucide-react'

type Article = {
  article_id: string
  title: string
  thumbnail_url: string
  external_url: string
  category: string
  description: string
  published_at: string
}

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

export default function ArtikelPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch articles from Supabase
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false })

      if (error) {
        console.error('Error fetching articles:', error)
      } else {
        setArticles(data || [])
      }
      setLoading(false)
    }

    fetchArticles()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Format tanggal lokal Indonesia
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
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
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-emerald-800">
                NutriCalc<span className="text-emerald-500">+</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                <a href="/dashboard" className="hover:text-emerald-600 transition">Dashboard</a>
                <a href="/riwayat" className="hover:text-emerald-600 transition">Riwayat</a>
                <a href="/kalkulator" className="hover:text-emerald-600 transition">Database Pangan</a>
                <a href="/artikel" className="text-emerald-700 font-bold">Artikel</a>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-full border border-transparent hover:border-red-200 transition-all text-sm font-bold">
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section Artikel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-12 text-center md:text-left"
        >
          <div className="inline-block p-4 bg-white/50 backdrop-blur-lg rounded-2xl mb-4 border border-white/60 shadow-sm">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Pustaka <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Kesehatan</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Kumpulan artikel terpercaya untuk panduan nutrisi dan gaya hidup sehat Anda.
          </p>
        </motion.div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <span className="text-gray-500 font-medium">Memuat artikel...</span>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/50">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Belum ada artikel</h3>
            <p className="text-gray-500">Cek kembali nanti untuk update terbaru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <motion.div
                key={article.article_id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group flex flex-col h-full bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300"
              >
                {/* Image Container with Zoom Effect */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={article.thumbnail_url || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop'}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Category Badge Floating */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur text-emerald-700 shadow-sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {article.category || 'Umum'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow p-6">
                  {/* Date */}
                  <div className="flex items-center text-xs text-gray-500 mb-3 font-medium">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    {formatDate(article.published_at)}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {article.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                    {article.description}
                  </p>

                  {/* Action Button */}
                  <div className="mt-auto pt-4 border-t border-gray-100/50">
                    <a
                      href={article.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-emerald-600 transition-colors group/btn"
                    >
                      Baca Selengkapnya
                      <div className="bg-gray-100 group-hover/btn:bg-emerald-100 p-1.5 rounded-full transition-colors">
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </div>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}