/* medicos.js — Dynamic loading of doctors with skeleton, pagination, and filters */

const STAR_FULL = '<i class="fa-solid fa-star"></i>';
const STAR_HALF = '<i class="fa-solid fa-star-half-stroke"></i>';

function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars += STAR_FULL;
    else if (rating >= i - 0.5) stars += STAR_HALF;
    else stars += '<i class="fa-regular fa-star"></i>';
  }
  return stars;
}

const SPECIALTY_DESCRIPTIONS = {
  'Cardiologia': 'Especialista em diagnóstico e tratamento das doenças cardiovasculares, com foco em prevenção e reabilitação cardíaca.',
  'Pediatria': 'Especialista em cuidados de saúde integral para crianças e adolescentes, abrangendo prevenção, diagnóstico e tratamento.',
  'Clínica Geral': 'Médico de atenção primária que oferece cuidados preventivos, diagnóstico e manejo de doenças crônicas.',
  'Urgência': 'Profissional pronto a atender emergências médicas 24h por dia, garantindo resposta rápida e eficaz.',
  'Ortopedia': 'Especialista em diagnóstico e tratamento de lesões e doenças do sistema músculo-esquelético.',
  'Neurologia': 'Especialista em doenças do sistema nervoso central e periférico, proporcionando diagnósticos avançados.',
  'Laboratório': 'Especialista em análises clínicas e diagnóstico laboratorial para suporte diagnóstico.',
  'Dermatologia': 'Especialista em condições da pele, cabelo e unhas, oferecendo tratamentos modernos.',
  'Ginecologia': 'Especialista em saúde da mulher, incluindo obstetrícia e cuidados ginecológicos.',
  'Oftalmologia': 'Especialista em saúde visual e tratamento de doenças oculares.',
  'Maternidade': 'Especialista em cuidados pré-natais, parto e pós-natal, garantindo segurança materna e infantil.',
  'Cirurgia Geral': 'Especialista em procedimentos cirúrgicos de média e alta complexidade.',
  'Cardiovascular e Torácica': 'Cirurgião torácico especializado em procedimentos cardiovasculares avançados.',
  'Endocrinologia': 'Especialista em distúrbios hormonais e metabólicos, proporcionando tratamento integral.',
  'Radiologia': 'Especialista em diagnóstico por imagem e radioterapia, oferecendo avaliações precisas.',
  // Add other specialties as needed
};
const UNIVERSIDADES = [
  'Universidade Metodista de Angola',
  'Universidade Agostinho Neto',
  'Universidade Jean Piaget de Angola',
  'Universidade de Belas',
  'Instituto de Ciências da Saúde (ICISA)',
  'Instituto Superior de Angola',
  'Instituto Superior de Angola (ISIA)'
];

const MEDICO_IMAGES = [
  'img/medica_1.jpg',
  'img/medica_2.jpg',
  'img/medico_4.jpg',
  'img/medico_5.webp',
  'img/medica_7.jpg',
  'img/medica_8.png',
  'img/medico_9.jpg',
  'img/medico_10.jpg'
];


let todosMedicos = [];
let currentList = [];
let currentPage = 1;
const PAGE_SIZE = 12;
const INITIAL_FILTER_COUNT = 8;

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function renderSkeleton(count) {
  const container = document.getElementById('skeletonContainer');
  if (!container) return;
  let markup = '';
  for (let i = 0; i < count; i++) {
    markup += `<div class="doc-full-card skeleton-card"></div>`;
  }
  container.innerHTML = markup;
  container.classList.remove('hidden');
}

function clearSkeleton() {
  const container = document.getElementById('skeletonContainer');
  if (container) container.classList.add('hidden');
}

function renderMedicos(lista) {
  const grid = document.getElementById('doctorsGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  if (!lista.length) {
    grid.style.display = 'none';
    if (noResults) noResults.classList.remove('hidden');
    return;
  }
  if (noResults) noResults.classList.add('hidden');
  grid.style.display = '';

  const markup = lista.map((m, idx) => {
    const isFemale = (m.titulo && m.titulo.toLowerCase().includes('dra')) || (m.sexo && m.sexo === 'F');
    const foto = MEDICO_IMAGES[idx % MEDICO_IMAGES.length];
    const cleanedTitle = (m.titulo || '').replace(/(Dr\.?\s*|Dra\.?\s*)/gi, '').trim();
    const displayTitle = isFemale ? 'Dra.' : 'Dr.';
    const rating = (4.7 + (idx % 3) * 0.1).toFixed(1);
    const reviews = 50 + (idx * 13 % 100);
    const espSlug = slugify(m.especialidade || '');
    const uni = UNIVERSIDADES[idx % UNIVERSIDADES.length];
    return `
      <div class="doc-full-card" data-specialty="${espSlug}">
        <div class="doc-full-img">
            <img src="${foto}" alt="${displayTitle} ${m.nome}" loading="lazy" onerror="this.src='img/medico_4.jpg'"/>
          <span class="doc-badge">${m.especialidade || ''}</span>
        </div>
        <div class="doc-full-info">
           <h3>${displayTitle} ${cleanedTitle || m.nome || 'Médico #' + m.id}</h3>
          <p class="doc-specialty">${m.especialidade || ''}</p>
          <p class="doc-bio">${m.bio || SPECIALTY_DESCRIPTIONS[m.especialidade] || (isFemale ? 'Médica especialista com vasta experiência clínica ao serviço dos pacientes de Luanda.' : 'Médico especialista com vasta experiência clínica ao serviço dos pacientes de Luanda.')}</p>
          <p class="doc-university">Formado em ${uni}</p>
          <div class="doc-meta">
            ${m.formacao ? `<span><i class="fa-solid fa-graduation-cap"></i> ${m.formacao}</span>` : ''}
            ${m.anos_experiencia ? `<span><i class="fa-solid fa-clock"></i> ${m.anos_experiencia} anos exp.</span>` : ''}
          </div>
          <div class="doc-rating">
            ${renderStars(parseFloat(rating))}
            <span>${rating} (${reviews} avaliações)</span>
          </div>
          <a href="marcacao.html?medico_id=${m.id}&servico=${encodeURIComponent(m.especialidade || '')}" class="btn-primary sm">Marcar Consulta</a>
        </div>
      </div>`;
  }).join('');

  grid.innerHTML = markup;

  // Animate cards
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

function renderCurrentPage() {
  const end = currentPage * PAGE_SIZE;
  const slice = currentList.slice(0, end);
  renderMedicos(slice);
  updatePagination();
}

function updatePagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  pagination.innerHTML = '';
  if (currentList.length > currentPage * PAGE_SIZE) {
    const btn = document.createElement('button');
    btn.id = 'loadMoreBtn';
    btn.className = 'btn-primary sm';
    btn.textContent = 'Carregar mais';
    btn.addEventListener('click', () => {
      currentPage++;
      renderCurrentPage();
    });
    pagination.appendChild(btn);
  }
}

function filtrar(especialidade) {
  if (especialidade === 'all') {
    currentList = todosMedicos;
  } else {
    currentList = todosMedicos.filter(m => slugify(m.especialidade || '') === especialidade);
  }
  currentPage = 1;
  renderCurrentPage();
}

async function carregarEspecialidadesBar() {
  try {
    const esps = await apiGet('/especialidades');
    const bar = document.getElementById('filterBar');
    if (!bar) return;
    bar.querySelectorAll('.filter-btn:not([data-filter="all"])').forEach(b => b.remove());
    bar.querySelector('.filter-more-btn')?.remove();

    esps.forEach((e, idx) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = slugify(e.nome);
      btn.textContent = e.nome;
      if (idx >= INITIAL_FILTER_COUNT) btn.classList.add('filter-extra', 'hidden');
      bar.appendChild(btn);
    });

    if (esps.length > INITIAL_FILTER_COUNT) {
      const moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'filter-btn filter-more-btn';
      moreBtn.dataset.expanded = 'false';
      moreBtn.innerHTML = 'Ver mais <i class="fa-solid fa-chevron-down"></i>';
      bar.appendChild(moreBtn);
    }
  } catch {
    // keep static buttons
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      if (this.classList.contains('filter-more-btn')) {
        const expanded = this.dataset.expanded === 'true';
        document.querySelectorAll('.filter-extra').forEach(extra => {
          extra.classList.toggle('hidden', expanded);
        });
        this.dataset.expanded = String(!expanded);
        this.innerHTML = expanded
          ? 'Ver mais <i class="fa-solid fa-chevron-down"></i>'
          : 'Ver menos <i class="fa-solid fa-chevron-up"></i>';
        return;
      }
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filtrar(this.dataset.filter);
    });
  });
}

(async function init() {
  // Show skeleton while loading
  renderSkeleton(PAGE_SIZE);
  await carregarEspecialidadesBar();
  try {
    todosMedicos = await apiGet('/medicos');
    console.log('Fetched medicos data:', todosMedicos);
    currentList = todosMedicos;
    renderCurrentPage();
    // Apply URL filter if present
    const urlEsp = new URLSearchParams(window.location.search).get('especialidade');
    if (urlEsp) {
      const slug = slugify(urlEsp);
      const btn = document.querySelector(`.filter-btn[data-filter="${slug}"]`);
      if (btn) {
        if (btn.classList.contains('hidden')) {
          document.querySelector('.filter-more-btn')?.click();
        }
        btn.click();
      }
    }
  } catch (e) {
    console.error('Error fetching medicos:', e);
    // API not available – static HTML cards already present
    clearSkeleton();
    console.info('Backend não disponível — a mostrar médicos estáticos.');
  }
  clearSkeleton();
})();
