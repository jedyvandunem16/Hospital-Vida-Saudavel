/**
 * api.js — Integração com o Backend
 * Hospital Vida Saudável
 *
 * Incluir nas páginas que precisam de comunicar com a API:
 * <script src="api.js"></script>
 */

const API_URL = 'http://localhost:3000/api'; // Mudar para URL de produção

// ── Utilitários ───────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('hvs_token');
}

function setToken(token) {
  localStorage.setItem('hvs_token', token);
}

function removeToken() {
  localStorage.removeItem('hvs_token');
  localStorage.removeItem('hvs_user');
}

async function apiRequest(method, endpoint, body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (!token) { window.location.href = 'login.html'; return; }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, opts);
  const data = await res.json();

  if (!res.ok) throw new Error(data.erro || 'Erro na API');
  return data;
}

// ── API Pública ───────────────────────────────────────────────────────────────

const API = {
  // Especialidades
  getEspecialidades: () => apiRequest('GET', '/especialidades'),

  // Médicos
  getMedicos: (especialidade = '') =>
    apiRequest('GET', `/medicos${especialidade ? `?especialidade=${especialidade}` : ''}`),
  getMedico: (id) => apiRequest('GET', `/medicos/${id}`),
  getDisponibilidade: (medicoId, data) =>
    apiRequest('GET', `/medicos/${medicoId}/disponibilidade?data=${data}`),

  // Marcação (público)
  marcarConsulta: (dados) => apiRequest('POST', '/consultas', dados),

  // Contacto (público)
  enviarMensagem: (dados) => apiRequest('POST', '/mensagens', dados),

  // Auth
  login: (email, password) => apiRequest('POST', '/auth/login', { email, password }),
  getMe: () => apiRequest('GET', '/auth/me', null, true),

  // Admin (autenticado)
  getDashboard: () => apiRequest('GET', '/consultas/dashboard', null, true),
  getConsultas: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest('GET', `/consultas${q ? '?' + q : ''}`, null, true);
  },
  atualizarEstadoConsulta: (id, estado, notas) =>
    apiRequest('PATCH', `/consultas/${id}/estado`, { estado, notas_medico: notas }, true),
  getPacientes: (q = '') =>
    apiRequest('GET', `/pacientes${q ? `?q=${q}` : ''}`, null, true),
  getMensagens: () => apiRequest('GET', '/mensagens', null, true),
};

// ── Integração: Formulário de Marcação ───────────────────────────────────────

async function iniciarFormularioMarcacao() {
  // Carregar especialidades dinamicamente
  const specGrid = document.querySelector('.specialty-grid');
  if (specGrid) {
    try {
      const especialidades = await API.getEspecialidades();
      const icons = {
        'Cardiologia': { icon: 'fa-heart-pulse', color: '#e53935' },
        'Pediatria':   { icon: 'fa-baby',        color: '#f9a825' },
        'Clínica Geral':{ icon:'fa-stethoscope', color: '#1565c0' },
        'Urgência':    { icon: 'fa-truck-medical',color: '#00897b' },
        'Ortopedia':   { icon: 'fa-bone',         color: '#6d4c41' },
        'Neurologia':  { icon: 'fa-brain',         color: '#7b1fa2' },
        'Laboratório': { icon: 'fa-flask',          color: '#0277bd' },
        'Dermatologia':{ icon: 'fa-person',         color: '#f06292' },
      };
      specGrid.innerHTML = especialidades.map(e => {
        const ic = icons[e.nome] || { icon: 'fa-stethoscope', color: '#1565c0' };
        return `
          <button class="spec-btn" data-spec="${e.nome}" data-spec-id="${e.id}">
            <span style="color:${ic.color}"><i class="fa-solid ${ic.icon}"></i></span>
            <span>${e.nome}</span>
          </button>`;
      }).join('');
      // Re-bind events
      document.querySelectorAll('.spec-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.spec-btn').forEach(b => b.classList.remove('selected'));
          this.classList.add('selected');
          window._selectedSpec = { nome: this.dataset.spec, id: this.dataset.specId };
          document.getElementById('sum-spec').textContent = this.dataset.spec;
          document.getElementById('step1Next').disabled = false;
        });
      });
    } catch (e) { console.warn('Especialidades da API não disponíveis, usando estáticas'); }
  }

  // Carregar médicos quando data é escolhida
  const dataInput = document.getElementById('dataConsulta');
  const medicoSelect = document.getElementById('medicoSelect');

  if (dataInput && medicoSelect) {
    dataInput.addEventListener('change', async function() {
      if (!window._selectedSpec) return;
      try {
        const medicos = await API.getMedicos(window._selectedSpec.nome);
        medicoSelect.innerHTML = '<option value="">Sem preferência (primeiro disponível)</option>';
        medicos.forEach(m => {
          medicoSelect.innerHTML += `<option value="${m.id}">${m.titulo} ${m.nome} — ${m.especialidade}</option>`;
        });
      } catch (e) { /* manter estático */ }

      // Carregar slots se médico já escolhido
      const medicoId = medicoSelect.value;
      if (medicoId) await carregarSlots(medicoId, this.value);
    });

    medicoSelect.addEventListener('change', async function() {
      if (dataInput.value && this.value) {
        await carregarSlots(this.value, dataInput.value);
      }
    });
  }
}

async function carregarSlots(medicoId, data) {
  const container = document.getElementById('timeslots');
  if (!container) return;
  try {
    const res = await API.getDisponibilidade(medicoId, data);
    if (!res.horarios.length) {
      container.innerHTML = '<p style="color:#718096;font-size:0.88rem;">Sem disponibilidade neste dia.</p>';
      return;
    }
    container.innerHTML = res.horarios.map(s => `
      <button class="timeslot ${!s.disponivel ? 'unavailable' : ''}"
              ${!s.disponivel ? 'disabled' : ''}
              data-time="${s.hora}">${s.hora}</button>
    `).join('');

    // Re-bind slot click
    container.querySelectorAll('.timeslot:not(.unavailable)').forEach(btn => {
      btn.addEventListener('click', function() {
        container.querySelectorAll('.timeslot').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        window._selectedTime = this.dataset.time;
        document.getElementById('sum-time').textContent = this.dataset.time;
        document.getElementById('step2Next').disabled = false;
      });
    });
  } catch (e) { console.warn('Slots da API não disponíveis'); }
}

// Submissão final ao backend
async function submeterMarcacao(dadosPessoais) {
  const medicoSelect = document.getElementById('medicoSelect');
  const dataInput    = document.getElementById('dataConsulta');

  const medicoId = medicoSelect?.value || null;
  const data     = dataInput?.value;
  const hora     = window._selectedTime;
  const spec     = window._selectedSpec;

  if (!data || !hora || !spec) throw new Error('Dados da consulta incompletos.');

  const dataHora = `${data}T${hora}:00`;

  return await API.marcarConsulta({
    paciente_nome:        dadosPessoais.nome,
    paciente_email:       dadosPessoais.email,
    paciente_telefone:    dadosPessoais.telefone,
    paciente_nascimento:  dadosPessoais.nascimento,
    paciente_bi:          dadosPessoais.bi,
    medico_id:            medicoId ? parseInt(medicoId) : 1,
    especialidade_id:     parseInt(spec.id),
    data_hora:            dataHora,
    tipo:                 'presencial',
    motivo:               dadosPessoais.notas,
  });
}

// Integração: Formulário de Contacto
async function submeterContacto(dados) {
  return await API.enviarMensagem(dados);
}

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.specialty-grid')) {
    iniciarFormularioMarcacao();
  }
});
