import { supabase } from './supabaseClient' // ajuste o caminho se necessário

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) console.error('Erro ao buscar posts:', error)
  return data || []
}

export async function createPost(post) {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select()

  if (error) {
    console.error('Erro ao criar post:', error)
    alert('Erro ao salvar no banco de dados: ' + error.message)
    return null
  }
  return data ? data[0] : null
}

export async function updatePost(id, alteracoes) {
  const { data, error } = await supabase
    .from('posts')
    .update(alteracoes)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Erro ao atualizar post:', error)
    alert('Erro ao atualizar no banco de dados: ' + error.message)
    return null
  }
  return data
}
