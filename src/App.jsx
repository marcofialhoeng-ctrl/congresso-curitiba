import { useState, useEffect } from 'react'
import { getPosts, getLogo, createPost, updatePost, deletePost, uploadImagem } from './postsService'
import './App.css'

export default function App() {
  const [posts, setPosts] = useState([])
  const [logoUrl, setLogoUrl] = useState('')
  const [aba, setAba] = useState('inicio') // inicio, rifa, galeria, admin
  const [adminAutenticado, setAdminAutenticado] = useState(false)
  
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
  
  const [numeroRoleta1, setNumeroRoleta1] = useState('?')
  const [numeroRoleta2, setNumeroRoleta2] = useState('?')
  const [sorteando, setSorteando] = useState(false)
  const [reproduzindoReplay, setReproduzindoReplay] = useState(false)
  const [destaqueGanhador, setDestaqueGanhador] = useState(false)

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

  // Carrega os dados persistidos da base de dados (Supabase)
  async function carregarDados() {
    const postsDados = await getPosts()
    const logoSalva = await getLogo()
    setPosts(postsDados)
    if (logoSalva) setLogoUrl(logoSalva)

    const postRifa = postsDados.find(p => p.categoria === 'rifa')
    if (postRifa) {
      if (postRifa.lista_numeros) setParticipantes(postRifa.lista_numeros)
      
      if (postRifa.numero_sorteado) {
        const numeros = String(postRifa.numero_sorteado).split(' / ')
        setNumeroRoleta1(numeros[0] || '?')
        setNumeroRoleta2(numeros[1] || '?')
        setDestaqueGanhador(true)
      } else {
        setNumeroRoleta1('?')
        setNumeroRoleta2('?')
        setDestaqueGanhador(false)
      }
    }
  }

  function abrirAdmin() {
    if (adminAutenticado) {
      setAba('admin')
      return
    }

    const senhaDigitada = prompt('Digite a senha para acessar o Painel Admin:')
    if (senhaDigitada === SENHA_ADMIN) {
      setAdminAutenticado(true)
      setAba('admin')
    } else if (senhaDigitada !== null) {
      alert('Senha incorreta!')
    }
  }

  function sairAdmin() {
    setAdminAutenticado(false)
    setAba('inicio')
  }

  async function handleLike(post) {
    const novosLikes = (post.likes || 0) + 1
    setPosts(posts.map(p => p.id === post.id ? { ...p, likes: novosLikes } : p))
    await updatePost(post.id, { likes: novosLikes })
  }

  function handleNomeChange(numero, nome) {
    setParticipantes(prev => ({ ...prev, [numero]: nome }))
  }

  async function salvarListaParticipantes() {
    setCarregando(true)
    const postRifa = posts.find(p => p.categoria === 'rifa')
    
    if (postRifa) {
      await updatePost(postRifa.id, { lista_numeros: participantes })
    } else {
      await createPost({
        titulo: 'Sorteio da Rifa',
        conteudo: 'Aguardando realização do sorteio.',
        categoria: 'rifa',
        lista_numeros: participantes,
        sorteio_realizado: false
      })
    }
    await carregarDados()
    setCarregando(false)
    alert('Lista de participantes salva com sucesso!')
  }

  async function executarSorteio() {
    const confirmacao = confirm('Deseja iniciar o sorteio oficial de 2 números ao vivo agora?')
    if (!confirmacao) return

    setSorteando(true)
    setDestaqueGanhador(false)
    let contador = 0
    const totalVoltas = 40

    const intervaloAnimacao = setInterval(async () => {
      setNumeroRoleta1(Math.floor(Math.random() * 230) + 1)
      setNumeroRoleta2(Math.floor(Math.random() * 230) + 1)
      contador++

      if (contador >= totalVoltas) {
        clearInterval(intervaloAnimacao)
        
        const numVencedor1 = Math.floor(Math.random() * 230) + 1
        let numVencedor2 = Math.floor(Math.random() * 230) + 1
        while (numVencedor2 === numVencedor1) {
          numVencedor2 = Math.floor(Math.random() * 230) + 1
        }

        const nomeVencedor1 = participantes[numVencedor1] || 'Sem nome registrado'
        const nomeVencedor2 = participantes[numVencedor2] || 'Sem nome registrado'
        
        setNumeroRoleta1(numVencedor1)
        setNumeroRoleta2(numVencedor2)
        setSorteando(false)
        setDestaqueGanhador(true)

        const resultadoNumeros = `${numVencedor1} / ${numVencedor2}`
        const resultadoGanhadores = `🥇 1º Prêmio: Bilhete #${numVencedor1} (${nomeVencedor1}) | 🥈 2º Prêmio: Bilhete #${numVencedor2} (${nomeVencedor2})`

        const postRifa = posts.find(p => p.categoria === 'rifa')
        const dadosAtualizados = {
          titulo: '🎉 Resultado Oficial do Sorteio Duplo!',
          conteudo: `Sorteio oficial concluído! Parabéns aos ganhadores!`,
          categoria: 'rifa',
          numero_sorteado: resultadoNumeros,
          ganhador: resultadoGanhadores,
          sorteio_realizado: true,
          lista_numeros: participantes
        }

        let resultadoSalvo = null
        if (postRifa && postRifa.id) {
          resultadoSalvo = await updatePost(postRifa.id, dadosAtualizados)
        } else {
          resultadoSalvo = await createPost(dadosAtualizados)
        }

        if (resultadoSalvo) {
          await carregarDados()
          alert(`🏆 SORTEIO CONCLUÍDO E SALVO NO BANCO!\n\n${resultadoGanhadores}`)
        } else {
          alert('⚠️ Ocorreu um erro ao salvar o resultado no Supabase.')
        }
      }
    }, 100)
  }

  function assistirReplay(postRifa) {
    if (!postRifa || !postRifa.numero_sorteado) return
    
    const numerosFinais = String(postRifa.numero_sorteado).split(' / ')
    setReproduzindoReplay(true)
    setDestaqueGanhador(false)
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
        setDestaqueGanhador(true)
      }
    }, 100)
  }

  async function resetarSorteio() {
    const postRifa = posts.find(p => p.categoria === 'rifa')
    if (!postRifa) return

    if (confirm('Tem certeza que deseja APAGAR o resultado do sorteio?')) {
      await updatePost(postRifa.id, {
        numero_sorteado: null,
        ganhador: null,
        sorteio_realizado: false,
        titulo: 'Sorteio da Rifa',
        conteudo: 'Aguardando realização do sorteio.'
      })
      setNumeroRoleta1('?')
      setNumeroRoleta2('?')
      setDestaqueGanhador(false)
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
    if (!adminAutenticado) {
      abrirAdmin()
      return
    }
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
  const foiRealizado = postRifaAtual && postRifaAtual.sorteio_realizado

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

        {/* Navegação sem a Transparência */}
        <nav className="nav">
          <button onClick={() => setAba('inicio')} className={aba === 'inicio' ? 'ativo' : ''}>Início</button>
          <button onClick={() => setAba('rifa')} className={aba === 'rifa' ? 'ativo' : ''}>🎲 Rifa / Sorteio</button>
          <button onClick={() => setAba('galeria')} className={aba === 'galeria' ? 'ativo' : ''}>Galeria</button>
          <button onClick={abrirAdmin} className={aba === 'admin' ? 'btn-admin ativo' : 'btn-admin'}>
            {adminAutenticado ? (idEditando ? '✏️ Editando Post' : '⚙️ Painel Admin') : '🔒 Acesso Admin'}
          </button>
        </nav>
      </header>

      {/* Conteúdo */}
      <main className="conteudo">
        {aba === 'admin' && adminAutenticado && (
          <section className="painel-admin">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>⚙️ Painel de Controle do Sorteio</h2>
              <button onClick={sairAdmin} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                🚪 Sair do Admin
              </button>
            </div>

            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
              <h3>🎰 Sistema de Sorteio Automático (2 Números Simultâneos)</h3>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <button onClick={executarSorteio} disabled={sorteando} style={{ background: '#28a745', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {sorteando ? '🎲 Sorteando...' : '▶️ Realizar Sorteio Duplo Oficial'}
                </button>
                <button onClick={salvarListaParticipantes} disabled={carregando} style={{ background: '#007bff', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  💾 Salvar Lista de Participantes
                </button>
                {foiRealizado && (
                  <button onClick={resetarSorteio} style={{ background: '#dc3545', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    🗑️ Resetar / Excluir Sorteio
                  </button>
                )}
              </div>

              <details style={{ marginTop: '15px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📋 Atribuir Nomes aos Números (1 ao 230)</summary>
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

            <h2>{idEditando ? 'Editar Publicação' : 'Nova Publicação'}</h2>
            <form onSubmit={handleSubmit} className="form-admin">
              <label>O que você quer publicar?</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                <option value="galeria">Galeria de Fotos</option>
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

        {/* Visualização do Sorteio na Aba RIFA */}
        {aba === 'rifa' && (
          <section style={{ textAlign: 'center', padding: '30px 20px', background: 'linear-gradient(135deg, #e6f2ff 0%, #ffffff 100%)', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '28px', color: '#1a252f' }}>🎲 Sorteio Oficial da Rifa do Congresso</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '25px 0', flexWrap: 'wrap' }}>
              <div style={{ 
                background: '#fff', 
                padding: '20px 35px', 
                borderRadius: '12px', 
                boxShadow: destaqueGanhador ? '0 0 20px rgba(0, 123, 255, 0.6)' : '0 6px 12px rgba(0,0,0,0.08)', 
                borderTop: '4px solid #007bff',
                transform: destaqueGanhador ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}>
                <span style={{ fontSize: '14px', color: '#666', fontWeight: 'bold', display: 'block' }}>1º Sorteado</span>
                <span style={{ fontSize: '60px', fontWeight: 'bold', color: '#007bff' }}>{numeroRoleta1}</span>
              </div>

              <div style={{ 
                background: '#fff', 
                padding: '20px 35px', 
                borderRadius: '12px', 
                boxShadow: destaqueGanhador ? '0 0 20px rgba(40, 167, 69, 0.6)' : '0 6px 12px rgba(0,0,0,0.08)', 
                borderTop: '4px solid #28a745',
                transform: destaqueGanhador ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}>
                <span style={{ fontSize: '14px', color: '#666', fontWeight: 'bold', display: 'block' }}>2º Sorteado</span>
                <span style={{ fontSize: '60px', fontWeight: 'bold', color: '#28a745' }}>{numeroRoleta2}</span>
              </div>
            </div>

            {foiRealizado ? (
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', display: 'inline-block', maxWidth: '600px', width: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <span style={{ background: '#28a745', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                  ✓ Sorteio Oficial Concluído (Salvo)
                </span>
                
                <h3 style={{ color: '#1a252f', marginTop: '15px', fontSize: '20px' }}>🏆 Ganhadores Oficiais:</h3>
                <p style={{ fontSize: '16px', color: '#333', lineHeight: '1.6', fontWeight: '500' }}>
                  {postRifaAtual.ganhador}
                </p>

                <button 
                  onClick={() => assistirReplay(postRifaAtual)} 
                  disabled={reproduzindoReplay}
                  style={{ marginTop: '15px', padding: '12px 25px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.2s', boxShadow: '0 4px 8px rgba(0,123,255,0.3)' }}
                >
                  {reproduzindoReplay ? '🌀 Sorteando ao vivo...' : '▶️ Assistir Replay do Sorteio'}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '16px', color: '#666', fontStyle: 'italic' }}>
                ⏳ O sorteio oficial ainda não foi realizado. Aguarde a transmissão do resultado!
              </p>
            )}
          </section>
        )}

        <section className="feed">
          <h2>
            {aba === 'inicio' && 'Todas as Publicações'}
            {aba === 'rifa' && 'Histórico do Sorteio'}
            {aba === 'galeria' && 'Galeria de Fotos'}
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

                    {aba === 'admin' && adminAutenticado && (
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
