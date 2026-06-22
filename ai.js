// ── ASSISTANT IA ──────────────────────────────────────────

const AI_CHIPS = {
  medecin:    ['Résume mes RDV du jour','Factures impayées ?','Stats du mois','Patients à revoir'],
  secretaire: ['Créneaux libres demain','Rappels du jour','Factures à émettre','Nouveaux patients']
};

function renderIA() {
  const el = document.getElementById('page-ia');
  const chips = AI_CHIPS[currentRole] || [];

  el.innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:0.5px solid var(--border)">
        <i class="ti ti-robot" style="color:var(--blue);font-size:18px"></i>
        <span style="font-size:13px;font-weight:500">Assistant IA — Cabinet Dr. Amrani</span>
      </div>
      <div class="ai-chips">
        ${chips.map(c => `<button class="btn" style="font-size:12px" onclick="askAI('${c}')">${c} ↗</button>`).join('')}
      </div>
      <div class="ai-messages" id="ai-chat">
        <div class="ai-msg assistant">${currentRole === 'medecin'
          ? 'Bonjour Docteur. Je peux analyser votre planning, vos finances et répondre à vos questions cliniques.'
          : 'Bonjour. Je peux vous aider à gérer les RDV, les patients et les factures du cabinet.'}</div>
      </div>
      <div class="ai-input-row">
        <input class="ai-txt" id="ai-input" type="text" placeholder="Posez une question…" onkeydown="if(event.key==='Enter')sendAI()">
        <button class="btn btn-primary" onclick="sendAI()"><i class="ti ti-send"></i></button>
      </div>
    </div>`;
}

function askAI(q) {
  showPage('ia');
  setTimeout(() => {
    const inp = document.getElementById('ai-input');
    if (inp) { inp.value = q; sendAI(); }
  }, 100);
}

async function sendAI() {
  const inp = document.getElementById('ai-input');
  const msg = inp?.value.trim();
  if (!msg) return;
  inp.value = '';
  addAIMsg(msg, 'user');

  const thinking = document.createElement('div');
  thinking.className = 'ai-msg assistant';
  thinking.textContent = '…';
  thinking.id = 'ai-thinking';
  document.getElementById('ai-chat').appendChild(thinking);
  scrollAI();

  const stats = await getStatsMois();
  const system = currentRole === 'medecin'
    ? `Tu es l'assistant IA du Dr. Amrani, chirurgien pédiatrique. Aide-le avec son planning, ses finances et ses patients. Données actuelles : ${stats.totalRdv} consultations ce mois, ${stats.revenus.toLocaleString('fr-FR')} DT de revenus, ${stats.totalPatients} patients actifs, ${stats.impayees} factures en attente. Réponds en français, de façon concise et professionnelle.`
    : `Tu es l'assistant de la secrétaire du cabinet du Dr. Amrani (chirurgie pédiatrique, Tunis). Aide à la gestion administrative : RDV, patients, factures. Données : ${stats.totalRdv} RDV ce mois, ${stats.totalPatients} patients, ${stats.impayees} factures en attente. Réponds en français, de façon pratique et concise.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: msg }]
      })
    });
    const d = await r.json();
    document.getElementById('ai-thinking')?.remove();
    addAIMsg(d.content?.find(c => c.type === 'text')?.text || 'Désolé, réessayez.', 'assistant');
  } catch (e) {
    document.getElementById('ai-thinking')?.remove();
    addAIMsg('Erreur de connexion.', 'assistant');
  }
}

function addAIMsg(text, role) {
  const chat = document.getElementById('ai-chat');
  const div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.textContent = text;
  chat.appendChild(div);
  scrollAI();
}

function scrollAI() {
  const c = document.getElementById('ai-chat');
  if (c) c.scrollTop = c.scrollHeight;
}
