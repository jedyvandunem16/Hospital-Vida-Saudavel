// =====================
//   FOOTER TEMPLATE
// =====================
const footerHTML = `
  <div class="footer-top">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a href="index.html" class="logo footer-logo">
          <span class="logo-icon"><i class="fa-solid fa-plus"></i></span>
          <span class="logo-text">Vida Saudável</span>
        </a>
        <p class="footer-desc">Cuidando da sua saúde com excelência e dedicação desde 2004, em Luanda, Angola.</p>
        <div class="footer-social">
          <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
          <a href="#" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Links Rápidos</h4>
        <ul>
          <li><a href="index.html"><i class="fa-solid fa-chevron-right"></i> Início</a></li>
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
          <li><i class="fa-solid fa-location-dot"></i> Av. 4 de Fevereiro, Nº 123, Luanda</li>
          <li><i class="fa-solid fa-phone"></i> +244 900 000 000</li>
          <li><i class="fa-solid fa-envelope"></i> hospital@vidasaudavel.co.ao</li>
          <li><i class="fa-solid fa-clock"></i> Urgência: 24h / 7 dias</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <p>© 2026 Hospital Vida Saudável – Todos os direitos reservados</p>
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

// Inject footer
const footerEl = document.getElementById('footer-main');
if (footerEl) footerEl.innerHTML = footerHTML;

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
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on nav link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// =====================
//   SCROLL ANIMATIONS
// =====================
const observerOpts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOpts);

// Add animation classes via CSS
const style = document.createElement('style');
style.textContent = `
  .svc-card, .doc-card, .doc-full-card, .testi-card, .value-card,
  .cert-card, .cinfo-card, .why-item, .tl-item, .doc-full-card {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
  .svc-card:nth-child(2), .doc-card:nth-child(2), .doc-full-card:nth-child(2),
  .testi-card:nth-child(2), .value-card:nth-child(2), .cert-card:nth-child(2) {
    transition-delay: 0.1s;
  }
  .svc-card:nth-child(3), .doc-card:nth-child(3), .doc-full-card:nth-child(3),
  .testi-card:nth-child(3), .value-card:nth-child(3), .cert-card:nth-child(3) {
    transition-delay: 0.2s;
  }
  .svc-card:nth-child(4), .doc-full-card:nth-child(4), .cert-card:nth-child(4) {
    transition-delay: 0.3s;
  }
  .svc-card:nth-child(5), .doc-full-card:nth-child(5) { transition-delay: 0.1s; }
  .svc-card:nth-child(6), .doc-full-card:nth-child(6) { transition-delay: 0.2s; }
`;
document.head.appendChild(style);

document.querySelectorAll(
  '.svc-card, .doc-card, .doc-full-card, .testi-card, .value-card, .cert-card, .cinfo-card, .why-item, .tl-item'
).forEach(el => observer.observe(el));

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
