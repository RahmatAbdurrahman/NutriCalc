// =====================================================
// SUPABASE CLIENT CONFIGURATION
// File: lib/supabase.ts
// =====================================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// =====================================================
// CLIENT-SIDE SUPABASE CLIENT
// Untuk digunakan di Client Components
// =====================================================
export const supabase = createClientComponentClient()

// =====================================================
// BROWSER CLIENT (Alternative)
// =====================================================
export const createBrowserClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// =====================================================
// SUPABASE TYPES (Database Types)
// =====================================================

export type Profile = {
  id: string
  tgl_lahir: string
  gender: 'pria' | 'wanita'
  tinggi_cm: number
  berat_kg: number
  level_aktivitas: number
  created_at?: string
  updated_at?: string
}

export type Food = {
  food_id: string
  food_name: string
  food_category: string
  energy_kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g?: number
  sodium_mg?: number
}

export type URTConversion = {
  urt_id: string
  food_id: string
  urt_name: string
  equivalent_grams: number
}

export type DailyLog = {
  log_id: number
  user_id: string
  food_id: string
  quantity_grams: number
  meal_type?: 'sarapan' | 'makan_siang' | 'makan_malam' | 'snack'
  consumed_at: string
  created_at?: string
}

export type Article = {
  article_id: string
  title: string
  thumbnail_url?: string
  external_url: string
  category?: string
  description?: string
  published_at?: string
}

export type NutritionTarget = {
  target_id: string
  user_id: string
  tdee_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  sugar_limit_g?: number
  salt_limit_g?: number
  fat_limit_g?: number
  is_active: boolean
  calculation_method?: string
  created_at?: string
}

// =====================================================
// ACTIVITY LEVELS
// =====================================================
export const activityLevels = [
  { value: 1.2, label: 'Sangat Ringan', description: 'Tidak berolahraga, kerja kantoran' },
  { value: 1.375, label: 'Ringan', description: 'Olahraga ringan 1-3x/minggu' },
  { value: 1.55, label: 'Sedang', description: 'Olahraga sedang 3-5x/minggu' },
  { value: 1.725, label: 'Berat', description: 'Olahraga berat 6-7x/minggu' },
  { value: 1.9, label: 'Sangat Berat', description: 'Atlet, kerja fisik berat' },
]

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Menghitung usia dari tanggal lahir
 */
export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Memanggil Edge Function untuk kalkulasi gizi
 */
export async function calculateNutrition(data: {
  usia: number
  gender: 'pria' | 'wanita'
  berat_kg: number
  tinggi_cm: number
  level_aktivitas: number
}) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-nutrition-needs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Gagal menghitung kebutuhan gizi')
  }

  return await response.json()
}

/**
 * Mendapatkan profil user lengkap
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Update profil user
 */
export async function updateUserProfile(userId: string, profile: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mendapatkan total kalori hari ini
 */
export async function getTodayCalories(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .rpc('get_daily_calories', {
      p_user_id: userId,
      p_date: today
    })

  if (error) throw error
  return data[0] || { 
    total_calories: 0, 
    total_protein: 0, 
    total_carbs: 0, 
    total_fat: 0 
  }
}

/**
 * Menambahkan makanan ke jurnal harian
 */
export async function addFoodLog(log: Omit<DailyLog, 'log_id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('daily_logs')
    .insert(log)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mendapatkan jurnal makanan hari ini
 */
export async function getTodayFoodLogs(userId: string) {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const { data, error } = await supabase
    .from('daily_logs')
    .select(`
      *,
      foods (*)
    `)
    .eq('user_id', userId)
    .gte('consumed_at', startOfDay)
    .lte('consumed_at', endOfDay)
    .order('consumed_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Search makanan
 */
export async function searchFoods(query: string) {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('food_name', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data as Food[]
}

/**
 * Mendapatkan URT untuk makanan tertentu
 */
export async function getFoodURTs(foodId: string) {
  const { data, error } = await supabase
    .from('urt_conversions')
    .select('*')
    .eq('food_id', foodId)

  if (error) {
    console.error('Error fetching URTs:', error)
    throw error
  }


  const defaultGramURT: URTConversion = {
    urt_id: `default-gram-${foodId}`,
    food_id: foodId,
    urt_name: 'gram',
    equivalent_grams: 1,
  }

  if (!data) return [defaultGramURT]
  const hasGram = data.find(urt => urt.urt_name.toLowerCase() === 'gram');
  
  if (hasGram) {
    return data as URTConversion[];
  }

  return [defaultGramURT, ...data] as URTConversion[]
}

/**
 * Mendapatkan semua artikel
 */
export async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) throw error
  return data as Article[]
}