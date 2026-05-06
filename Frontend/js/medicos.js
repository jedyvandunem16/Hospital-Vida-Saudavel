/**
 * medicos.js — Carregamento dinâmico de médicos da API
 * Se a API não responder, os médicos estáticos do HTML ficam visíveis.
 */

const STAR_FULL  = '<i class="fa-solid fa-star"></i>';
const STAR_HALF  = '<i class="fa-solid fa-star-half-stroke"></i>';

function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i)           stars += STAR_FULL;
    else if (rating >= i - 0.5) stars += STAR_HALF;
    else                       stars += '<i class="fa-regular fa-star"></i>';
  }
  return stars;
}

const FOTOS_FALLBACK = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80',
];

let todosMedicos = [];

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderMedicos(lista) {
  const grid      = document.getElementById('doctorsGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  if (!lista.length) {
    grid.style.display = 'none';
    if (noResults) noResults.classList.remove('hidden');
    return;
  }

  if (noResults) noResults.classList.add('hidden');
  grid.style.display = '';

  grid.innerHTML = lista.map((m, idx) => {
    const foto    = m.foto_url || FOTOS_FALLBACK[idx % FOTOS_FALLBACK.length];
    const rating  = (4.7 + (idx % 3) * 0.1).toFixed(1);
    const reviews = 50 + (idx * 13 % 100);
    const espSlug = slugify(m.especialidade || '');

    return `
      <div class="doc-full-card" data-specialty="${espSlug}">
        <div class="doc-full-img">
          <img src="${foto}" alt="${m.titulo || 'Dr.'} ${m.nome}" loading="lazy"
               onerror="this.src='${FOTOS_FALLBACK[0]}'"/>
          <span class="doc-badge">${m.especialidade || ''}</span>
        </div>
        <div class="doc-full-info">
          <h3>${m.titulo || 'Dr.'} ${m.nome}</h3>
          <p class="doc-specialty">${m.especialidade || ''}</p>
          <p class="doc-bio">${m.bio || 'Médico especialista com vasta experiência clínica ao serviço dos pacientes de Luanda.'}</p>
          <div class="doc-meta">
            ${m.formacao ? `<span><i class="fa-solid fa-graduation-cap"></i> ${m.formacao}</span>` : ''}
            ${m.anos_experiencia ? `<span><i class="fa-solid fa-clock"></i> ${m.anos_experiencia} anos exp.</span>` : ''}
          </div>
          <div class="doc-rating">
            ${renderStars(parseFloat(rating))}
            <span>${rating} (${reviews} avaliações)</span>
          </div>
          <a href="marcacao.html?medico_id=${m.id}&servico=${encodeURIComponent(m.especialidade || '')}"
             class="btn-primary sm">Marcar Consulta</a>
        </div>
      </div>`;
  }).join('');

  // Animar cards
  document.querySelectorAll('.doc-full-card').forEach((c, i) => {
    c.style.opacity = '0';
    c.style.transform = 'translateY(24px)';
    c.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    setTimeout(() => {
      c.style.opacity = '1';
      c.style.transform = 'translateY(0)';
    }, i * 80);
  });
}

function filtrar(especialidade) {
  if (especialidade === 'all') {
    // Se temos dados da API, mostrar todos
    if (todosMedicos.length) { renderMedicos(todosMedicos); return; }
    // Senão, mostrar todos os cards estáticos
    document.querySelectorAll('.doc-full-card').forEach(c => c.style.display = '');
    const noResults = document.getElementById('noResults');
    if (noResults) noResults.classList.add('hidden');
    return;
  }

  if (todosMedicos.length) {
    const lista = todosMedicos.filter(m => slugify(m.especialidade || '') === especialidade);
    renderMedicos(lista);
  } else {
    // Filtrar cards estáticos
    const cards = document.querySelectorAll('.doc-full-card');
    let visible = 0;
    cards.forEach(card => {
      const show = card.dataset.specialty === especialidade;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    const noResults = document.getElementById('noResults');
    if (noResults) noResults.classList.toggle('hidden', visible > 0);
  }
}

async function carregarEspecialidadesBar() {
  try {
    const esps = await apiGet('/especialidades');
    const bar  = document.getElementById('filterBar');
    if (!bar) return;
    // Limpar botões estáticos antigos (mantém só "Todos")
    bar.querySelectorAll('.filter-btn:not([data-filter="all"])').forEach(b => b.remove());
    esps.forEach(e => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = slugify(e.nome);
      btn.textContent = e.nome;
      bar.appendChild(btn);
    });
  } catch {
    // Mantém os botões estáticos que já estão no HTML
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filtrar(this.dataset.filter);
    });
  });
}

(async function init() {
  // Bind filtros primeiro (para que funcionem mesmo sem API)
  await carregarEspecialidadesBar();

  try {
    todosMedicos = await apiGet('/medicos');
    if (todosMedicos.length) {
      renderMedicos(todosMedicos);
    }
    // Filtro por URL
    const urlEsp = new URLSearchParams(window.location.search).get('especialidade');
    if (urlEsp) {
      const slug = slugify(urlEsp);
      const btn  = document.querySelector(`.filter-btn[data-filter="${slug}"]`);
      if (btn) btn.click();
    }
  } catch {
    // API não disponível — cards estáticos do HTML ficam visíveis (não escondemos nada)
    console.info('Backend não disponível — a mostrar médicos estáticos.');
  }
})();