import { supabase } from './supabaseClient'

// Buscar a foto do Banner/Logo do topo
export async function getLogo() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('categoria', 'logo')
    .single()
  
  if (error) console.error('Erro ao buscar logo:', error)
  return data ? data.imagem_url : null
}

// Buscar todos os posts salvos (ignorando a logo)
export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .neq('categoria', 'logo')
    .order('created_at', { ascending: false })
  
  if (error) console.error('Erro ao buscar posts:', error)
  return data || []
}

// Salvar um novo post (fotos, sorteio ou eventos)
export async function createPost(novoPost) {
  const { data, error } = await supabase
    .from('posts')
    .insert([novoPost])
    .select()

  if (error) {
    console.error('Erro ao criar post:', error)
    return null
  }
  return data[0]
}

// Editar um post existente (ou atualizar a logo)
export async function updatePost(id, dadosAtualizados) {
  const { data, error } = await supabase
    .from('posts')
    .update(dadosAtualizados)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Erro ao atualizar post:', error)
    return null
  }
  return data[0]
}

// Apagar um post
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

// Upload de fotos da galeria do celular/computador
export async function uploadImagem(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('fotos-congresso')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Erro no upload da foto:', uploadError)
    return null
  }

  const { data } = supabase.storage
    .from('fotos-congresso')
    .getPublicUrl(fileName)

  return data.publicUrl
}