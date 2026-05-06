/**
 * api.js — Ligação Frontend ↔ Backend
 * Hospital Vida Saudável — Luanda, Angola
 */
/**
 * api.js — Ligação Frontend ↔ Backend
 * Hospital Vida Saudável — Luanda, Angola
 */

// [MÉDIA 3] URL única definida em config.js — sem hardcode aqui
const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
  ? CONFIG.API_URL
  : 'http://localhost:3000/api'; // fallback apenas para dev

// ─── Ícones por especialidade ────────────────────────────────────────────────
const SPEC_ICONS = {
  'Cardiologia':    { icon: 'fa-heart-pulse',   color: '#e53935' },
  'Pediatria':      { icon: 'fa-baby',           color: '#f9a825' },
  'Clínica Geral':  { icon: 'fa-stethoscope',   color: '#1565c0' },
  'Urgência':       { icon: 'fa-truck-medical',  color: '#00897b' },
  'Ortopedia':      { icon: 'fa-bone',           color: '#6d4c41' },
  'Neurologia':     { icon: 'fa-brain',          color: '#7b1fa2' },
  'Laboratório':    { icon: 'fa-flask',          color: '#0277bd' },
  'Dermatologia':   { icon: 'fa-person',         color: '#f06292' },
  'Ginecologia':    { icon: 'fa-venus',          color: '#e91e63' },
  'Oftalmologia':   { icon: 'fa-eye',            color: '#00acc1' },
  'Maternidade':    { icon: 'fa-baby-carriage',  color: '#ff7043' },
  'Cirurgia Geral': { icon: 'fa-scalpel',        color: '#546e7a' },
};

// ─── Toast Notifications ─────────────────────────────────────────────────────
function showToast(msg, tipo = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.style.cssText = `background:${tipo==='success'?'#1565c0':'#dc2626'};color:#fff;padding:14px 20px;border-radius:10px;font-size:0.9rem;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.2);max-width:320px;animation:toastIn 0.3s ease;`;
  toast.innerHTML = `<i class="fa-solid ${tipo==='success'?'fa-circle-check':'fa-circle-exclamation'}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.4s'; setTimeout(()=>toast.remove(),400); }, 4000);
}

// ─── Helpers HTTP ────────────────────────────────────────────────────────────
async function apiGet(endpoint) {
  const res  = await fetch(`${API_URL}${endpoint}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro na API');
  return data;
}

async function apiPost(endpoint, body) {
  const res  = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro na API');
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
//  MARCAÇÃO DE CONSULTAS (marcacao.html)
// ═══════════════════════════════════════════════════════════════════════════
if (document.getElementById('specialtyGrid')) {

  const urlParams       = new URLSearchParams(window.location.search);
  const preHospitalId   = urlParams.get('hospital_id');
  const preHospitalNome = urlParams.get('hospital_nome');
  const preEspId        = urlParams.get('especialidade_id');
  const preEspNome      = urlParams.get('especialidade_nome');

  const sel = {
    hospitalId: preHospitalId || null, hospitalNome: preHospitalNome || null,
    specNome: preEspNome || null, specId: preEspId || null,
    medicoId: null, medicoNome: null, date: null, time: null,
  };

  // Banner de hospital pré-selecionado
  if (preHospitalNome) {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:linear-gradient(135deg,#e3f2fd,#bbdefb);border:1px solid #90caf9;border-radius:12px;padding:14px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px;font-size:0.9rem;';
    banner.innerHTML = `<i class="fa-solid fa-hospital" style="color:#1565c0;font-size:1.3rem"></i><div><strong style="color:#1565c0">Hospital:</strong><span style="color:#1e3a5f;margin-left:6px">${preHospitalNome}</span></div><a href="hospitais.html" style="margin-left:auto;font-size:0.8rem;color:#1565c0;text-decoration:none"><i class="fa-solid fa-arrow-left"></i> Alterar hospital</a>`;
    document.getElementById('step1')?.prepend(banner);
    const sumCard = document.querySelector('.booking-summary-card');
    if (sumCard) {
      const row = document.createElement('div');
      row.className = 'summary-row';
      row.innerHTML = `<span>Hospital:</span><strong>${preHospitalNome}</strong>`;
      sumCard.insertBefore(row, sumCard.querySelector('.summary-row'));
    }
  }

  function goToStep(n) {
    document.querySelectorAll('.form-step').forEach((s, i) => s.classList.toggle('active', i+1===n));
    document.querySelectorAll('.step').forEach((s, i) => { s.classList.toggle('active',i+1===n); s.classList.toggle('done',i+1<n); });
    window.scrollTo({ top: document.querySelector('.booking-section').offsetTop - 80, behavior: 'smooth' });
  }

  async function carregarEspecialidades() {
    const grid = document.getElementById('specialtyGrid');
    try {
      const endpoint = preHospitalId
        ? `/hospitais/${preHospitalId}/especialidades`
        : '/especialidades';
      const list = await apiGet(endpoint);
      if (!list.length) { grid.innerHTML = '<p style="color:#718096">Nenhuma especialidade disponível.</p>'; return; }
      grid.innerHTML = list.map(e => {
        const ic = SPEC_ICONS[e.nome] || { icon: 'fa-stethoscope', color: '#1565c0' };
        return `<button class="spec-btn" type="button" data-spec-nome="${e.nome}" data-spec-id="${e.id}"><span style="color:${ic.color}"><i class="fa-solid ${ic.icon}"></i></span><span>${e.nome}</span></button>`;
      }).join('');
      document.querySelectorAll('.spec-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.spec-btn').forEach(b => b.classList.remove('selected'));
          this.classList.add('selected');
          sel.specNome = this.dataset.specNome; sel.specId = this.dataset.specId;
          document.getElementById('sum-spec').textContent = sel.specNome;
          document.getElementById('step1Next').disabled = false;
        });
      });
      if (preEspNome) {
        document.querySelectorAll('.spec-btn').forEach(btn => { if (btn.dataset.specNome === preEspNome) btn.click(); });
      } else {
        const svc = urlParams.get('servico');
        if (svc) document.querySelectorAll('.spec-btn').forEach(btn => { if (btn.dataset.specNome.toLowerCase()===svc.toLowerCase()) btn.click(); });
      }
    } catch(err) {
      grid.innerHTML = `<div style="grid-column:1/-1;padding:20px;text-align:center;color:#e53935;font-size:0.88rem"><i class="fa-solid fa-circle-exclamation"></i> Erro ao carregar especialidades. Verifique se o servidor está a correr em <strong>localhost:3000</strong>.</div>`;
    }
  }

  document.getElementById('step1Next').addEventListener('click', async () => { goToStep(2); await carregarMedicos(); });

  async function carregarMedicos() {
    const selEl = document.getElementById('medicoSelect');
    selEl.innerHTML = '<option value="">A carregar médicos...</option>';
    try {
      const endpoint = (preHospitalId && sel.specId)
        ? `/hospitais/${preHospitalId}/medicos?especialidade_id=${sel.specId}`
        : `/medicos?especialidade=${encodeURIComponent(sel.specNome)}`;
      const medicos = await apiGet(endpoint);
      selEl.innerHTML = '<option value="">Sem preferência (primeiro disponível)</option>';
      medicos.forEach(m => { selEl.innerHTML += `<option value="${m.id}">${m.titulo} ${m.nome}</option>`; });
    } catch { selEl.innerHTML = '<option value="">Sem preferência</option>'; }
  }

  document.getElementById('medicoSelect').addEventListener('change', function () {
    const data = document.getElementById('dataConsulta').value;
    if (data && this.value) carregarSlots(this.value, data);
  });

  document.getElementById('dataConsulta').addEventListener('change', async function () {
    const today = new Date(); today.setHours(0,0,0,0);
    const pick  = new Date(this.value + 'T00:00:00');
    if (pick <= today) { document.getElementById('dataErr').textContent='Escolha uma data futura.'; this.classList.add('error'); sel.date=null; sel.time=null; checkStep2(); return; }
    document.getElementById('dataErr').textContent = ''; this.classList.remove('error');
    sel.date = this.value; sel.time = null;
    document.getElementById('sum-time').textContent = '—';
    document.getElementById('sum-date').textContent = pick.toLocaleDateString('pt-AO',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    checkStep2();
    const medicoId = document.getElementById('medicoSelect').value;
    if (medicoId) await carregarSlots(medicoId, this.value); else mostrarSlotsPadrao();
  });

  async function carregarSlots(medicoId, data) {
    const container = document.getElementById('timeslots');
    container.innerHTML = `<div style="padding:12px 0;color:#718096;font-size:0.86rem"><i class="fa-solid fa-circle-notch fa-spin"></i> A verificar disponibilidade...</div>`;
    try {
      const res = await apiGet(`/medicos/${medicoId}/disponibilidade?data=${data}`);
      if (!res.horarios?.length) { container.innerHTML=`<p style="font-size:0.86rem;color:#718096;padding:8px 0"><i class="fa-solid fa-calendar-xmark"></i> Sem disponibilidade neste dia.</p>`; return; }
      renderSlots(res.horarios, document.querySelector('.period-btn.active')?.dataset.period || 'manha');
    } catch { mostrarSlotsPadrao(); }
  }

  function renderSlots(horarios, periodo) {
    const container = document.getElementById('timeslots');
    const f = horarios.filter(h => { const hr = parseInt(h.hora.split(':')[0]); return periodo==='manha'?hr<13:hr>=13; });
    if (!f.length) { container.innerHTML=`<p style="font-size:0.86rem;color:#718096">Sem horários neste período.</p>`; return; }
    container.innerHTML = f.map(h=>`<button class="timeslot ${!h.disponivel?'unavailable':''}" type="button" ${!h.disponivel?'disabled':''} data-time="${h.hora}">${h.hora}</button>`).join('');
    bindSlots(container);
  }

  function mostrarSlotsPadrao() {
    const container = document.getElementById('timeslots');
    const slots = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
    container.innerHTML = slots.map(h=>`<button class="timeslot" type="button" data-time="${h}">${h}</button>`).join('');
    bindSlots(container);
  }

  function bindSlots(container) {
    container.querySelectorAll('.timeslot:not(.unavailable)').forEach(btn => {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.timeslot').forEach(b=>b.classList.remove('selected'));
        this.classList.add('selected'); sel.time=this.dataset.time;
        document.getElementById('sum-time').textContent=sel.time; checkStep2();
      });
    });
  }

  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');
      const mid=document.getElementById('medicoSelect').value; const dt=document.getElementById('dataConsulta').value;
      if (mid && dt) carregarSlots(mid,dt);
    });
  });

  function checkStep2() { document.getElementById('step2Next').disabled=!(sel.date&&sel.time); }

  document.getElementById('step2Back').addEventListener('click',()=>goToStep(1));
  document.getElementById('step2Next').addEventListener('click',()=>{
    const selEl=document.getElementById('medicoSelect');
    sel.medicoId=selEl.value||null; sel.medicoNome=selEl.value?selEl.options[selEl.selectedIndex].text:'Primeiro disponível';
    document.getElementById('sum-doc').textContent=sel.medicoNome; goToStep(3);
  });

  document.getElementById('step3Back').addEventListener('click',()=>goToStep(2));
  document.getElementById('step3Next').addEventListener('click', async ()=>{
    const nome=document.getElementById('pNome').value.trim();
    const tel=document.getElementById('pTel').value.trim();
    const email=document.getElementById('pEmail').value.trim();
    let valid=true;
    if (!nome){document.getElementById('pNomeErr').textContent='Insira o nome.';document.getElementById('pNome').classList.add('error');valid=false;}
    else{document.getElementById('pNomeErr').textContent='';document.getElementById('pNome').classList.remove('error');}
    if (!tel){document.getElementById('pTelErr').textContent='Insira o telefone.';document.getElementById('pTel').classList.add('error');valid=false;}
    else{document.getElementById('pTelErr').textContent='';document.getElementById('pTel').classList.remove('error');}
    if (email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){document.getElementById('pEmailErr').textContent='Email inválido.';document.getElementById('pEmail').classList.add('error');valid=false;}
    else{document.getElementById('pEmailErr').textContent='';document.getElementById('pEmail').classList.remove('error');}
    if (!document.getElementById('bookPriv').checked){document.getElementById('bookPrivErr').textContent='Deve aceitar a política de privacidade.';valid=false;}
    else{document.getElementById('bookPrivErr').textContent='';}
    if (!valid) return;

    document.getElementById('step3BtnText').classList.add('hidden');
    document.getElementById('step3BtnLoad').classList.remove('hidden');
    document.getElementById('step3Next').disabled=true;
    document.getElementById('submitError').classList.add('hidden');

    try {
      const resultado=await apiPost('/consultas',{
        paciente_nome:nome, paciente_email:email||null, paciente_telefone:tel,
        paciente_nascimento:document.getElementById('pNasc').value||null,
        paciente_bi:document.getElementById('pBI').value||null,
        medico_id:sel.medicoId?parseInt(sel.medicoId):1,
        especialidade_id:parseInt(sel.specId),
        hospital_id:sel.hospitalId?parseInt(sel.hospitalId):null,
        data_hora:`${sel.date}T${sel.time}:00`, tipo:'presencial',
        motivo:document.getElementById('pNotes').value||null,
      });
      document.getElementById('emailConfMsg').textContent=email?`Enviámos uma confirmação para ${email}.`:'Guarde o número da sua consulta para referência futura.';
      document.getElementById('bookingSummary').innerHTML=`
        <div class="summary-final">
          <div><i class="fa-solid fa-hashtag"></i><span>Consulta #${resultado.id}</span></div>
          ${sel.hospitalNome?`<div><i class="fa-solid fa-hospital"></i><span>${sel.hospitalNome}</span></div>`:''}
          <div><i class="fa-solid fa-user"></i><span>${nome}</span></div>
          <div><i class="fa-solid fa-phone"></i><span>${tel}</span></div>
          <div><i class="fa-solid fa-stethoscope"></i><span>${sel.specNome}</span></div>
          <div><i class="fa-solid fa-user-doctor"></i><span>${sel.medicoNome}</span></div>
          <div><i class="fa-solid fa-calendar"></i><span>${document.getElementById('sum-date').textContent}</span></div>
          <div><i class="fa-solid fa-clock"></i><span>${sel.time}</span></div>
        </div>`;
      showToast('Consulta marcada com sucesso!','success');
      goToStep(4);
    } catch(err){
      document.getElementById('submitErrorMsg').textContent=err.message;
      document.getElementById('submitError').classList.remove('hidden');
      document.getElementById('step3BtnText').classList.remove('hidden');
      document.getElementById('step3BtnLoad').classList.add('hidden');
      document.getElementById('step3Next').disabled=false;
      showToast(err.message,'error');
    }
  });

  const tomorrow=new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  document.getElementById('dataConsulta').min=tomorrow.toISOString().split('T')[0];
  carregarEspecialidades();
}

// ═══════════════════════════════════════════════════════════════════════════
//  CONTACTO
// ═══════════════════════════════════════════════════════════════════════════
if (document.getElementById('contactForm')) {
  document.getElementById('contactForm').addEventListener('submit', async function(e){
    e.preventDefault();
    const nome=document.getElementById('nome').value.trim();
    const email=document.getElementById('email').value.trim();
    const telefone=document.getElementById('telefone').value.trim();
    const assunto=document.getElementById('assunto').value;
    const mensagem=document.getElementById('mensagem').value.trim();
    const priv=document.getElementById('privacidade').checked;
    let valid=true;
    const rules=[
      {id:'nome',errId:'nomeErr',msg:'Por favor, insira o seu nome.',check:()=>!!nome},
      {id:'email',errId:'emailErr',msg:'Por favor, insira um email válido.',check:()=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)},
      {id:'assunto',errId:'assuntoErr',msg:'Por favor, selecione um assunto.',check:()=>!!assunto},
      {id:'mensagem',errId:'mensagemErr',msg:'Por favor, escreva a sua mensagem.',check:()=>mensagem.length>=5},
    ];
    rules.forEach(r=>{const ok=r.check();document.getElementById(r.errId).textContent=ok?'':r.msg;document.getElementById(r.id).classList.toggle('error',!ok);if(!ok)valid=false;});
    if(!priv){document.getElementById('privacidadeErr').textContent='Deve aceitar a política de privacidade.';valid=false;}
    else{document.getElementById('privacidadeErr').textContent='';}
    if(!valid)return;
    document.getElementById('btnText').classList.add('hidden');
    document.getElementById('btnLoading').classList.remove('hidden');
    document.getElementById('submitBtn').disabled=true;
    try{
      await apiPost('/mensagens',{nome,email,telefone:telefone||null,assunto,mensagem});
      document.getElementById('contactForm').classList.add('hidden');
      document.getElementById('formSuccess').classList.remove('hidden');
    }catch(err){
      document.getElementById('btnText').classList.remove('hidden');
      document.getElementById('btnLoading').classList.add('hidden');
      document.getElementById('submitBtn').disabled=false;
      let errDiv=document.getElementById('formApiError');
      if(!errDiv){errDiv=document.createElement('div');errDiv.id='formApiError';errDiv.style.cssText='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;font-size:0.86rem;color:#dc2626;display:flex;align-items:center;gap:8px;margin-top:8px';document.querySelector('.form-btn-row').before(errDiv);}
      errDiv.innerHTML=`<i class="fa-solid fa-circle-exclamation"></i> ${err.message}`;
    }
  });
}

const _ts=document.createElement('style');
_ts.textContent='@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}';
document.head.appendChild(_ts);