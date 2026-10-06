import { useState, useEffect } from 'react'
import { getPosts, getLogo, createPost, updatePost, deletePost, uploadImagem } from './postsService'
import './App.css'

export default function App() {
  const [posts, setPosts] = useState([])
  const [logoUrl, setLogoUrl] = useState('')
  const [aba, setAba] = useState('inicio') // inicio, rifa, galeria, transparencia, admin
  
  // WhatsApp & Autenticação
  const NUMERO_WHATSAPP = '5531995309939'
  const SENHA_ADMIN = 'Fodasse#1' 

  // Cronômetro
  const dataEvento = new Date('2026-09-27T09:00:00').getTime()
  const [tempoRestante, setTempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 })

  // Campos Admin
  const [idEditando, setIdEditando] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [categoria, setCategoria] = useState('galeria')
  const [imagem, setImagem] = useState(null)
  const [numeroSorteado, setNumeroSorteado] = useState('')
  const [ganhador, setGanhador] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Sistema do Sorteio Automático Duplo
  const [participantes, setParticipantes] = useState(() => {
    const iniciais = {}
    for (let i = 1; i <= 230; i++) iniciais[i] = ''
    return iniciais
  })
  
  // Estados para 2 números
  const [numeroRoleta1, setNumeroRoleta1] = useState('?')
  const [numeroRoleta2, setNumeroRoleta2] = useState('?')
  const [sorteando, setSorteando] = useState(false)
  const [reproduzindoReplay, setReproduzindoReplay] = useState(false)

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

    // Carrega dados da Rifa se existirem
    const postRifa = postsDados.find(p => p.categoria === 'rifa')
    if (postRifa) {
      if (postRifa.lista_numeros) setParticipantes(postRifa.lista_numeros)
      if (postRifa.numero_sorteado) {
        // Separa os dois números armazenados (ex: "45 / 120")
        const numeros = String(postRifa.numero_sorteado).split(' / ')
        setNumeroRoleta1(numeros[0] || '?')
        setNumeroRoleta2(numeros[1] || '?')
      }
    }
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

  // Atualizar Lista de Participantes (Nome do número)
  function handleNomeChange(numero, nome) {
    setParticipantes(prev => ({ ...prev, [numero]: nome }))
  }

  // Salvar Lista de Participantes no Supabase
  async function salvarListaParticipantes() {
    setCarregando(true)
    const postRifa = posts.find(p => p.categoria === 'rifa')
    
    if (postRifa) {
      await updatePost(postRifa.id, { lista_numeros: participantes })
    } else {
      await createPost({
        titulo: 'Resultado do Sorteio',
        conteudo: 'Acompanhe o sorteio oficial da Rifa!',
        categoria: 'rifa',
        lista_numeros: participantes
      })
    }
    await carregarDados()
    setCarregando(false)
    alert('Lista de participantes salva com sucesso!')
  }

  // Executar Sorteio de 2 Números Simultâneos
  async function executarSorteio() {
    const confirmacao = confirm('Deseja iniciar o sorteio de 2 números ao vivo agora?')
    if (!confirmacao) return

    setSorteando(true)
    let contador = 0
    const totalVoltas = 40

    const intervaloAnimacao = setInterval(async () => {
      setNumeroRoleta1(Math.floor(Math.random() * 230) + 1)
      setNumeroRoleta2(Math.floor(Math.random() * 230) + 1)
      contador++

      if (contador >= totalVoltas) {
        clearInterval(intervaloAnimacao)
        
        // Sorteia dois números distintos
        const numVencedor1 = Math.floor(Math.random() * 230) + 1
        let numVencedor2 = Math.floor(Math.random() * 230) + 1
        while (numVencedor2 === numVencedor1) {
          numVencedor2 = Math.floor(Math.random() * 230) + 1
        }

        const nomeVencedor1 = participantes[numVencedor1] || 'Sem nome'
        const nomeVencedor2 = participantes[numVencedor2] || 'Sem nome'
        
        setNumeroRoleta1(numVencedor1)
        setNumeroRoleta2(numVencedor2)
        setSorteando(false)

        const resultadoNumeros = `${numVencedor1} / ${numVencedor2}`
        const resultadoGanhadores = `1º Prêmio: #${numVencedor1} (${nomeVencedor1}) | 2º Prêmio: #${numVencedor2} (${nomeVencedor2})`

        // Grava no Banco
        const postRifa = posts.find(p => p.categoria === 'rifa')
        const dadosAtualizados = {
          titulo: '🎉 Resultado Oficial do Sorteio Duplo!',
          conteudo: `Parabéns aos ganhadores!`,
          categoria: 'rifa',
          numero_sorteado: resultadoNumeros,
          ganhador: resultadoGanhadores,
          sorteio_realizado: true,
          lista_numeros: participantes
        }

        if (postRifa) {
          await updatePost(postRifa.id, dadosAtualizados)
        } else {
          await createPost(dadosAtualizados)
        }

        await carregarDados()
        alert(`🏆 Sorteio Concluído!\n\n${resultadoGanhadores}`)
      }
    }, 100)
  }

  // Animação de Replay para 2 números
  function assistirReplay(postRifa) {
    if (!postRifa || !postRifa.numero_sorteado) return
    
    const numerosFinais = String(postRifa.numero_sorteado).split(' / ')
    setReproduzindoReplay(true)
    let contador = 0
    const totalVoltas = 35

    const intervalo = setInterval(() => {
      setNumeroRoleta1(Math.floor(Math.random() * 230) + 1)
      setNumeroRoleta2(Math.floor(Math.random() * 230) + 1)
      contador++

      if (contador >= totalVoltas) {
        clearInterval(intervalo)
        setNumeroRoleta1(numerosFinais[0] || '?')
        setNumeroRoleta2(numerosFinais[1] || '?')
        setReproduzindoReplay(false)
      }
    }, 100)
  }

  // Resetar / Excluir Sorteio
  async function resetarSorteio() {
    const postRifa = posts.find(p => p.categoria === 'rifa')
    if (!postRifa) return

    if (confirm('Tem certeza que deseja APAGAR o sorteio e permitir um novo?')) {
      await updatePost(postRifa.id, {
        numero_sorteado: null,
        ganhador: null,
        sorteio_realizado: false,
        titulo: 'Sorteio da Rifa',
        conteudo: 'Aguardando realização do sorteio.'
      })
      setNumeroRoleta1('?')
      setNumeroRoleta2('?')
      await carregarDados()
      alert('Sorteio resetado com sucesso!')
    }
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
  const postRifaAtual = posts.find(p => p.categoria === 'rifa')

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
          <button onClick={() => setAba('rifa')} className={aba === 'rifa' ? 'ativo' : ''}>🎲 Rifa / Sorteio</button>
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
            <h2>⚙️ Painel de Controle</h2>

            {/* Gerenciador de Participantes e Sorteio Duplo */}
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
              <h3>🎰 Sistema de Sorteio Automático (2 Números Simultâneos)</h3>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <button onClick={executarSorteio} disabled={sorteando} style={{ background: '#28a745', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  {sorteando ? '🎲 Sorteando...' : '▶️ Realizar Sorteio Duplo ao Vivo'}
                </button>
                <button onClick={salvarListaParticipantes} disabled={carregando} style={{ background: '#007bff', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  💾 Salvar Nomes dos Bilhetes
                </button>
                {postRifaAtual?.numero_sorteado && (
                  <button onClick={resetarSorteio} style={{ background: '#dc3545', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    🗑️ Resetar / Excluir Sorteio
                  </button>
                )}
              </div>

              {/* Tabela de Atribuição de Nomes aos Números */}
              <details style={{ marginTop: '15px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📋 Lista de Números e Participantes (1 ao 230)</summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '350px', overflowY: 'auto', marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '5px' }}>
                  {Array.from({ length: 230 }, (_, i) => i + 1).map(num => (
                    <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <strong>#{num}:</strong>
                      <input 
                        type="text" 
                        placeholder="Nome do participante" 
                        value={participantes[num] || ''} 
                        onChange={e => handleNomeChange(num, e.target.value)}
                        style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                      />
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <hr style={{ margin: '30px 0' }} />

            {/* Form de Publicações Convencionais */}
            <h2>{idEditando ? 'Editar Publicação' : 'Nova Publicação'}</h2>
            <form onSubmit={handleSubmit} className="form-admin">
              <label>O que você quer publicar?</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                <option value="galeria">Galeria de Fotos</option>
                <option value="transparencia">📄 Comprovante / Transparência</option>
                <option value="logo">🖼️ Logo / Banner do Topo</option>
              </select>

              {categoria !== 'logo' && (
                <>
                  <label>Título:</label>
                  <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required />

                  <label>Descrição:</label>
                  <textarea value={conteudo} onChange={e => setConteudo(e.target.value)} rows="3" />
                </>
              )}

              <label>Foto:</label>
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

        {/* Visualização de Sorteio Duplo na Aba RIFA */}
        {aba === 'rifa' && (
          <section style={{ textAlign: 'center', padding: '20px', background: '#f0f8ff', borderRadius: '15px', marginBottom: '30px' }}>
            <h2>🎲 Sorteio da Rifa do Congresso</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '20px 0' }}>
              <div style={{ background: '#fff', padding: '15px 30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '14px', color: '#666', display: 'block' }}>1º Sorteado</span>
                <span style={{ fontSize: '64px', fontWeight: 'bold', color: '#007bff' }}>{numeroRoleta1}</span>
              </div>
              <div style={{ background: '#fff', padding: '15px 30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '14px', color: '#666', display: 'block' }}>2º Sorteado</span>
                <span style={{ fontSize: '64px', fontWeight: 'bold', color: '#28a745' }}>{numeroRoleta2}</span>
              </div>
            </div>

            {postRifaAtual?.numero_sorteado ? (
              <div>
                <h3 style={{ color: '#28a745' }}>🏆 Resultado dos Ganhadores:</h3>
                <p style={{ fontSize: '16px', background: '#fff', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                  {postRifaAtual.ganhador}
                </p>
                
                <br />
                <button 
                  onClick={() => assistirReplay(postRifaAtual)} 
                  disabled={reproduzindoReplay}
                  style={{ marginTop: '15px', padding: '10px 20px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
                >
                  {reproduzindoReplay ? '🌀 Reproduzindo Replay...' : '▶️ Assistir Replay do Sorteio'}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '16px', color: '#666' }}>O sorteio oficial ainda não foi realizado. Aguarde a transmissão do resultado!</p>
            )}
          </section>
        )}

        <section className="feed">
          <h2>
            {aba === 'inicio' && 'Todas as Publicações'}
            {aba === 'rifa' && 'Histórico do Sorteio'}
            {aba === 'galeria' && 'Galeria de Fotos'}
            {aba === 'transparencia' && '📄 Portal Transparência (Comprovantes)'}
            {aba === 'admin' && 'Gerenciar Publicações Existentes'}
          </h2>

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
}s
