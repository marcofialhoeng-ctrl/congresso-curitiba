import { useState, useEffect } from 'react'
import { getPosts, getLogo, createPost, updatePost, deletePost, uploadImagem } from './postsService'
import './App.css'

export default function App() {
  const [posts, setPosts] = useState([])
  const [logoUrl, setLogoUrl] = useState('')
  const [aba, setAba] = useState('inicio') // inicio, rifa, galeria, transparencia, admin
  
  // Insira o número do WhatsApp com DDD (Ex: 5541999999999)
  const NUMERO_WHATSAPP = '5531995309939'

  // Senha do Painel Admin
  const SENHA_ADMIN = 'Fodasse#1' 

  // Dados do Cronômetro (Congresso: 27 de Setembro de 2026)
  const dataEvento = new Date('2026-09-27T09:00:00').getTime()
  const [tempoRestante, setTempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 })

  // Campos do Form Admin
  const [idEditando, setIdEditando] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [categoria, setCategoria] = useState('galeria')
  const [imagem, setImagem] = useState(null)
  const [numeroSorteado, setNumeroSorteado] = useState('')
  const [ganhador, setGanhador] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    carregarDados()

    const intervalo = setInterval(() => {
      const agora = new Date().getTime()
      const diferenca = dataEvento - agora

      if (diferenca > 0) {
        setTempoRestante({
          dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
          horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
          segundos: Math.floor((diferenca % (1000 * 60)) / 1000)
        })
      }
    }, 1000)

    return () => clearInterval(intervalo)
  }, [])

  async function carregarDados() {
    const postsDados = await getPosts()
    const logoSalva = await getLogo()
    setPosts(postsDados)
    if (logoSalva) setLogoUrl(logoSalva)
  }

  function abrirAdmin() {
    if (aba === 'admin') return

    const senhaDigitada = prompt('Digite a senha para acessar o Painel Admin:')
    if (senhaDigitada === SENHA_ADMIN) {
      setAba('admin')
    } else if (senhaDigitada !== null) {
      alert('Senha incorreta!')
    }
  }

  async function handleLike(post) {
    const novosLikes = (post.likes || 0) + 1
    setPosts(posts.map(p => p.id === post.id ? { ...p, likes: novosLikes } : p))
    await updatePost(post.id, { likes: novosLikes })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setCarregando(true)

    let novaImagemUrl = null
    if (imagem) {
      novaImagemUrl = await uploadImagem(imagem)
    }

    if (categoria === 'logo') {
      if (novaImagemUrl) {
        setLogoUrl(novaImagemUrl)
        alert('Logo alterada com sucesso!')
      } else {
        alert('Selecione uma imagem para alterar a Logo.')
      }
    } else {
      const dadosPost = {
        titulo,
        conteudo,
        categoria,
        likes: 0,
        ...(novaImagemUrl && { imagem_url: novaImagemUrl }),
        ...(numeroSorteado && { numero_sorteado: parseInt(numeroSorteado) }),
        ...(ganhador && { ganhador })
      }

      if (idEditando) {
        await updatePost(idEditando, dadosPost)
        alert('Publicação atualizada!')
      } else {
        await createPost(dadosPost)
        alert('Publicação criada!')
      }
    }

    limparFormulario()
    await carregarDados()
    setCarregando(false)
  }

  function prepararEdicao(post) {
    setIdEditando(post.id)
    setTitulo(post.titulo || '')
    setConteudo(post.conteudo || '')
    setCategoria(post.categoria || 'galeria')
    setNumeroSorteado(post.numero_sorteado || '')
    setGanhador(post.ganhador || '')
    setAba('admin')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (confirm('Tem certeza que deseja excluir esta publicação?')) {
      await deletePost(id)
      await carregarDados()
    }
  }

  function limparFormulario() {
    setIdEditando(null)
    setTitulo('')
    setConteudo('')
    setCategoria('galeria')
    setImagem(null)
    setNumeroSorteado('')
    setGanhador('')
  }

  const postsFiltrados = posts.filter(p => aba === 'inicio' || aba === 'admin' ? true : p.categoria === aba)

  return (
    <div className="container">
      {/* Botão Flutuante do WhatsApp */}
      <a 
        href={`https://wa.me/${NUMERO_WHATSAPP}?text=Olá!%20Gostaria%20de%20mais%20informações%20sobre%20o%20Congresso.`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-float"
      >
        💬 WhatsApp
      </a>

      {/* Cabeçalho */}
      <header className="header">
        <div className="banner-container">
          <img 
            src={logoUrl || "https://via.placeholder.com/900x250?text=LOGO+DO+CONGRESSO"} 
            alt="Logo do Congresso" 
            className="logo-banner"
          />
        </div>

        <h1>Congresso Curitiba — Júlia & Marco</h1>

        {/* Cronômetro */}
        <div className="cronometro">
          <p>⏳ <strong>Faltam para o Congresso:</strong></p>
          <div className="contadores">
            <span><strong>{tempoRestante.dias}</strong> d</span>
            <span><strong>{tempoRestante.horas}</strong> h</span>
            <span><strong>{tempoRestante.minutos}</strong> m</span>
            <span><strong>{tempoRestante.segundos}</strong> s</span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="nav">
          <button onClick={() => setAba('inicio')} className={aba === 'inicio' ? 'ativo' : ''}>Início</button>
          <button onClick={() => setAba('rifa')} className={aba === 'rifa' ? 'ativo' : ''}>Rifa / Sorteio</button>
          <button onClick={() => setAba('galeria')} className={aba === 'galeria' ? 'ativo' : ''}>Galeria</button>
          <button onClick={() => setAba('transparencia')} className={aba === 'transparencia' ? 'ativo' : ''}>📄 Portal Transparência</button>
          <button onClick={abrirAdmin} className="btn-admin">
            {idEditando ? '✏️ Editando Post' : '⚙️ Painel Admin'}
          </button>
        </nav>
      </header>

      {/* Conteúdo */}
      <main className="conteudo">
        {aba === 'admin' && (
          <section className="painel-admin">
            <h2>{idEditando ? 'Editar Publicação' : 'Painel Admin'}</h2>
            <form onSubmit={handleSubmit} className="form-admin">
              <label>O que você quer publicar ou alterar?</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                <option value="galeria">Galeria de Fotos</option>
                <option value="transparencia">📄 Comprovante / Transparência</option>
                <option value="rifa">Resultado da Rifa / Sorteio</option>
                <option value="logo">🖼️ Logo / Banner do Topo</option>
              </select>

              {categoria !== 'logo' && (
                <>
                  <label>Título / Descrição do Comprovante:</label>
                  <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required />

                  <label>Observações / Detalhes:</label>
                  <textarea value={conteudo} onChange={e => setConteudo(e.target.value)} rows="3" />
                </>
              )}

              {categoria === 'rifa' && (
                <>
                  <label>Número Sorteado:</label>
                  <input type="number" value={numeroSorteado} onChange={e => setNumeroSorteado(e.target.value)} />

                  <label>Ganhador:</label>
                  <input type="text" value={ganhador} onChange={e => setGanhador(e.target.value)} />
                </>
              )}

              <label>Foto / Comprovante:</label>
              <input type="file" accept="image/*" onChange={e => setImagem(e.target.files[0])} />

              <div className="botoes-form">
                <button type="submit" disabled={carregando}>
                  {carregando ? 'Salvando...' : 'Salvar'}
                </button>
                {idEditando && <button type="button" onClick={limparFormulario} className="btn-cancelar">Cancelar</button>}
              </div>
            </form>
            <hr style={{ margin: '30px 0' }} />
          </section>
        )}

        <section className="feed">
          <h2>
            {aba === 'inicio' && 'Todas as Publicações'}
            {aba === 'rifa' && 'Resultado da Rifa'}
            {aba === 'galeria' && 'Galeria de Fotos'}
            {aba === 'transparencia' && '📄 Portal Transparência (Comprovantes)'}
            {aba === 'admin' && 'Gerenciar Publicações Existentes'}
          </h2>

          {aba === 'rifa' && (
            <div className="destaque-data-sorteio">
              <p className="titulo-sorteio">🗓️ DATA DO SORTEIO DA RIFA:</p>
              <h3 className="data-grande">26/09/2025</h3>
            </div>
          )}

          {postsFiltrados.length === 0 ? (
            <p>Nenhuma publicação nesta seção.</p>
          ) : (
            <div className="grid-posts">
              {postsFiltrados.map(post => (
                <div key={post.id} className="card-post">
                  {post.imagem_url && <img src={post.imagem_url} alt={post.titulo} />}
                  <div className="card-corpo">
                    <span className="tag">{post.categoria}</span>
                    <h3>{post.titulo}</h3>
                    <p>{post.conteudo}</p>
                    
                    {post.categoria === 'rifa' && (
                      <div className="info-rifa">
                        <p><strong>🎟️ Número Sorteado:</strong> {post.numero_sorteado}</p>
                        <p><strong>🏆 Ganhador:</strong> {post.ganhador}</p>
                      </div>
                    )}

                    <div className="interacao-card">
                      <button onClick={() => handleLike(post)} className="btn-like">
                        ❤️ {post.likes || 0}
                      </button>
                    </div>

                    {aba === 'admin' && (
                      <div className="acoes-card" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button onClick={() => prepararEdicao(post)}>✏️ Editar</button>
                        <button onClick={() => handleDelete(post.id)} className="btn-deletar">🗑️ Excluir</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
