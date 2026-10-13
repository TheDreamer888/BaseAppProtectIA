// Movimento leve: revela elementos e só anima o que está no ecrã.
// Sem ciclos contínuos em JavaScript — o trabalho fica nas animações CSS
// (transform/opacity, compostas na GPU), que pausam fora do ecrã.
(() => {
  const root = document.documentElement
  root.classList.add('js')
  if (!('IntersectionObserver' in window)) {
    root.classList.add('no-io')
    return
  }

  // Revelar uma vez e deixar de observar.
  const reveal = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        reveal.unobserve(e.target)
      }
    }
  }, { rootMargin: '0px 0px -10% 0px' })
  document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el))

  // Animações contínuas só correm quando a secção está visível.
  const live = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('live', e.isIntersecting)
  })
  document.querySelectorAll('.stage').forEach((el) => live.observe(el))

  // Barra de navegação sólida depois do hero (sem listener de scroll).
  const hero = document.querySelector('.hero')
  const nav = document.querySelector('.nav')
  if (hero && nav) {
    new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting), {
      rootMargin: '-80px 0px 0px 0px',
    }).observe(hero)
  }

  // Fechar o menu móvel ao escolher um destino, com Escape ou ao tocar fora.
  const menu = document.querySelector('.menu')
  if (menu) {
    const close = () => menu.removeAttribute('open')
    menu.addEventListener('click', (ev) => {
      if (ev.target instanceof HTMLAnchorElement) close()
    })
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && menu.open) {
        close()
        menu.querySelector('summary')?.focus()
      }
    })
    document.addEventListener('click', (ev) => {
      if (menu.open && !menu.contains(ev.target)) close()
    })
  }
})()
