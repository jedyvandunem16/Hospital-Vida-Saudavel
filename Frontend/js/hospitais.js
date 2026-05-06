/**
 * hospitais.js — Lógica da página de listagem de hospitais
 * Funciona com ou sem backend (usa dados locais como fallback)
 */

const TIPO_LABEL = {
  geral:        { label: 'Hospital Geral',  cor: '#1565c0' },
  especializado:{ label: 'Especializado',   cor: '#7b1fa2' },
  referencia:   { label: 'Referência',      cor: '#e53935' },
  maternidade:  { label: 'Maternidade',     cor: '#e91e63' },
  pediatrico:   { label: 'Pediátrico',      cor: '#f9a825' },
};

// Dados locais de fallback (usados quando o backend não responde)
const HOSPITAIS_FALLBACK = [
  {
    id: 1, nome: 'Hospital Josina Machel (Maria Pia)', municipio: 'Maianga', tipo: 'referencia',
    morada: 'Largo Josina Machel, Maianga, Luanda', telefone: '+244 222 330 400',
    foto_url: 'img/hospital Josina Machel.jpeg',
    descricao: 'O maior hospital do país e referência em cuidados de alta complexidade.',
    especialidades: [
      { id:12, nome:'Cirurgia Geral', icone:'fa-syringe', cor:'#546e7a' },
      { id:13, nome:'Cardiovascular e Torácica', icone:'fa-heart-pulse', cor:'#d32f2f' },
      { id:14, nome:'Maxilo-Facial', icone:'fa-face-smile', cor:'#7b1fa2' },
      { id:6, nome:'Neurologia', icone:'fa-brain', cor:'#7b1fa2' },
      { id:15, nome:'Neurocirurgia', icone:'fa-microchip', cor:'#6a1b9a' },
      { id:16, nome:'Hematologia', icone:'fa-droplet', cor:'#c62828' },
      { id:17, nome:'Infectologia', icone:'fa-virus', cor:'#2e7d32' },
      { id:18, nome:'Gastroenterologia', icone:'fa-pills', cor:'#ef6c00' },
      { id:19, nome:'Nefrologia', icone:'fa-vials', cor:'#1565c0' },
      { id:20, nome:'Pneumologia', icone:'fa-lungs-virus', cor:'#0288d1' },
      { id:8, nome:'Dermatologia', icone:'fa-person', cor:'#f06292' },
      { id:21, nome:'Urologia', icone:'fa-toilet-paper', cor:'#f9a825' },
      { id:22, nome:'Otorrinolaringologia', icone:'fa-ear-listen', cor:'#6a1b9a' },
    ],
  },
  {
    id: 2, nome: 'Hospital do Prenda', municipio: 'Maianga', tipo: 'especializado',
    morada: 'Rua Comandante Arguelles, Bairro do Prenda, Luanda', telefone: '+244 222 321 000',
    foto_url: 'img/Hospital-do-Prenda-640x280.jpg',
    descricao: 'Unidade estratégica da rede de saúde, amplamente reconhecida pelo seu centro de traumas e referência em Cirurgia Geral, Ortopedia e prestação rápida de serviços de urgência para a zona sul.',
    especialidades: [
      { id:12, nome:'Cirurgia Geral', icone:'fa-syringe', cor:'#546e7a' },
      { id:5, nome:'Ortopedia', icone:'fa-bone', cor:'#6d4c41' },
      { id:3, nome:'Clínica Geral', icone:'fa-stethoscope', cor:'#1565c0' },
      { id:4, nome:'Urgência', icone:'fa-truck-medical', cor:'#00897b' },
    ],
  },
  {
    id: 3, nome: 'Hospital Américo Boavida', municipio: 'Rangel', tipo: 'referencia',
    morada: 'Avenida Hoji Ya Henda, Rangel, Luanda', telefone: '+244 222 330 400',
    foto_url: 'img/Américo Boa VIda.webp',
    descricao: 'Importante centro hospitalar universitário que alia o atendimento médico ao ensino e investigação. A unidade encontra-se atualmente em fase de expansão e profunda modernização estrutural.',
    especialidades: [
      { id:23, nome:'Anestesiologia', icone:'fa-syringe', cor:'#455a64' },
      { id:12, nome:'Cirurgia Geral', icone:'fa-syringe', cor:'#546e7a' },
      { id:5, nome:'Ortopedia', icone:'fa-bone', cor:'#6d4c41' },
      { id:21, nome:'Urologia', icone:'fa-toilet-paper', cor:'#f9a825' },
      { id:15, nome:'Neurocirurgia', icone:'fa-microchip', cor:'#6a1b9a' },
      { id:2, nome:'Pediatria', icone:'fa-baby', cor:'#f9a825' },
      { id:24, nome:'Medicina Interna', icone:'fa-hospital-user', cor:'#283593' },
      { id:1, nome:'Cardiologia', icone:'fa-heart-pulse', cor:'#e53935' },
      { id:8, nome:'Dermatologia', icone:'fa-person', cor:'#f06292' },
      { id:18, nome:'Gastroenterologia', icone:'fa-pills', cor:'#ef6c00' },
    ],
  },
  {
    id: 4, nome: 'Hospital Geral de Luanda (HGL)', municipio: 'Kilamba Kiaxi', tipo: 'geral',
    morada: 'Zona do Camama, Luanda', telefone: '+244 222 350 000',
    foto_url: 'img/hospital-geral-luanda.jpg',
    descricao: 'Hospital geral com ampla gama de especialidades médicas e cirúrgicas.',
    especialidades: [
      { id:24, nome:'Medicina Interna', icone:'fa-hospital-user', cor:'#283593' },
      { id:2, nome:'Pediatria', icone:'fa-baby', cor:'#f9a825' },
      { id:9, nome:'Ginecologia', icone:'fa-venus', cor:'#e91e63' },
      { id:11, nome:'Maternidade', icone:'fa-baby-carriage', cor:'#ff7043' },
      { id:25, nome:'Planeamento Familiar', icone:'fa-people-group', cor:'#ad1457' },
      { id:12, nome:'Cirurgia Geral', icone:'fa-syringe', cor:'#546e7a' },
      { id:5, nome:'Ortopedia', icone:'fa-bone', cor:'#6d4c41' },
      { id:1, nome:'Cardiologia', icone:'fa-heart-pulse', cor:'#e53935' },
      { id:6, nome:'Neurologia', icone:'fa-brain', cor:'#7b1fa2' },
      { id:10, nome:'Oftalmologia', icone:'fa-eye', cor:'#00acc1' },
      { id:26, nome:'Odontologia', icone:'fa-tooth', cor:'#0097a7' },
      { id:27, nome:'Fisioterapia', icone:'fa-person-walking', cor:'#2e7d32' },
      { id:28, nome:'Psicologia', icone:'fa-brain', cor:'#9c27b0' },
    ],
  },
  {
    id: 5, nome: 'Hospital Materno Infantil Dr. Manuel Pedro Azancot de Menezes', municipio: 'Kilamba Kiaxi', tipo: 'maternidade',
    morada: 'Camama, Luanda', telefone: '+244 222 280 123',
    foto_url: 'img/Hospital Materno Infantil Dr. Manuel Pedro Azancot de Menezes.jpeg',
    descricao: 'Instituição de vanguarda desenhada para a excelência em cuidados da mulher e do recém-nascido, providenciando assistência avançada em neonatologia, ginecologia e acompanhamento pré-natal.',
    especialidades: [
      { id:29, nome:'Saúde Materno-Infantil', icone:'fa-baby-carriage', cor:'#ec407a' },
      { id:30, nome:'Neonatologia', icone:'fa-baby', cor:'#f06292' },
      { id:9, nome:'Ginecologia', icone:'fa-venus', cor:'#e91e63' },
    ],
  },
  {
    id: 6, nome: 'Complexo de Doenças Cardio-Pulmonares Cardeal Dom Alexandre do Nascimento', municipio: 'Kilamba Kiaxi', tipo: 'especializado',
    morada: 'Avenida Pedro de Castro Van-Dúnem Loy, Camama, Luanda', telefone: '+244 222 260 500',
    foto_url: 'img/Hospital de doenças cardio pulmunares.webp',
    descricao: 'Centro hospitalar de referência nacional e internacional com infraestruturas de altíssima tecnologia, especializado no diagnóstico e tratamento cirúrgico avançado de doenças cardiovasculares e pulmonares.',
    especialidades: [
      { id:1, nome:'Cardiologia', icone:'fa-heart-pulse', cor:'#e53935' },
      { id:31, nome:'Cirurgia Cardíaca', icone:'fa-heart-circle-check', cor:'#b71c1c' },
      { id:20, nome:'Pneumologia', icone:'fa-lungs-virus', cor:'#0288d1' },
    ],
  },
  {
    id: 7, nome: 'Hospital Geral dos Cajueiros', municipio: 'Cazenga', tipo: 'geral',
    morada: 'Bairro dos Cajueiros, Cazenga, Luanda', telefone: '+244 222 290 700',
    foto_url: 'img/hospital dos cajueiros.jpeg',
    descricao: 'Pilar fundamental de assistência médica no município do Cazenga, destacando-se no atendimento primário e especializado em pediatria, nutrição e serviços gerais, garantindo saúde a milhares de cidadãos.',
    especialidades: [
      { id:2, nome:'Pediatria', icone:'fa-baby', cor:'#f9a825' },
      { id:21, nome:'Urologia', icone:'fa-toilet-paper', cor:'#f9a825' },
      { id:22, nome:'Otorrinolaringologia', icone:'fa-ear-listen', cor:'#6a1b9a' },
      { id:32, nome:'Nutrição', icone:'fa-apple-whole', cor:'#689f38' },
      { id:24, nome:'Medicina Interna', icone:'fa-hospital-user', cor:'#283593' },
      { id:9, nome:'Ginecologia', icone:'fa-venus', cor:'#e91e63' },
      { id:11, nome:'Maternidade', icone:'fa-baby-carriage', cor:'#ff7043' },
      { id:33, nome:'Medicina Geral', icone:'fa-stethoscope', cor:'#1565c0' },
    ],
  },
  {
    id: 8, nome: 'Hospital Geral de Cacuaco (Heróis de Kangamba)', municipio: 'Cacuaco', tipo: 'geral',
    morada: 'Centralidade do Sequele, Cacuaco, Luanda', telefone: '+244 222 395 000',
    foto_url: 'img/hospital geral de cauaco.jpeg',
    descricao: 'Atendimento geral com reforço em especialidades e Oncologia Pediátrica.',
    especialidades: [
      { id:33, nome:'Medicina Geral', icone:'fa-stethoscope', cor:'#1565c0' },
      { id:34, nome:'Oncologia Pediátrica', icone:'fa-ribbon', cor:'#fbc02d' },
    ],
  },
  {
    id: 9, nome: 'Hospital Geral de Viana', municipio: 'Viana', tipo: 'geral',
    morada: 'Sede do Município de Viana, Luanda', telefone: '+244 222 395 000',
    foto_url: 'img/hospital geral de viana.jpeg',
    descricao: 'Complexo sanitário de suporte primário e secundário focado no atendimento às enormes demandas demográficas de Viana, garantindo serviços ágeis em medicina interna, pediatria e ortopedia.',
    especialidades: [
      { id:12, nome:'Cirurgia Geral', icone:'fa-syringe', cor:'#546e7a' },
      { id:5, nome:'Ortopedia', icone:'fa-bone', cor:'#6d4c41' },
      { id:2, nome:'Pediatria', icone:'fa-baby', cor:'#f9a825' },
      { id:24, nome:'Medicina Interna', icone:'fa-hospital-user', cor:'#283593' },
    ],
  },
  {
    id: 15, nome: 'Hospital Municipal de Viana', municipio: 'Viana', tipo: 'geral',
    morada: 'Estrada de Catete, Viana, Luanda', telefone: '+244 222 000 000',
    foto_url: 'img/Hospital Municipal de Viana.jfif',
    descricao: 'Unidade central para a resposta primária no município, focada no acolhimento rápido, urgências 24 horas e cuidados essenciais nas valências pediátricas e clínica geral, descongestionando as grandes urgências.',
    especialidades: [
      { id:33, nome:'Medicina Geral', icone:'fa-stethoscope', cor:'#1565c0' },
      { id:2, nome:'Pediatria', icone:'fa-baby', cor:'#f9a825' },
      { id:4, nome:'Urgência', icone:'fa-truck-medical', cor:'#00897b' },
    ],
  },
  {
    id: 16, nome: 'Hospital Municipal do Sambizanga', municipio: 'Sambizanga', tipo: 'geral',
    morada: 'Bairro Sambizanga, Luanda', telefone: '+244 222 000 000',
    foto_url: 'img/hospital minicipal do sambizanga.jfif',
    descricao: 'Instituição essencial na malha urbana de Luanda, altamente empenhada no acompanhamento à maternidade, urgências pediátricas e cuidados materno-infantis para toda a zona envolvente.',
    especialidades: [
      { id:33, nome:'Medicina Geral', icone:'fa-stethoscope', cor:'#1565c0' },
      { id:2, nome:'Pediatria', icone:'fa-baby', cor:'#f9a825' },
      { id:11, nome:'Maternidade', icone:'fa-baby-carriage', cor:'#ff7043' },
    ],
  },
  {
    id: 17, nome: 'Hospital Municipal do Cazenga', municipio: 'Cazenga', tipo: 'geral',
    morada: 'Bairro do Cazenga, Luanda', telefone: '+244 222 000 000',
    foto_url: 'img/hospitam municipal do cazenga.jfif',
    descricao: 'Unidade de saúde municipal dedicada ao atendimento da vasta população do município do Cazenga.',
    especialidades: [
      { id:33, nome:'Medicina Geral', icone:'fa-stethoscope', cor:'#1565c0' },
      { id:2, nome:'Pediatria', icone:'fa-baby', cor:'#f9a825' },
      { id:4, nome:'Urgência', icone:'fa-truck-medical', cor:'#00897b' },
    ],
  },
  {
    id: 19, nome: 'Hospital Psiquiátrico de Luanda', municipio: 'Luanda', tipo: 'especializado',
    morada: 'Avenida Hoji Ya Henda, Luanda', telefone: '+244 222 000 000',
    foto_url: 'img/Hospital Psiquiátrico de Luanda.jpg',
    descricao: 'A unidade central de saúde mental em Angola, dedicada ao apoio e reabilitação de utentes com transtornos do foro psicológico, através de intervenção clínica e terapias ocupacionais modernas.',
    especialidades: [
      { id:36, nome:'Psiquiatria Geral', icone:'fa-brain', cor:'#6a1b9a' },
      { id:37, nome:'Psicologia Clínica', icone:'fa-head-side-virus', cor:'#8e24aa' },
      { id:38, nome:'Toxicodependência', icone:'fa-pills', cor:'#ab47bc' },
      { id:6, nome:'Neurologia', icone:'fa-brain', cor:'#7b1fa2' },
      { id:39, nome:'Psiquiatria Infantil e Juvenil', icone:'fa-child-reaching', cor:'#9c27b0' },
      { id:40, nome:'Fisioterapia Ocupacional', icone:'fa-hands-holding-child', cor:'#7b1fa2' }
    ],
  },
  {
    id: 20, nome: 'Instituto Hematológico Pediátrico Dra. Victória Espírito Santo', municipio: 'Luanda', tipo: 'especializado',
    morada: 'Luanda', telefone: '+244 222 000 000',
    foto_url: 'img/instituto-hematologico-pediatrico.jpg',
    descricao: 'Unidade de altíssima diferenciação dedicada ao diagnóstico e tratamento intensivo de doenças hematológicas infantis, pioneira no acompanhamento de anemias falciformes e neoplasias no sangue.',
    especialidades: [
      { id:41, nome:'Anemia Falciforme', icone:'fa-droplet', cor:'#c62828' },
      { id:42, nome:'Leucemias Agudas e Crónicas', icone:'fa-vial-virus', cor:'#d32f2f' },
      { id:43, nome:'Linfomas', icone:'fa-disease', cor:'#b71c1c' },
      { id:44, nome:'Hemofilia', icone:'fa-hand-dots', cor:'#e53935' },
      { id:45, nome:'Transplante de Medula Óssea', icone:'fa-bone', cor:'#ff5252' }
    ],
  },
  {
    id: 10, nome: 'Maternidade Lucrécia Paim', municipio: 'Maianga', tipo: 'maternidade',
    morada: 'Distrito Urbano da Maianga/Ingombota, Luanda', telefone: '+244 222 321 856',
    foto_url: 'img/lucrecia paim.png',
    descricao: 'Especializada em Ginecologia e Obstetrícia de alta complexidade.',
    especialidades: [
      { id:9, nome:'Ginecologia', icone:'fa-venus', cor:'#e91e63' },
      { id:11, nome:'Maternidade', icone:'fa-baby-carriage', cor:'#ff7043' },
    ],
  },
  {
    id: 11, nome: 'Hospital Pediátrico David Bernardino', municipio: 'Maianga', tipo: 'pediatrico',
    morada: 'Maianga, Luanda', telefone: '+244 222 350 000',
    foto_url: 'img/HOSPITAL-DAVID-BERNARDINO1-696x464-1.jpg',
    descricao: 'A maior e mais importante instituição do país voltada à saúde infantil, garantindo tratamento intensivo e multidisciplinar a crianças, desde a nefrologia pediátrica até ao acompanhamento intensivo.',
    especialidades: [
      { id:2, nome:'Pediatria', icone:'fa-baby', cor:'#f9a825' },
    ],
  },
  {
    id: 12, nome: 'Instituto Oftalmológico de Angola (IONA)', municipio: 'Ingombota', tipo: 'especializado',
    morada: 'Zona da Ilha de Luanda, Luanda', telefone: '+244 222 395 000',
    foto_url: 'img/Instituto Oftalmológico de Angola.jpeg',
    descricao: 'Focado exclusivamente em Oftalmologia.',
    especialidades: [
      { id:10, nome:'Oftalmologia', icone:'fa-eye', cor:'#00acc1' },
    ],
  },
  {
    id: 13, nome: 'Hospital Militar', municipio: 'Maianga', tipo: 'especializado',
    morada: 'Luanda', telefone: '+244 222 000 000',
    foto_url: 'img/hospital militar.webp',
    descricao: 'Hospital militar de referência em Luanda.',
    especialidades: [
      { id:12, nome:'Cirurgia Geral', icone:'fa-syringe', cor:'#546e7a' },
      { id:4, nome:'Urgência', icone:'fa-truck-medical', cor:'#00897b' },
      { id:24, nome:'Medicina Interna', icone:'fa-hospital-user', cor:'#283593' },
    ],
  },
  {
    id: 14, nome: 'Hospital Neves Bendinha', municipio: 'Kilamba Kiaxi', tipo: 'geral',
    morada: 'Estrada do Golfe, Luanda', telefone: '+244 222 000 000',
    foto_url: 'img/hospita neves bendinha.webp',
    descricao: 'Hospital especializado em tratamento de queimados e cuidados gerais.',
    especialidades: [
      { id:12, nome:'Cirurgia Geral', icone:'fa-syringe', cor:'#546e7a' },
      { id:4, nome:'Urgência', icone:'fa-truck-medical', cor:'#00897b' },
      { id:8, nome:'Dermatologia', icone:'fa-person', cor:'#f06292' },
    ],
  },
];


let todosHospitais = [];

async function carregarFiltroEspecialidades() {
  try {
    const lista = await apiGet('/especialidades');
    const sel   = document.getElementById('filtroEspecialidade');
    if (!sel) return;
    lista.forEach(e => {
      sel.innerHTML += `<option value="${e.nome}">${e.nome}</option>`;
    });
  } catch { /* mantém opções estáticas */ }
}

function renderHospitais(hospitais) {
  const grid = document.getElementById('hospitaisGrid');
  const info = document.getElementById('hospitaisInfo');
  if (!grid) return;

  if (!hospitais.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px;color:#718096">
        <i class="fa-solid fa-hospital-slash" style="font-size:2.5rem;opacity:0.4"></i>
        <p style="margin-top:12px">Nenhum hospital encontrado com esses filtros.</p>
        <button class="btn-outline sm" style="margin-top:16px" onclick="limparFiltros()">Limpar filtros</button>
      </div>`;
    if (info) info.textContent = '';
    return;
  }
  if (info) info.textContent = \`\${hospitais.length} hospital\${hospitais.length > 1 ? 'is' : ''} encontrado\${hospitais.length > 1 ? 's' : ''}\`;

  grid.innerHTML = hospitais.map(h => {
    const tipoInfo = TIPO_LABEL[h.tipo] || { label: h.tipo, cor: '#1565c0' };
    const espTags  = (h.especialidades || []).slice(0, 2).map(e =>
      \`<span class="esp-tag" style="--esp-cor:\${e.cor}">
        <i class="fa-solid \${e.icone}"></i> \${e.nome}
      </span>\`
    ).join('');
    
    let maisEsp = '';
    if (h.especialidades?.length > 2) {
      const remaining = h.especialidades.slice(2).map(e => 
        \`<div class="popover-esp-item" style="--esp-cor:\${e.cor}">
           <i class="fa-solid \${e.icone}"></i> <span>\${e.nome}</span>
         </div>\`
      ).join('');
      
      maisEsp = \`
        <div class="esp-popover-wrapper" onclick="event.stopPropagation(); togglePopover(this)">
          <span class="esp-tag-more">+\${h.especialidades.length - 2} mais</span>
          <div class="esp-popover">
            <div class="esp-popover-list">\${remaining}</div>
          </div>
        </div>
      \`;
    }

    // Simulador de rating e disponibilidade (Demo visual)
    const rating = h.id % 2 === 0 ? '4.8' : '4.5';
    const numRevs = (h.id * 14) + 42;
    const isAvail = h.id !== 2; // ex: Josina Machel might be full

    return \`
      <div class="hospital-card" data-id="\${h.id}" onclick="abrirModal(\${h.id})">
        <div class="hospital-card-img">
          <img src="\${h.foto_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&q=80'}"
               alt="\${h.nome}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&q=80'"/>
          <span class="hospital-tipo-badge" style="background:\${tipoInfo.cor}E6;color:#fff;">
            \${tipoInfo.label}
          </span>
          <div class="hospital-rating">
            <i class="fa-solid fa-star"></i> \${rating} <span>(\${numRevs})</span>
          </div>
        </div>
        <div class="hospital-card-body">
          <div class="hospital-header-info">
            <h3>\${h.nome}</h3>
            \${isAvail 
              ? \`<span class="avail-badge"><i class="fa-solid fa-bolt"></i> Disp. hoje</span>\` 
              : \`<span class="unavail-badge"><i class="fa-solid fa-clock"></i> Fila longa</span>\`}
          </div>
          <p class="hospital-municipio"><i class="fa-solid fa-location-dot"></i> \${h.municipio}, Luanda</p>
          <p class="hospital-desc">\${(h.descricao || '').substring(0, 160)}\${(h.descricao || '').length > 160 ? '...' : ''}</p>
          <div class="hospital-especialidades">\${espTags}\${maisEsp}</div>
          <div class="hospital-card-actions">
            <button class="btn-primary sm" onclick="event.stopPropagation();marcarNoHospital(\${h.id},'\${h.nome.replace(/'/g,"'")}')">
              Marcar Consulta <i class="fa-solid fa-arrow-right"></i>
            </button>
            <button class="btn-outline sm" onclick="event.stopPropagation();abrirModal(\${h.id})">
              Ver detalhes
            </button>
          </div>
        </div>
      </div>\`;
  }).join('');

  // Animar cards via IntersectionObserver
  setTimeout(() => {
    document.querySelectorAll('.hospital-card').forEach((c) => {
      if (window.observer) window.observer.observe(c);
    });
  }, 100);
}

async function abrirModal(id) {
  const modal   = document.getElementById('hospitalModal');
  const content = document.getElementById('modalContent');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Encontrar nos dados locais primeiro
  const local = todosHospitais.find(h => h.id == id);

  content.innerHTML = \`<div style="text-align:center;padding:40px;color:#718096">
    <i class="fa-solid fa-circle-notch fa-spin" style="font-size:1.5rem;color:#1565c0"></i></div>\`;

  let h = local;
  try {
    h = await apiGet(\`/hospitais/\${id}\`);
  } catch { /* usa dados locais */ }

  if (!h) { content.innerHTML = \`<p style="padding:24px;color:#dc2626">Hospital não encontrado.</p>\`; return; }

  const tipoInfo = TIPO_LABEL[h.tipo] || { label: h.tipo, cor: '#1565c0' };
  content.innerHTML = \`
    <div class="modal-hospital-img">
      <img src="\${h.foto_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80'}" alt="\${h.nome}"
           onerror="this.src='https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80'"/>
    </div>
    <div class="modal-hospital-body">
      <h2>\${h.nome}</h2>
      <p class="hospital-municipio" style="margin-bottom:12px"><i class="fa-solid fa-location-dot"></i> \${h.municipio}, Luanda</p>
      <p style="color:#4B5563;line-height:1.7;margin-bottom:20px">\${h.descricao || ''}</p>
      \${h.morada ? \`<div class="modal-info-row"><i class="fa-solid fa-map"></i><span>\${h.morada}</span></div>\` : ''}
      \${h.telefone ? \`<div class="modal-info-row"><i class="fa-solid fa-phone"></i><a href="tel:\${h.telefone}">\${h.telefone}</a></div>\` : ''}
      <h4 style="margin:20px 0 10px;font-size:1.1rem;color:#1F2937">Especialidades disponíveis</h4>
      <div class="hospital-especialidades" style="gap:8px">
        \${(h.especialidades || []).map(e => \`
          <span class="esp-tag" style="--esp-cor:\${e.cor};cursor:pointer"
                onclick="fecharModal();marcarNoHospital(\${h.id},'\${h.nome.replace(/'/g,"'")}',\${e.id},'\${e.nome.replace(/'/g,"'")}')">
            <i class="fa-solid \${e.icone}"></i> \${e.nome}
          </span>\`).join('')}
      </div>
      <div style="margin-top:32px;display:flex;gap:16px;flex-wrap:wrap">
        <button class="btn-primary" style="flex:2" onclick="fecharModal();marcarNoHospital(\${h.id},'\${h.nome.replace(/'/g,"'")}')">
          Disponível Hoje — Marcar <i class="fa-solid fa-arrow-right"></i>
        </button>
        \${h.telefone ? \`<a href="tel:\${h.telefone}" class="btn-outline" style="flex:1;text-align:center;"><i class="fa-solid fa-phone"></i> Ligar</a>\` : ''}
      </div>
    </div>\`;
}

function fecharModal() {
  const modal = document.getElementById('hospitalModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

window.togglePopover = function(wrapper) {
  document.querySelectorAll('.esp-popover-wrapper.active').forEach(p => {
    if (p !== wrapper) p.classList.remove('active');
  });
  wrapper.classList.toggle('active');
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.esp-popover-wrapper')) {
    document.querySelectorAll('.esp-popover-wrapper.active').forEach(p => p.classList.remove('active'));
  }
});

function marcarNoHospital(hospitalId, hospitalNome, espId, espNome) {
  const params = new URLSearchParams({ hospital_id: hospitalId, hospital_nome: hospitalNome });
  if (espId)   params.set('especialidade_id',   espId);
  if (espNome) params.set('especialidade_nome', espNome);
  window.location.href = \`marcacao.html?\${params.toString()}\`;
}


function aplicarFiltros() {
  const municipio     = document.getElementById('filtroMunicipio')?.value;
  const textoNome     = document.getElementById('filtroNome')?.value.toLowerCase();
  const especialidade = document.getElementById('filtroEspecialidade')?.value;

  let filtrados = todosHospitais;
  
  if (textoNome) {
    filtrados = filtrados.filter(h => h.nome.toLowerCase().includes(textoNome) || (h.descricao && h.descricao.toLowerCase().includes(textoNome)));
  }
  if (municipio) {
    filtrados = filtrados.filter(h => h.municipio === municipio);
  }
  if (especialidade) {
    filtrados = filtrados.filter(h =>
      (h.especialidades || []).some(e => e.nome === especialidade)
    );
  }
  renderHospitais(filtrados);
}

function limparFiltros() {
  const ids = ['filtroNome', 'filtroMunicipio', 'filtroEspecialidade'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderHospitais(todosHospitais);
}

(async function init() {
  await carregarFiltroEspecialidades();

  try {
    todosHospitais = await apiGet('/hospitais');
  } catch {
    // Backend não disponível — usar dados locais
    todosHospitais = HOSPITAIS_FALLBACK;
    console.info('Backend não disponível — a usar dados locais de hospitais.');
  }

  renderHospitais(todosHospitais);

  // Filtro por URL ?especialidade=Cardiologia
  const urlEsp = new URLSearchParams(window.location.search).get('especialidade');
  if (urlEsp) {
    const sel = document.getElementById('filtroEspecialidade');
    if (sel) sel.value = urlEsp;
    aplicarFiltros();
  }

  // Binds
  document.getElementById('btnFiltrar')?.addEventListener('click', aplicarFiltros);
  document.getElementById('btnLimpar')?.addEventListener('click', limparFiltros);
  document.getElementById('filtroNome')?.addEventListener('input', aplicarFiltros);
  
  document.getElementById('modalClose')?.addEventListener('click', fecharModal);
  document.getElementById('hospitalModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('hospitalModal')) fecharModal();
  });
})();