import { supabase } from './supabaseClient'

// Buscar todos os posts (filtrando a categoria transparencia)
export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .neq('categoria', 'transparencia')
    .neq('categoria', 'portaltransparencia')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar posts:', error)
    return []
  }
  return data || []
}

// Buscar a logo/banner principal
export async function getLogo() {
  const { data, error } = await supabase
    .from('posts')
    .select('imagem_url')
    .eq('categoria', 'logo')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Erro ao buscar logo:', error)
    return null
  }
  return data && data.length > 0 ? data[0].imagem_url : null
}

// Criar novo post
export async function createPost(post) {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select()

  if (error) {
    console.error('Erro ao criar post:', error)
    return null
  }
  return data ? data[0] : null
}

// Atualizar post existente
export async function updatePost(id, post) {
  const { data, error } = await supabase
    .from('posts')
    .update(post)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Erro ao atualizar post:', error)
    return null
  }
  return data ? data[0] : null
}

// Deletar post
export async function deletePost(id) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar post:', error)
    return false
  }
  return true
}

// Fazer upload de imagem para o Supabase Storage
export async function uploadImagem(file) {
  if (!file) return null

  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `uploads/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('imagens')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Erro ao fazer upload da imagem:', uploadError)
    return null
  }

  const { data } = supabase.storage
    .from('imagens')
    .getPublicUrl(filePath)

  return data ? data.publicUrl : null
}
