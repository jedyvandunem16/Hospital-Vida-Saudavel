/**
 * js/consultas.js — Gestão de Consultas do Paciente
 * Hospital Vida Saudável
 */

const STATUS_LABELS = {
  pendente:   { label: 'Pendente',   bg: '#fff3e0', color: '#e65100' },
  confirmada: { label: 'Confirmada', bg: '#e8f5e9', color: '#2e7d32' },
  concluida:  { label: 'Concluída',  bg: '#e3f2fd', color: '#1565c0' },
  cancelada:  { label: 'Cancelada',  bg: '#fce4ec', color: '#c62828' },
  falta:      { label: 'Falta',      bg: '#f3e5f5', color: '#6a1b9a' },
};

let todasConsultas = [];

function renderConsultas(lista) {
  const cont      = document.getElementById('consultasList');
  const noRes     = document.getElementById('noConsultas');
  if (!lista.length) { cont.innerHTML = ''; noRes.classList.remove('hidden'); return; }
  noRes.classList.add('hidden');

  cont.innerHTML = lista.map(c => {
    const st   = STATUS_LABELS[c.estado] || { label: c.estado, bg: '#f1f5f9', color: '#4a5568' };
    const data = new Date(c.data_hora);
    const dataStr = data.toLocaleDateString('pt-AO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    const horaStr = data.toLocaleTimeString('pt-AO', { hour:'2-digit', minute:'2-digit' });
    const isPast  = data < new Date();

    return `
      <div class="consulta-card" style="border-left:4px solid ${st.color}">
        <div class="consulta-card-header">
          <div>
            <strong class="consulta-id">#${c.id}</strong>
            <span class="status-badge" style="background:${st.bg};color:${st.color};margin-left:10px">${st.label}</span>
          </div>
          ${!isPast && c.estado === 'pendente' ? `
          <button class="btn-outline sm cancelar-btn" data-id="${c.id}" type="button" style="color:#e53935;border-color:#e53935">
            <i class="fa-solid fa-xmark"></i> Cancelar
          </button>` : ''}
        </div>
        <div class="consulta-card-body">
          <div class="cinfo"><i class="fa-solid fa-stethoscope"></i><span>${c.especialidade}</span></div>
          <div class="cinfo"><i class="fa-solid fa-user-doctor"></i><span>${c.medico_nome}</span></div>
          <div class="cinfo"><i class="fa-solid fa-calendar"></i><span>${dataStr}</span></div>
          <div class="cinfo"><i class="fa-solid fa-clock"></i><span>${horaStr}</span></div>
        </div>
        <div class="consulta-card-actions">
          <button class="btn-outline sm" onclick="window.print()" type="button">
            <i class="fa-solid fa-print"></i> Imprimir
          </button>
          <a href="marcacao.html" class="btn-primary sm">
            <i class="fa-solid fa-calendar-plus"></i> Nova marcação
          </a>
        </div>
      </div>`;
  }).join('');

  // Bind cancelar buttons
  document.querySelectorAll('.cancelar-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      if (!confirm('Tem a certeza que quer cancelar esta consulta?')) return;
      const id = this.dataset.id;
      try {
        await fetch(`${API_URL}/consultas/${id}`, { method: 'DELETE' });
        showToast('Consulta cancelada com sucesso.', 'success');
        // Update local state
        todasConsultas = todasConsultas.map(c =>
          c.id == id ? { ...c, estado: 'cancelada' } : c
        );
        filtrarEstado(document.querySelector('.filter-btn.active')?.dataset.estado || 'todos');
      } catch {
        showToast('Erro ao cancelar consulta.', 'error');
      }
    });
  });
}

function filtrarEstado(estado) {
  const lista = estado === 'todos'
    ? todasConsultas
    : todasConsultas.filter(c => c.estado === estado);
  renderConsultas(lista);
}

// Pesquisa por telefone
document.getElementById('btnSearch')?.addEventListener('click', async () => {
  const tel = document.getElementById('searchTel').value.trim();
  if (!tel) {
    document.getElementById('telErr').textContent = 'Introduza o número de telefone.';
    return;
  }
  document.getElementById('telErr').textContent = '';
  document.getElementById('searchBtnText').classList.add('hidden');
  document.getElementById('searchBtnLoad').classList.remove('hidden');
  document.getElementById('searchError').classList.add('hidden');

  try {
    // Find paciente by telefone then fetch consultas
    const pacientes = await apiGet(`/pacientes?telefone=${encodeURIComponent(tel)}`);
    if (!pacientes.length) {
      throw new Error('Nenhuma consulta encontrada com este número de telefone.');
    }
    const paciente = pacientes[0];
    todasConsultas = await apiGet(`/consultas?paciente_id=${paciente.id}`);

    document.getElementById('searchPanel').classList.add('hidden');
    document.getElementById('resultsPanel').classList.remove('hidden');
    filtrarEstado('todos');
    showToast(`${todasConsultas.length} consulta(s) encontrada(s)`, 'success');

  } catch (err) {
    document.getElementById('searchErrorMsg').textContent = err.message;
    document.getElementById('searchError').classList.remove('hidden');
  } finally {
    document.getElementById('searchBtnText').classList.remove('hidden');
    document.getElementById('searchBtnLoad').classList.add('hidden');
  }
});

// Enter key on telefone input
document.getElementById('searchTel')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btnSearch').click();
});

// Nova pesquisa
document.getElementById('btnNovaSearch')?.addEventListener('click', () => {
  document.getElementById('resultsPanel').classList.add('hidden');
  document.getElementById('searchPanel').classList.remove('hidden');
  document.getElementById('searchTel').value = '';
  todasConsultas = [];
});

// Filtro de estado
document.querySelectorAll('#estadoFilter .filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#estadoFilter .filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    filtrarEstado(this.dataset.estado);
  });
});
