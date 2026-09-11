import { useState } from 'react'
import { analyzeSecurity } from './api/securityClient'
import LoginTab from './components/LoginTab'
import NpmGuardTab from './components/NpmGuardTab'
import PortalTab from './components/PortalTab'
import './App.css'

type ScanState = 'ready' | 'scanning' | 'complete' | 'offline'
type ScanResult = { checked: number; threats: number; activeModules: number; completedAt: string }
type EducationTrack = '5-7' | '7-9' | '9-12' | 'college'
type AppView = 'protection' | 'scripts' | 'quarantine' | 'activity' | 'education' | 'seniors' | 'sales' | 'settings' | 'login' | 'portal' | 'npm'
type GuardCodePlan = { id: string; name: string; price: string; duration: string; detail: string; featured?: boolean }

const guardCodePlans: GuardCodePlan[] = [
  { id: 'guard-5', name: 'Guard Code 5', price: '5 EUR', duration: '5 dias', detail: 'Créditos para análises pontuais de código e scripts.' },
  { id: 'guard-10', name: 'Guard Code 10', price: '10 EUR', duration: '2 semanas', detail: 'Proteção de projetos ativos e relatórios de risco.' },
  { id: 'guard-15', name: 'Guard Code 15', price: '15 EUR', duration: '1 mês + 1/3', detail: 'Mais capacidade para equipas e verificações recorrentes.' },
  { id: 'guard-20', name: 'Guard Code 20', price: '20 EUR', duration: '1 mês + mais de 1/3', detail: 'Cobertura avançada, prioridades e histórico alargado.', featured: true },
]

const initialThreats = [
  { file: 'Downloads/update-check.ps1', rule: 'Execucao remota suspeita', risk: 'Alto', action: 'Em quarentena' },
  { file: 'Projetos/install-tools.sh', rule: 'Download sem verificacao', risk: 'Medio', action: 'Bloqueado' },
  { file: 'Temp/cleanup.vbs', rule: 'Ofuscacao detectada', risk: 'Alto', action: 'Em quarentena' },
]

type SecurityBot = { id: string; name: string; detail: string; active: boolean }

const initialSecurityBots: SecurityBot[] = [
  { id: 'tracker', name: 'Bloqueador de rastreadores', detail: 'Impede pixels, cookies de terceiros e perfis de publicidade.', active: true },
  { id: 'phishing', name: 'Guarda contra phishing', detail: 'Compara sites com listas de ameaça antes de abrir a página.', active: true },
  { id: 'fingerprint', name: 'Proteção contra impressão digital', detail: 'Reduz sinais usados para identificar o teu dispositivo.', active: true },
  { id: 'malware', name: 'Filtro de malware', detail: 'Bloqueia downloads e domínios associados a código malicioso.', active: true },
]

const tracks: { id: EducationTrack; label: string; title: string; detail: string; progress: number }[] = [
  { id: '5-7', label: '5.º ao 7.º ano', title: 'Fundamentos', detail: 'Matemática, ciências, leitura e cidadania digital.', progress: 68 },
  { id: '7-9', label: '7.º ao 9.º ano', title: 'Descoberta', detail: 'Raciocínio, tecnologia, línguas e escolhas financeiras.', progress: 42 },
  { id: '9-12', label: '9.º ao 12.º ano', title: 'Preparação', detail: 'Exames, projetos, carreira e literacia financeira.', progress: 24 },
  { id: 'college', label: 'Faculdade', title: 'Especialização', detail: 'Competências profissionais e aprendizagem autónoma.', progress: 12 },
]

const financeLessons = [
  { title: 'Orçamento sem complicação', detail: 'Distingue necessidades, desejos e objetivos.', value: '15 min' },
  { title: 'Juros e crescimento', detail: 'Aprende por que o tempo importa ao poupar.', value: '12 min' },
  { title: 'Segurança online', detail: 'Reconhece burlas, phishing e promessas impossíveis.', value: '10 min' },
]

const activityEvents = [
  { type: 'success', title: 'Script validado', detail: 'Projetos/deploy.ps1', time: 'Agora', date: 'Hoje' },
  { type: 'warning', title: 'Tentativa de download bloqueada', detail: 'malware.test/update', time: 'Ha 18 min', date: 'Hoje' },
  { type: 'success', title: 'Verificacao agendada concluida', detail: '1.247 scripts analisados', time: 'Ha 42 min', date: 'Hoje' },
  { type: 'danger', title: 'Item enviado para quarentena', detail: 'Downloads/update-check.ps1', time: 'Ontem, 18:24', date: 'Ontem' },
]

function App() {
  const [activeView, setActiveView] = useState<AppView>('protection')
  const [educationTrack, setEducationTrack] = useState<EducationTrack>('5-7')
  const [financeComplete, setFinanceComplete] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('Olá. Sou o tutor AuryonSafe. Escolhe um percurso e pergunta-me sobre uma matéria.')
  const [scanState, setScanState] = useState<ScanState>('ready')
  const [protectedRealtime, setProtectedRealtime] = useState(true)
  const [threats, setThreats] = useState(initialThreats)
  const [securityBots, setSecurityBots] = useState(initialSecurityBots)
  const [urlFilters, setUrlFilters] = useState(['ads.example', 'tracking.example', 'malware.test'])
  const [newFilter, setNewFilter] = useState('')
  const [privacyMode, setPrivacyMode] = useState<'balanced' | 'strict' | 'custom'>('balanced')
  const [activityFilter, setActivityFilter] = useState<'Tudo' | 'Hoje' | 'Ontem'>('Tudo')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanDetail, setScanDetail] = useState('Executa uma varredura para verificar')
  const [seniorStep, setSeniorStep] = useState(0)
  const [salesAccessConfirmed, setSalesAccessConfirmed] = useState(false)
  const [salesPrompt, setSalesPrompt] = useState('')
  const [salesAdvice, setSalesAdvice] = useState('Descreve o produto, o público e o objetivo para criar uma sugestão comercial responsável.')
  const [selectedPlan, setSelectedPlan] = useState<GuardCodePlan | null>(null)
  const [checkoutNotice, setCheckoutNotice] = useState('')


  const startScan = async () => {
    if (!protectedRealtime) {
      setScanDetail('Ativa a proteção em tempo real para iniciar a verificação')
      return
    }
    setScanState('scanning')
    setScanDetail('A analisar com o motor AuryonSafe...')
    try {
      await analyzeSecurity('sessao-local', 'command')
      const activeModules = securityBots.filter((bot) => bot.active).length
      const checked = threats.length + urlFilters.length + activeModules
      setScanResult({ checked, threats: threats.length, activeModules, completedAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) })
      setScanState('complete')
      setScanDetail('Varredura concluida pela API')
    } catch {
      setScanState('offline')
      setScanDetail('Modo local: API indisponivel ou sessao necessaria')
    }
  }

  const addUrlFilter = () => {
    const filter = newFilter.trim().toLowerCase()
    if (!filter || urlFilters.includes(filter)) return
    setUrlFilters([...urlFilters, filter])
    setNewFilter('')
  }

  const clearQuarantine = () => {
    if (!threats.length || !window.confirm('Esvaziar a quarentena? Os ficheiros isolados serao removidos desta lista.')) return
    setThreats([])
  }

  const continueTrack = () => {
    setFinanceComplete(true)
    document.getElementById('finance')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (activeView === 'login') return <main className="login-shell"><button className="back-button" type="button" onClick={() => setActiveView('protection')}>Voltar para protecao</button><LoginTab /></main>

  if (activeView === 'portal') return <main className="login-shell"><button className="back-button" type="button" onClick={() => setActiveView('protection')}>Voltar para protecao</button><PortalTab /></main>

  if (activeView === 'npm') return <NpmGuardTab onOpenAccount={() => setActiveView('login')} onReturn={() => setActiveView('protection')} />

  if (activeView === 'scripts' || activeView === 'quarantine' || activeView === 'activity') {
    const pageTitle = activeView === 'scripts' ? 'Protecao de scripts' : activeView === 'quarantine' ? 'Quarentena' : 'Atividade protegida'
    const pageIntro = activeView === 'scripts' ? 'Define como o AuryonSafe analisa comandos, downloads e comportamentos suspeitos.' : activeView === 'quarantine' ? 'Reve os ficheiros isolados e decide o que deve acontecer a seguir.' : 'Consulta o historico das decisoes tomadas pelo motor de protecao.'
    const visibleEvents = activityFilter === 'Tudo' ? activityEvents : activityEvents.filter((event) => event.date === activityFilter)

    return <main className="security-app"><aside className="sidebar"><div className="brand"><span className="brand-mark">B</span><span>BaseGuard</span></div><nav aria-label="Navegacao principal"><button className="nav-item" type="button" onClick={() => setActiveView('protection')}>Visao geral</button><button className={activeView === 'scripts' ? 'nav-item active' : 'nav-item'} type="button" onClick={() => setActiveView('scripts')}>Protecao de scripts</button><button className={activeView === 'quarantine' ? 'nav-item active' : 'nav-item'} type="button" onClick={() => setActiveView('quarantine')}>Quarentena</button><button className="nav-item" type="button" onClick={() => setActiveView('education')}>Educacao</button><button className="nav-item" type="button" onClick={() => setActiveView('portal')}>Portal</button><button className={activeView === 'activity' ? 'nav-item active' : 'nav-item'} type="button" onClick={() => setActiveView('activity')}>Atividade</button><button className="nav-item" type="button" onClick={() => setActiveView('settings')}>Definicoes</button></nav><div className="sidebar-footer"><button className="nav-item" type="button" onClick={() => setActiveView('login')}>Conta</button><p>Motor de protecao 1.0</p></div></aside><section className="workspace"><header className="topbar"><div><p className="eyebrow">Centro de controlo</p><h1>{pageTitle}</h1><p className="page-lead">{pageIntro}</p></div><button className="profile-button" type="button" onClick={() => setActiveView('login')} aria-label="Abrir conta">AC</button></header>
      {activeView === 'scripts' && <><section className="page-summary"><div className="summary-icon">ON</div><div><strong>Protecao em tempo real ativa</strong><p>Os quatro modulos estao a observar esta sessao e podem bloquear acoes antes da execucao.</p></div><button className="scan-button" type="button" onClick={() => setProtectedRealtime(!protectedRealtime)}>{protectedRealtime ? 'Pausar protecao' : 'Ativar protecao'}</button></section><section className="script-grid">{securityBots.map((bot) => <article className="panel script-card" key={bot.id}><div className="script-card-head"><div className="bot-symbol">{bot.name.slice(0, 2).toUpperCase()}</div><button className={bot.active ? 'toggle on' : 'toggle'} type="button" onClick={() => setSecurityBots(securityBots.map((item) => item.id === bot.id ? { ...item, active: !item.active } : item))} aria-label={`Alternar ${bot.name}`}><span /></button></div><p className="eyebrow">Modulo de protecao</p><h2>{bot.name}</h2><p>{bot.detail}</p><span className={bot.active ? 'module-status active' : 'module-status'}>{bot.active ? 'Ativo' : 'Em pausa'}</span></article>)}</section><section className="panel filter-panel"><div className="panel-heading"><div><p className="eyebrow">Lista personalizada</p><h2>Filtros de dominio</h2></div><span className="settings-badge">{urlFilters.length} filtros ativos</span></div><p className="settings-description">Adiciona dominios que devem ser bloqueados antes de carregar.</p><form className="filter-form" onSubmit={(event) => { event.preventDefault(); addUrlFilter() }}><input value={newFilter} onChange={(event) => setNewFilter(event.target.value)} placeholder="exemplo.com" aria-label="Novo dominio a bloquear" /><button className="primary-action" type="submit">Adicionar filtro</button></form><div className="filter-list">{urlFilters.map((filter) => <span key={filter}>{filter}</span>)}</div></section></>}
      {activeView === 'quarantine' && <><section className="page-summary quarantine-summary"><div className="summary-icon warning-icon">{threats.length}</div><div><strong>{threats.length ? `${threats.length} itens precisam de revisao` : 'Quarentena vazia'}</strong><p>{threats.length ? 'Estes ficheiros foram impedidos de executar e permanecem isolados.' : 'Nenhum ficheiro suspeito esta a espera de decisao.'}</p></div>{threats.length > 0 && <button className="text-button danger" type="button" onClick={clearQuarantine}>Esvaziar quarentena</button>}</section><section className="panel threat-panel"><div className="panel-heading"><div><p className="eyebrow">Itens isolados</p><h2>Revisao de ameacas</h2></div><span className="settings-badge neutral">Armazenamento local</span></div>{threats.length > 0 ? <div className="threat-table">{threats.map((threat) => <div className="table-row" key={threat.file}><strong>{threat.file}</strong><span>{threat.rule}</span><span><b className={threat.risk === 'Alto' ? 'risk high' : 'risk medium'}>{threat.risk}</b></span><button className="text-button" type="button" onClick={() => setThreats(threats.filter((item) => item.file !== threat.file))}>Remover</button></div>)}</div> : <div className="empty-state"><strong>Quarentena vazia</strong><span>Os itens isolados aparecerao aqui para tua revisao.</span></div>}</section></>}
      {activeView === 'activity' && <><div className="filter-tabs" role="tablist" aria-label="Filtrar atividade">{(['Tudo', 'Hoje', 'Ontem'] as const).map((filter) => <button key={filter} className={activityFilter === filter ? 'active' : ''} type="button" onClick={() => setActivityFilter(filter)}>{filter}</button>)}</div><section className="panel activity-page-panel"><div className="panel-heading"><div><p className="eyebrow">Registo de seguranca</p><h2>Decisoes recentes</h2></div><span className="settings-badge">{visibleEvents.length} eventos</span></div><ul className="activity-timeline">{visibleEvents.map((event) => <li key={`${event.title}-${event.time}`}><i className={`dot ${event.type}`} /><div><strong>{event.title}</strong><span>{event.detail}</span></div><time>{event.time}</time></li>)}</ul></section></>}
    </section></main>
  }

  if (activeView === 'settings') return <main className="security-app"><aside className="sidebar"><div className="brand"><span className="brand-mark">B</span><span>BaseGuard</span></div><nav aria-label="Navegacao principal"><button className="nav-item" type="button" onClick={() => setActiveView('protection')}>Visao geral</button><button className="nav-item" type="button">Protecao de scripts</button><button className="nav-item" type="button">Quarentena</button><button className="nav-item" type="button" onClick={() => setActiveView('education')}>Educação</button><button className="nav-item" type="button" onClick={() => setActiveView('portal')}>Portal</button><button className="nav-item active" type="button">Definições</button></nav><div className="sidebar-footer"><button className="nav-item" type="button" onClick={() => setActiveView('login')}>Conta</button><p>Motor de protecao 1.0</p></div></aside><section className="workspace settings-workspace"><header className="topbar"><div><p className="eyebrow">Controlo pessoal</p><h1>Definições de segurança</h1><p className="settings-lead">Escolhe o nível de privacidade e os filtros que fazem sentido para a tua navegação.</p></div><button className="profile-button" type="button" onClick={() => setActiveView('login')} aria-label="Abrir conta">AC</button></header><section className="privacy-banner"><div className="privacy-mark">✓</div><div><strong>Privacidade reforçada ativa</strong><p>Os bots estão a proteger esta sessão. As preferências ficam neste dispositivo até ligares a sincronização.</p></div><span className="online-status"><i /> Proteção ligada</span></section><section className="settings-grid"><article className="panel settings-card"><div className="panel-heading"><div><p className="eyebrow">Modo de navegação</p><h2>Privacidade por defeito</h2></div><span className="settings-badge">Recomendado</span></div><p className="settings-description">Controla rastreadores, scripts de terceiros e sinais usados para criar um perfil sobre ti.</p><div className="privacy-options"><button type="button" className={privacyMode === 'balanced' ? 'privacy-option selected' : 'privacy-option'} onClick={() => setPrivacyMode('balanced')}><strong>Equilibrado</strong><span>Protege sem quebrar sites comuns.</span></button><button type="button" className={privacyMode === 'strict' ? 'privacy-option selected' : 'privacy-option'} onClick={() => setPrivacyMode('strict')}><strong>Estrito</strong><span>Bloqueia mais conteúdo, com maior probabilidade de pedir exceções.</span></button><button type="button" className={privacyMode === 'custom' ? 'privacy-option selected' : 'privacy-option'} onClick={() => setPrivacyMode('custom')}><strong>Personalizado</strong><span>Usa os controlos dos bots abaixo.</span></button></div></article><article className="panel settings-card"><div className="panel-heading"><div><p className="eyebrow">Defesa automática</p><h2>Bots de segurança</h2></div><span className="bot-count"><i /> {securityBots.filter((bot) => bot.active).length}/{securityBots.length} ativos</span></div><div className="bot-list">{securityBots.map((bot) => <div className="bot-row" key={bot.id}><span className={bot.active ? 'bot-dot active' : 'bot-dot'} /><div><strong>{bot.name}</strong><p>{bot.detail}</p></div><button className={bot.active ? 'toggle on' : 'toggle'} type="button" onClick={() => setSecurityBots(securityBots.map((item) => item.id === bot.id ? { ...item, active: !item.active } : item))} aria-label={`${bot.active ? 'Desligar' : 'Ligar'} ${bot.name}`}><span /></button></div>)}</div></article></section><section className="panel filter-panel"><div className="panel-heading"><div><p className="eyebrow">Regras pessoais</p><h2>Filtros de URLs</h2></div><span className="settings-badge neutral">{urlFilters.length} regras</span></div><p className="settings-description">Adiciona domínios ou termos para bloquear. Podes criar quantas regras quiseres; o filtro aplica-se antes do carregamento.</p><form className="filter-form" onSubmit={(event) => { event.preventDefault(); addUrlFilter() }}><label htmlFor="url-filter">Novo domínio ou termo</label><div><input id="url-filter" value={newFilter} onChange={(event) => setNewFilter(event.target.value)} placeholder="ex.: redes-sociais.test" /><button type="submit">Adicionar filtro</button></div></form><div className="filter-list">{urlFilters.map((filter) => <div className="filter-chip" key={filter}><span>/{filter}/</span><button type="button" onClick={() => setUrlFilters(urlFilters.filter((item) => item !== filter))} aria-label={`Remover filtro ${filter}`}>×</button></div>)}</div></section><section className="legal-note"><strong>Privacidade com responsabilidade</strong><p>Estas opções ajudam a reduzir rastreio e risco, mas não substituem atualizações, palavras-passe únicas ou atenção a pedidos suspeitos. O tratamento de dados segue os <a href="/legal/terms.html">Termos</a> e a <a href="/legal/privacy.html">Política de Privacidade</a>.</p></section></section></main>

  if (activeView === 'seniors') {
    const seniorSteps = [
      { title: 'Reconhecer mensagens falsas', detail: 'Desconfia de urgência, prémios inesperados e pedidos de códigos ou dados bancários.' },
      { title: 'Confirmar antes de clicar', detail: 'Liga para a pessoa ou empresa através de um contacto conhecido antes de abrir uma ligação.' },
      { title: 'Pedir ajuda com tranquilidade', detail: 'Falar com alguém de confiança é uma decisão inteligente quando algo parece estranho.' },
    ]
    const currentStep = seniorSteps[seniorStep]!

    return <main className="guided-app"><header className="guided-header"><div className="brand"><span className="brand-mark">A</span><span>Aegis 230</span></div><button className="back-button compact" type="button" onClick={() => setActiveView('protection')}>Voltar à proteção</button></header><section className="guided-hero"><p className="eyebrow">Internet para todos</p><h1>Ajuda simples para avós</h1><p>Passos claros para navegar, comunicar e comprar online com mais segurança e menos pressa.</p></section><section className="senior-layout"><article className="guided-card"><p className="eyebrow">Passo {seniorStep + 1} de {seniorSteps.length}</p><h2>{currentStep.title}</h2><p>{currentStep.detail}</p><div className="step-dots" aria-label={`Passo ${seniorStep + 1} de ${seniorSteps.length}`}>{seniorSteps.map((step, index) => <button aria-label={`Ver ${step.title}`} className={index === seniorStep ? 'active' : ''} key={step.title} onClick={() => setSeniorStep(index)} type="button" />)}</div><button className="primary-action" type="button" onClick={() => setSeniorStep((seniorStep + 1) % seniorSteps.length)}>Ver próximo passo</button></article><aside className="help-card"><p className="eyebrow">Precisa de apoio?</p><h2>Pedir ajuda é seguro.</h2><p>Nunca partilhes códigos, palavras-passe ou dados do cartão. Uma pessoa de confiança pode verificar uma mensagem contigo.</p><button className="secondary-action" type="button" onClick={() => setActiveView('portal')}>Abrir portal familiar</button></aside></section><footer className="guided-footer"><button type="button" onClick={() => setActiveView('education')}>Área para crianças e estudantes</button><button type="button" onClick={() => setActiveView('protection')}>Centro de proteção</button></footer></main>
  }

  if (activeView === 'sales') {
    const createSalesAdvice = () => {
      if (!salesPrompt.trim()) return
      setSalesAdvice(`Sugestão para “${salesPrompt.trim()}”: começa por explicar um benefício verificável, mostra condições e preço com clareza e dá ao cliente uma escolha sem pressão.`)
      setSalesPrompt('')
    }

    const startCheckout = () => {
      if (!selectedPlan) {
        setCheckoutNotice('Seleciona primeiro um pacote Guard Code.')
        return
      }
      const checkoutUrl = import.meta.env['VITE_CHECKOUT_URL']
      if (!checkoutUrl) {
        setCheckoutNotice('O checkout ainda não foi configurado. Nenhum pagamento será iniciado.')
        return
      }
      try {
        const destination = new URL(checkoutUrl)
        destination.searchParams.set('plan', selectedPlan.id)
        window.location.assign(destination.toString())
      } catch {
        setCheckoutNotice('O endereço de checkout configurado não é válido. Nenhum pagamento será iniciado.')
      }
    }

    return <main className="guided-app sales-app"><header className="guided-header"><div className="brand sales-brand"><span className="brand-mark">A</span><span>AURYON</span></div><button className="back-button compact" type="button" onClick={() => setActiveView('protection')}>Voltar à proteção</button></header><section className="guided-hero sales-hero"><p className="eyebrow">AURYON ACCESS</p><h1>Proteção inteligente, com condições claras.</h1><p>Pacotes para analisar código, proteger atividade e gerir acesso a ferramentas de IA por API.</p></section><section className="plan-section" aria-labelledby="plans-title"><div className="plan-section-heading"><div><p className="eyebrow">Guard Code</p><h2 id="plans-title">Escolhe a duração certa</h2></div><p>Pagamento é processado fora da aplicação. A ativação depende da confirmação pelo fornecedor de pagamento.</p></div><div className="plan-grid">{guardCodePlans.map((plan) => <article className={plan.featured ? 'plan-card featured' : 'plan-card'} key={plan.id}><p>{plan.name}</p><strong>{plan.price}</strong><span>{plan.duration}</span><small>{plan.detail}</small><button type="button" onClick={() => { setSelectedPlan(plan); setCheckoutNotice('') }} aria-pressed={selectedPlan?.id === plan.id}>{selectedPlan?.id === plan.id ? 'Selecionado' : 'Selecionar pacote'}</button></article>)}</div><div className="checkout-bar" aria-live="polite"><div><strong>{selectedPlan ? `${selectedPlan.name} · ${selectedPlan.price}` : 'Nenhum pacote selecionado'}</strong><p>{checkoutNotice || 'Antes de continuar, confirma a duração, o preço e as condições de cancelamento.'}</p></div><button className="checkout-button" type="button" onClick={startCheckout}>Continuar para pagamento</button></div><p className="legal-note">Ao continuar, aceitas consultar os <a href="/legal/terms.html" target="_blank" rel="noreferrer">termos comerciais</a> e a <a href="/legal/privacy.html" target="_blank" rel="noreferrer">política de privacidade</a>. GPT, Claude e outros modelos são integrações opcionais por API, sujeitas a disponibilidade, limites de utilização e regras de cada fornecedor.</p></section><section className="sales-layout"><article className="guided-card sales-workspace"><div className="panel-heading"><div><p className="eyebrow">Assistente comercial</p><h2>Preparar uma mensagem</h2></div><span className="adult-badge">18+</span></div>{!salesAccessConfirmed ? <div className="age-confirmation"><h3>Confirmação de idade</h3><p>Esta ferramenta destina-se apenas a pessoas com 18 anos ou mais e não deve ser usada para pressionar, manipular ou enganar clientes.</p><button className="primary-action" type="button" onClick={() => setSalesAccessConfirmed(true)}>Tenho 18 anos ou mais</button></div> : <><div className="sales-answer"><span>IA</span><p>{salesAdvice}</p></div><div className="tutor-input"><input value={salesPrompt} onChange={(event) => setSalesPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') createSalesAdvice() }} placeholder="Ex.: plano de proteção para uma pequena empresa" aria-label="Pedido para IA de vendas" /><button type="button" onClick={createSalesAdvice}>Gerar</button></div><small>Evita inserir dados pessoais, credenciais, informação financeira ou promessas que não possas cumprir.</small></>}</article><aside className="help-card"><p className="eyebrow">Acesso por API</p><h2>Modelos, com controlo</h2><ul><li>Chaves e pedidos são tratados no servidor.</li><li>Limites de uso e custos são apresentados antes da ativação.</li><li>Nunca envies dados pessoais ou credenciais nos pedidos.</li></ul></aside></section></main>
  }

  if (activeView === 'education') {
    const selectedTrack = tracks.find((track) => track.id === educationTrack) ?? tracks[0]!
    const askTutor = () => {
      const normalized = question.toLowerCase()
      if (!question.trim()) return
      if (normalized.includes('dinheiro') || normalized.includes('juros') || normalized.includes('poupar')) {
        setAnswer('Começa por separar o dinheiro em três partes: necessidades, objetivos e lazer. Ao poupar, os juros podem fazer o saldo crescer, mas nenhum investimento é garantido: compara sempre risco, prazo e custos.')
      } else if (normalized.includes('matemática') || normalized.includes('matematica')) {
        setAnswer('Vamos por etapas: identifica os dados, escreve o que precisas de descobrir, escolhe a operação e confirma se o resultado faz sentido. Podes enviar o enunciado sem dados pessoais.')
      } else {
        setAnswer('Boa pergunta. Divide o problema em partes pequenas, explica o que já sabes e confirma a resposta numa fonte de confiança. Posso ajudar com matérias escolares e literacia financeira, mas não substituo um professor ou consultor.')
      }
      setQuestion('')
    }

    return <main className="education-app">
      <header className="education-header"><div><p className="eyebrow">BaseGuard Educação</p><h1>Aprender com clareza</h1><p>Um percurso seguro do 5.º ano à faculdade, com literacia financeira desde cedo.</p></div><button className="profile-button" type="button" onClick={() => setActiveView('login')} aria-label="Abrir conta">AC</button></header>
      <nav className="education-nav" aria-label="Áreas de aprendizagem"><button className="education-nav-active" type="button">Percursos</button><button type="button" onClick={() => document.getElementById('finance')?.scrollIntoView({ behavior: 'smooth' })}>Treino financeiro</button><button type="button" onClick={() => document.getElementById('tutor')?.scrollIntoView({ behavior: 'smooth' })}>Tutor IA</button><button type="button" onClick={() => setActiveView('portal')}>Portal</button><button type="button" onClick={() => setActiveView('protection')}>Proteção</button></nav>
      <section className="education-hero"><div><p className="eyebrow">O teu próximo passo</p><h2>Escolhe o nível que combina contigo.</h2><p>Conteúdo progressivo, desafios curtos e explicações que respeitam o teu ritmo.</p></div><div className="hero-stat"><strong>4</strong><span>percursos preparados</span></div><div className="hero-stat"><strong>1</strong><span>conta, vários objetivos</span></div></section>
      <section className="track-grid" aria-label="Percursos escolares">{tracks.map((track) => <button className={educationTrack === track.id ? 'track-card selected' : 'track-card'} type="button" key={track.id} onClick={() => setEducationTrack(track.id)}><span className="track-label">{track.label}</span><strong>{track.title}</strong><p>{track.detail}</p><div className="progress-line"><span style={{ width: `${track.progress}%` }} /></div><small>{track.progress}% concluído</small></button>)}</section>
      <section className="learning-grid"><article className="learning-panel"><div className="panel-heading"><div><p className="eyebrow">Percurso atual</p><h2>{selectedTrack.title}</h2></div><span className="level-badge">{selectedTrack.label}</span></div><p className="learning-lead">{selectedTrack.detail}</p><div className="lesson-row"><span className="lesson-icon">01</span><div><strong>Aprender a aprender</strong><p>Define um objetivo e monta um plano de estudo.</p></div><b>Concluído</b></div><div className="lesson-row"><span className="lesson-icon next">02</span><div><strong>Desafio da semana</strong><p>Resolve um problema e explica o teu raciocínio.</p></div><b className="lesson-next">Próximo</b></div><button className="primary-action" type="button" onClick={continueTrack}>Continuar percurso</button></article><article className="tutor-panel" id="tutor"><div className="panel-heading"><div><p className="eyebrow">Assistente de estudo</p><h2>Tutor IA</h2></div><span className="ai-status">Local · seguro</span></div><div className="tutor-answer"><span className="ai-mark">IA</span><p>{answer}</p></div><div className="tutor-input"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') askTutor() }} placeholder="Pergunta sobre uma matéria..." aria-label="Pergunta ao tutor" /><button type="button" onClick={askTutor} aria-label="Enviar pergunta">Enviar</button></div><small>Não partilhes nome, morada, palavra-passe ou outros dados pessoais.</small></article></section>
      <section className="finance-section" id="finance"><div className="section-intro"><p className="eyebrow">Literacia para a vida</p><h2>Treino financeiro</h2><p>Aprende a tomar decisões informadas. O conteúdo é educativo e não é aconselhamento financeiro.</p></div><div className="finance-content"><div className="finance-lessons">{financeLessons.map((lesson, index) => <article key={lesson.title} className={financeComplete && index === 0 ? 'finance-lesson complete' : 'finance-lesson'}><span>{financeComplete && index === 0 ? 'OK' : `0${index + 1}`}</span><div><strong>{lesson.title}</strong><p>{lesson.detail}</p></div><small>{lesson.value}</small></article>)}</div><div className="finance-challenge"><span className="challenge-kicker">Desafio rápido</span><h3>Antes de comprar, qual pergunta vem primeiro?</h3><p>“Preciso mesmo disto ou estou a comprar por impulso?” é uma boa primeira verificação.</p><button className="primary-action" type="button" onClick={() => setFinanceComplete(true)}>{financeComplete ? 'Desafio concluído' : 'Marcar como concluído'}</button></div></div></section>
      <footer className="education-footer"><span>Conteúdo educativo acessível e progressivo.</span><a href="/legal/terms.html">Termos</a><a href="/legal/privacy.html">Privacidade</a></footer>
    </main>
  }

  return <main className="security-app">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">B</span><span>BaseGuard</span></div><nav aria-label="Navegacao principal"><button className="nav-item active" type="button" onClick={() => setActiveView('protection')}>Visao geral</button><button className="nav-item" type="button" onClick={() => setActiveView('npm')}>Segurança npm</button><button className="nav-item" type="button" onClick={() => setActiveView('scripts')}>Protecao de scripts</button><button className="nav-item" type="button" onClick={() => setActiveView('quarantine')}>Quarentena</button><button className="nav-item" type="button" onClick={() => setActiveView('education')}>Educação</button><button className="nav-item" type="button" onClick={() => setActiveView('portal')}>Portal</button><button className="nav-item" type="button" onClick={() => setActiveView('sales')}>Planos Guard Code</button><button className="nav-item" type="button" onClick={() => setActiveView('activity')}>Atividade</button><button className="nav-item" type="button" onClick={() => setActiveView('settings')}>Definições</button></nav><div className="sidebar-footer"><button className="nav-item" type="button" onClick={() => setActiveView('login')}>Conta</button><p>Motor de protecao 1.0</p></div></aside>
    <section className="workspace">
      <header className="topbar"><div><p className="eyebrow">Central de seguranca</p><h1>Seu ambiente esta protegido</h1></div><button className="profile-button" type="button" onClick={() => setActiveView('login')} aria-label="Abrir conta">AC</button></header>
      <section className="status-panel" aria-live="polite"><div className="shield"><span>{scanState === 'offline' ? 'LOCAL' : 'OK'}</span></div><div className="status-copy"><p className="status-title">Protecao ativa</p><p>Monitoramento em tempo real e bloqueio de comportamentos suspeitos estao ligados.</p></div><button className="scan-button" type="button" onClick={startScan} disabled={scanState === 'scanning'}>{scanState === 'scanning' ? 'Verificando' : 'Iniciar varredura'}</button></section>
      <section className="audience-tabs" aria-label="Áreas especiais"><div><p className="eyebrow">Proteção para cada pessoa</p><h2>Família, apoio e trabalho</h2></div><button type="button" onClick={() => setActiveView('npm')}>Segurança npm</button><button type="button" onClick={() => setActiveView('education')}>Crianças e estudantes</button><button type="button" onClick={() => setActiveView('seniors')}>Ajuda para avós</button><button className="adult-tab" type="button" onClick={() => setActiveView('sales')}>IA de vendas <span>18+</span></button></section>
      <section className="metrics" aria-label="Resumo da protecao"><article><p>Itens verificados</p><strong>{scanResult?.checked ?? 0}</strong><span>{scanResult ? `${scanResult.activeModules} módulos ativos` : 'Executa uma varredura para verificar'}</span></article><article><p>Ameacas isoladas</p><strong>{scanResult?.threats ?? threats.length}</strong><span>{threats.length ? 'Revisão disponível na quarentena' : 'Quarentena limpa'}</span></article><article><p>Ultima verificacao</p><strong>{scanResult?.completedAt ?? 'Nunca'}</strong><span className={scanState === 'scanning' ? 'pulse-text' : ''}>{scanState === 'scanning' ? 'Verificando scripts...' : scanDetail}</span></article></section>
      <section className="content-grid"><article className="panel scan-panel"><div className="panel-heading"><div><p className="eyebrow">Protecao proativa</p><h2>Monitoramento de scripts</h2></div><button className={protectedRealtime ? 'toggle on' : 'toggle'} type="button" onClick={() => setProtectedRealtime(!protectedRealtime)} aria-label="Alternar monitoramento em tempo real"><span /></button></div><div className="scan-visual"><div className={scanState === 'scanning' ? 'scan-ring scanning' : 'scan-ring'}><span>{scanState === 'scanning' ? '...' : protectedRealtime ? 'ON' : 'OFF'}</span></div><div><p className="visual-title">{protectedRealtime ? 'Analise comportamental ativa' : 'Analise em pausa'}</p><p>Detecta comandos perigosos, ofuscacao e downloads sem validacao antes da execucao.</p></div></div><div className="coverage"><span>PowerShell</span><span>Shell Script</span><span>VBScript</span><span>JavaScript</span></div></article><article className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Ultimas 24 horas</p><h2>Atividade protegida</h2></div><button className="text-button" type="button" onClick={() => setActiveView('activity')}>Ver relatorio</button></div><ul className="activity-list"><li><i className="dot success" />Script validado em <b>Projetos/deploy.ps1</b><time>Agora</time></li><li><i className="dot warning" />Tentativa de download bloqueada<time>Ha 18 min</time></li><li><i className="dot success" />Verificacao agendada concluida<time>Ha 42 min</time></li></ul></article></section>
      <section className="panel threat-panel"><div className="panel-heading"><div><p className="eyebrow">Requer atencao</p><h2>Itens isolados</h2></div>{threats.length > 0 && <button className="text-button danger" type="button" onClick={clearQuarantine}>Esvaziar quarentena</button>}</div>{threats.length > 0 ? <div className="threat-table"><div className="table-head"><span>Arquivo</span><span>Deteccao</span><span>Risco</span><span>Acao</span></div>{threats.map((threat) => <div className="table-row" key={threat.file}><strong>{threat.file}</strong><span>{threat.rule}</span><span><b className={threat.risk === 'Alto' ? 'risk high' : 'risk medium'}>{threat.risk}</b></span><span className="action-status">{threat.action}</span></div>)}</div> : <div className="empty-state"><strong>Quarentena vazia</strong><span>Os itens isolados aparecerao aqui para sua revisao.</span></div>}</section>
    </section>
  </main>
}

export default App

