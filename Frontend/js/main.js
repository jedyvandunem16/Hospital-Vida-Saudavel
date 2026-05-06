// =====================
//   FOOTER TEMPLATE (original restaurado)
// =====================
// =====================
//   FOOTER TEMPLATE
//   [BAIXA 1] Nome canónico via CONFIG.APP_SHORT_NAME
//   [BAIXA 3] Contactos e redes sociais via CONFIG — editar em config.js
// =====================
function buildFooterHTML() {
  const C = (typeof CONFIG !== 'undefined') ? CONFIG : {};
  const nome      = C.APP_SHORT_NAME || 'Vida Saudável';
  const telefone  = C.TELEFONE  || '+244 900 000 000';  // TODO: actualizar em config.js
  const email     = C.EMAIL     || 'hospital@vidasaudavel.co.ao'; // TODO
  const morada    = C.MORADA    || 'Av. 4 de Fevereiro, Nº 123, Luanda'; // TODO
  const social    = C.SOCIAL    || {};

  // Só renderiza o ícone social se o link estiver definido em config.js
  const socialLinks = [
    { href: social.facebook,  icon: 'fa-facebook-f',  label: 'Facebook'  },
    { href: social.instagram, icon: 'fa-instagram',   label: 'Instagram' },
    { href: social.linkedin,  icon: 'fa-linkedin-in', label: 'LinkedIn'  },
    { href: social.whatsapp,  icon: 'fa-whatsapp',    label: 'WhatsApp'  },
  ]
  .filter(s => s.href)
  .map(s => `<a href="${s.href}" aria-label="${s.label}" target="_blank" rel="noopener noreferrer"><i class="fa-brands ${s.icon}"></i></a>`)
  .join('');

  return `
  <div class="footer-top">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a href="index.html" class="logo footer-logo">
          <span class="logo-icon"><i class="fa-solid fa-plus"></i></span>
          <span class="logo-text">${nome}</span>
        </a>
        <p class="footer-desc">Cuidando da sua saúde com excelência e dedicação desde 2004, em Luanda, Angola.</p>
        <div class="footer-social">${socialLinks}</div>
      </div>
      <div class="footer-col">
        <h4>Links Rápidos</h4>
        <ul>
          <li><a href="index.html"><i class="fa-solid fa-chevron-right"></i> Início</a></li>
          <li><a href="hospitais.html"><i class="fa-solid fa-chevron-right"></i> Hospitais</a></li>
          <li><a href="servicos.html"><i class="fa-solid fa-chevron-right"></i> Serviços</a></li>
          <li><a href="medicos.html"><i class="fa-solid fa-chevron-right"></i> Médicos</a></li>
          <li><a href="sobre.html"><i class="fa-solid fa-chevron-right"></i> Sobre Nós</a></li>
          <li><a href="contacto.html"><i class="fa-solid fa-chevron-right"></i> Contacto</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Especialidades</h4>
        <ul>
          <li><a href="servicos.html#cardiologia"><i class="fa-solid fa-chevron-right"></i> Cardiologia</a></li>
          <li><a href="servicos.html#pediatria"><i class="fa-solid fa-chevron-right"></i> Pediatria</a></li>
          <li><a href="servicos.html#laboratorio"><i class="fa-solid fa-chevron-right"></i> Laboratório</a></li>
          <li><a href="servicos.html#urgencia"><i class="fa-solid fa-chevron-right"></i> Urgência 24h</a></li>
          <li><a href="marcacao.html"><i class="fa-solid fa-chevron-right"></i> Marcar Consulta</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contacto</h4>
        <ul class="footer-contact-list">
          <li><i class="fa-solid fa-location-dot"></i> ${morada}</li>
          <li><i class="fa-solid fa-phone"></i> ${telefone}</li>
          <li><i class="fa-solid fa-envelope"></i> ${email}</li>
          <li><i class="fa-solid fa-clock"></i> Urgência: 24h / 7 dias</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <p>© ${new Date().getFullYear()} ${nome} – Todos os direitos reservados</p>
      <div class="footer-bottom-links">
        <a href="#">Política de Privacidade</a>
        <span>·</span>
        <a href="#">Termos de Uso</a>
        <span>·</span>
        <a href="contacto.html">Reclamações</a>
      </div>
    </div>
  </div>
  `;
}

// Inject footer
const footerEl = document.getElementById('footer-main');
if (footerEl) footerEl.innerHTML = buildFooterHTML();

// =====================
//   NAVBAR SCROLL
// =====================
const navbar = document.getElementById('navbar');
const backTop = document.getElementById('backTop');

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);
  if (backTop) backTop.classList.toggle('visible', window.scrollY > 400);
});

// =====================
//   HAMBURGER MENU
// =====================
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

function abrirMenu() {
  navLinks.classList.add('open');
  hamburger.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharMenu() {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

if (hamburger && navLinks) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.contains('open') ? fecharMenu() : abrirMenu();
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', fecharMenu);
  });
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !navbar.contains(e.target)) {
      fecharMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 680) fecharMenu();
  });
}

// =====================
//   SCROLL ANIMATIONS
// =====================
const observerOpts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
window.observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      entry.target.classList.add('active'); // Para a nova class .reveal
      window.observer.unobserve(entry.target);
    }
  });
}, observerOpts);

const style = document.createElement('style');
style.textContent = `
  .svc-card, .doc-card, .doc-full-card, .testi-card, .value-card,
  .cert-card, .cinfo-card, .why-item, .tl-item, .hospital-card {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
  .svc-card:nth-child(2), .doc-card:nth-child(2), .testi-card:nth-child(2),
  .hospital-card:nth-child(2) { transition-delay: 0.1s; }
  .svc-card:nth-child(3), .doc-card:nth-child(3), .testi-card:nth-child(3),
  .hospital-card:nth-child(3) { transition-delay: 0.2s; }
  .svc-card:nth-child(4), .hospital-card:nth-child(4) { transition-delay: 0.3s; }
  .svc-card:nth-child(5), .hospital-card:nth-child(5) { transition-delay: 0.1s; }
  .svc-card:nth-child(6), .hospital-card:nth-child(6) { transition-delay: 0.2s; }
`;
document.head.appendChild(style);

document.querySelectorAll(
  '.svc-card, .doc-card, .doc-full-card, .testi-card, .value-card, .cert-card, .cinfo-card, .why-item, .tl-item, .hospital-card, .reveal'
).forEach(el => window.observer.observe(el));

// =====================
//   COUNTER ANIMATION
// =====================
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const duration = 1800;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const text = el.textContent;
      const num = parseInt(text.replace(/\D/g, ''));
      const suffix = text.replace(/[\d+]/g, '');
      if (num) animateCounter(el, num, suffix.replace(/[0-9]/g, ''));
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.hstat-num, .astat-num, .stat-num').forEach(el => {
  counterObserver.observe(el);
});