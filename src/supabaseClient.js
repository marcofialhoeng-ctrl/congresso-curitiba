import { createClient } from '@supabase/supabase-js'

// URL e chave temporárias apenas para carregar o visual sem dar erro
const supabaseUrl = 'https://nmcnhfjutdqyeczqthbs.supabase.co'
const supabaseAnonKey = 'sb_publishable_ysSEfdDn3ElXMEHrcpNPHg_7xGt0o6z'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
