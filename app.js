// ── APP ───────────────────────────────────────────────────
// Point d'entrée principal

const NAV_CONFIG = {
  medecin: [
    { section: 'Général' },
    { id: 'dashboard-med', icon: 'ti-layout-dashboard', label: 'Tableau de bord' },
    { id: 'planning',      icon: 'ti-calendar',         label: 'Planning' },
    { id: 'patients',      icon: 'ti-users',            label: 'Patients' },
    { section: 'Médical' },
    { id: 'dossiers',      icon: 'ti-clipboard-heart',  label: 'Dossiers médicaux' },
    { section: 'Finance' },
    { id: 'factures',      icon: 'ti-file-invoice',     label: 'Factures' },
    { id: 'finances',      icon: 'ti-report-money',     label: 'Revenus & Stats' },
    { section: 'Outils' },
    { id: 'ia',            icon: 'ti-robot',            label: 'Assistant IA' },
  ],
  secretaire: [
    { section: 'Général' },
    { id: 'dashboard-sec', icon: 'ti-layout-dashboard', label: 'Tableau de bord' },
    { id: 'planning',      icon: 'ti-calendar',         label: 'Planning' },
    { id: 'patients',      icon: 'ti-users',            label: 'Patients' },
    { section: 'Finance' },
    { id: 'factures',      icon: 'ti-file-invoice',     label: 'Factures' },
    { section: 'Outils' },
    { id: 'ia',            icon: 'ti-robot',            label: 'Assistant IA' },
  ]
};

// Pages HTML vides à injecter dans le DOM
const PAGE_TEMPLATES = `
  <div class="page" id="page-dashboard-med"></div>
  <div class="page" id="page-dashboard-sec"></div>
  <div class="page" id="page-planning"></div>
  <div class="page" id="page-patients"></div>
  <div class="page" id="page-dossiers"></div>
  <div class="page" id="page-factures"></div>
  <div class="page" id="page-finances"></div>
  <div class="page" id="page-ia"></div>
`;

function launchApp() {
  // Injecter les pages
  document.getElementById('content-area').innerHTML = PAGE_TEMPLATES;

  // Cacher login, afficher app
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').classList.add('visible');

  // Configurer rôle
  const r = currentRole;
  document.getElementById('role-tag').textContent = r === 'medecin' ? 'Médecin' : 'Secrétaire';
  document.getElementById('role-tag').className = 'role-tag ' + r;

  const av = document.getElementById('user-av');
  av.textContent = r === 'medecin' ? 'DR' : 'SC';
  av.className = 'user-avatar ' + (r === 'medecin' ? 'av-m' : 'av-s');

  document.getElementById('user-name-badge').textContent =
    r === 'medecin' ? 'Dr. Amrani' : 'Secrétariat';

  // Construire la navigation
  buildNav(r);

  // Pré-rendre la page IA (contenu statique)
  renderIA();

  // Aller sur le dashboard
  const firstPage = r === 'medecin' ? 'dashboard-med' : 'dashboard-sec';
  showPage(firstPage);
}

function buildNav(r) {
  const c = document.getElementById('nav-container');
  c.innerHTML = '';
  NAV_CONFIG[r].forEach(item => {
    if (item.section) {
      const s = document.createElement('div');
      s.className = 'nav-section';
      s.textContent = item.section;
      c.appendChild(s);
    } else {
      const d = document.createElement('div');
      d.className = 'nav-item';
      d.id = 'nav-' + item.id;
      d.innerHTML = `<i class="ti ${item.icon}" aria-hidden="true"></i>${item.label}`;
      d.onclick = () => showPage(item.id);
      c.appendChild(d);
    }
  });
}

// Démarrage : vérifier session existante
window.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
