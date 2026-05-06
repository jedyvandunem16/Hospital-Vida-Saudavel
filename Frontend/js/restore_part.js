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
            <button class="btn-primary sm" onclick="event.stopPropagation();marcarNoHospital(\${h.id},'\${h.nome.replace(/'/g,"\\\\'")}')">
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
                onclick="fecharModal();marcarNoHospital(\${h.id},'\${h.nome.replace(/'/g,"\\\\'")}',\${e.id},'\${e.nome.replace(/'/g,"\\\\'")}')">
            <i class="fa-solid \${e.icone}"></i> \${e.nome}
          </span>\`).join('')}
      </div>
      <div style="margin-top:32px;display:flex;gap:16px;flex-wrap:wrap">
        <button class="btn-primary" style="flex:2" onclick="fecharModal();marcarNoHospital(\${h.id},'\${h.nome.replace(/'/g,"\\\\'")}')">
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
