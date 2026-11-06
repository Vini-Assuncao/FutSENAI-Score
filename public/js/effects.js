// effects.js — microinterações visuais (contagem de números, revelação ao rolar, sombra da barra superior).
// Só mexe em classes e textos já renderizados; não altera dados nem rotas.
const pageContent = document.getElementById('pageContent');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Conta de 0 até o valor mostrado nos cards de números (aceita inteiros e decimais com vírgula ou ponto).
function countUp(el) {
  const raw = el.textContent.trim();
  if (!/^\d+([.,]\d+)?$/.test(raw) || el.dataset.counted) return;
  el.dataset.counted = '1';
  const comma = raw.includes(',');
  const decimals = (raw.split(/[.,]/)[1] || '').length;
  const target = parseFloat(raw.replace(',', '.'));
  if (!target) return;
  const duration = 900;
  const start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    let text = (target * eased).toFixed(decimals);
    if (comma) text = text.replace('.', ',');
    el.textContent = text;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = raw;
  };
  requestAnimationFrame(step);
}

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 })
  : null;

function enhance() {
  if (!pageContent) return;
  if (!reduceMotion) pageContent.querySelectorAll('.stat-value').forEach(countUp);
  // Seções longas (equipe, painéis) aparecem suavemente ao rolar.
  pageContent.querySelectorAll('.team-hero, .group-sites, .team-footer, .stats-page-grid > .panel').forEach(el => {
    if (el.dataset.reveal) return;
    el.dataset.reveal = '1';
    if (!revealObserver || reduceMotion) return;
    el.classList.add('js-reveal');
    revealObserver.observe(el);
  });
}

if (pageContent) {
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; enhance(); });
  }).observe(pageContent, { childList: true });
  enhance();
}

// Sombra na barra superior ao rolar a página.
const topbar = document.querySelector('.topbar');
if (topbar) {
  const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
