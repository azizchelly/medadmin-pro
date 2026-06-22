// ── UI HELPERS ────────────────────────────────────────────

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const ni = document.getElementById('nav-' + id);
  if (ni) {
    ni.classList.add('active');
    if (currentRole === 'secretaire') ni.classList.add('sec');
  }

  const titles = {
    'dashboard-med': 'Tableau de bord',
    'dashboard-sec': 'Tableau de bord',
    planning: 'Planning',
    patients: 'Patients',
    dossiers: 'Dossiers médicaux',
    factures: 'Factures',
    finances: 'Revenus & Statistiques',
    ia: 'Assistant IA',
  };
  document.getElementById('page-title').textContent = titles[id] || '';
  loadPageData(id);
}

function avatarInitials(nom) {
  if (!nom) return '?';
  const parts = nom.trim().split(' ');
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

const AV_COLORS = [
  ['#E6F1FB','#185FA5'], ['#E1F5EE','#0F6E56'],
  ['#FAEEDA','#854F0B'], ['#FCEBEB','#A32D2D'],
  ['#EAF3DE','#3B6D11'], ['#EEEDFE','#534AB7'],
];

function avatarColor(str) {
  let hash = 0;
  for (let c of (str || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
}

function badgeStatut(statut) {
  const map = {
    confirme:   ['b-ok',     'Confirmé'],
    en_attente: ['b-wait',   'En attente'],
    urgent:     ['b-danger', 'Urgent'],
    nouveau:    ['b-info',   'Nouveau'],
    payee:      ['b-ok',     'Payée'],
    impayee:    ['b-danger', 'Impayée'],
    annule:     ['b-gray',   'Annulé'],
  };
  const [cls, label] = map[statut] || ['b-gray', statut];
  return `<span class="badge ${cls}">${label}</span>`;
}

function typeApColor(type) {
  if (!type) return 'ap-b';
  const t = type.toLowerCase();
  if (t.includes('urgent') || t.includes('urgence')) return 'ap-r';
  if (t.includes('suivi'))  return 'ap-t';
  if (t.includes('bilan') || t.includes('préop') || t.includes('preop')) return 'ap-a';
  return 'ap-b';
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR');
}

function todayStr() {
  return new Date().toISOString().slice(0,10);
}

function weekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + 1 + offset * 7);
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  return {
    debut: mon.toISOString().slice(0,10),
    fin:   fri.toISOString().slice(0,10),
    label: `${mon.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} – ${fri.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}`
  };
}
