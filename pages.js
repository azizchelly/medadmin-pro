// ── PAGES ─────────────────────────────────────────────────
// Chaque fonction rend le HTML d'une page et charge ses données

let weekOffset = 0;
let selectedPatientId = null;

async function loadPageData(id) {
  switch (id) {
    case 'dashboard-med': await renderDashboardMed(); break;
    case 'dashboard-sec': await renderDashboardSec(); break;
    case 'planning':      await renderPlanning();     break;
    case 'patients':      await renderPatients();     break;
    case 'dossiers':      await renderDossiers();     break;
    case 'factures':      await renderFactures();     break;
    case 'finances':      await renderFinances();     break;
  }
}

// ── DASHBOARD MÉDECIN ──
async function renderDashboardMed() {
  const el = document.getElementById('page-dashboard-med');
  el.innerHTML = '<div class="loading">Chargement…</div>';

  const [stats, rdvs] = await Promise.all([getStatsMois(), getRdvByDate(todayStr())]);

  el.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Consultations (mois)</div><div class="metric-value">${stats.totalRdv}</div></div>
      <div class="metric-card"><div class="metric-label">Revenus (mois)</div><div class="metric-value">${stats.revenus.toLocaleString('fr-FR')} DT</div></div>
      <div class="metric-card"><div class="metric-label">Factures impayées</div><div class="metric-value">${stats.impayees}</div><div class="metric-delta delta-dn">${stats.impayees > 0 ? 'À traiter' : 'Tout est à jour'}</div></div>
      <div class="metric-card"><div class="metric-label">Patients actifs</div><div class="metric-value">${stats.totalPatients}</div></div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-header"><span class="card-title">RDV du jour — ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span></div>
        ${rdvTableHtml(rdvs, true)}
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Alertes</span></div>
        <div class="alert-item"><i class="ti ti-file-text" style="color:#378ADD;font-size:15px"></i>Dossiers à compléter après consultation</div>
        ${stats.impayees > 0 ? `<div class="alert-item"><i class="ti ti-alert-triangle" style="color:#BA7517;font-size:15px"></i>${stats.impayees} facture(s) en attente de paiement</div>` : ''}
        <div class="alert-item"><i class="ti ti-calendar" style="color:#1D9E75;font-size:15px"></i>${rdvs.length} RDV programmés aujourd'hui</div>
      </div>
    </div>`;
}

// ── DASHBOARD SECRÉTAIRE ──
async function renderDashboardSec() {
  const el = document.getElementById('page-dashboard-sec');
  el.innerHTML = '<div class="loading">Chargement…</div>';

  const [rdvs, stats] = await Promise.all([getRdvByDate(todayStr()), getStatsMois()]);

  el.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">RDV aujourd'hui</div><div class="metric-value">${rdvs.length}</div></div>
      <div class="metric-card"><div class="metric-label">Patients actifs</div><div class="metric-value">${stats.totalPatients}</div></div>
      <div class="metric-card"><div class="metric-label">Factures en attente</div><div class="metric-value">${stats.impayees}</div><div class="metric-delta delta-dn">${stats.impayees > 0 ? 'À traiter' : 'Tout est à jour'}</div></div>
      <div class="metric-card"><div class="metric-label">Revenus (mois)</div><div class="metric-value">${stats.revenus.toLocaleString('fr-FR')} DT</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Planning du jour — ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span>
        <button class="btn btn-green" onclick="openModalRdv()"><i class="ti ti-plus"></i>Ajouter RDV</button>
      </div>
      ${rdvTableHtml(rdvs, false)}
    </div>`;
}

function rdvTableHtml(rdvs, showDossierBtn) {
  if (!rdvs.length) return '<p style="color:var(--text-3);font-size:13px;padding:12px 0">Aucun rendez-vous aujourd\'hui.</p>';
  return `<table class="data-table">
    <thead><tr><th>Heure</th><th>Patient</th><th>Type</th><th>Statut</th><th></th></tr></thead>
    <tbody>${rdvs.map(r => `
      <tr>
        <td>${r.heure?.slice(0,5) || ''}</td>
        <td>${r.patients?.nom || '—'} ${r.patients?.age ? ', '+r.patients.age : ''}</td>
        <td>${r.type || '—'}</td>
        <td>${badgeStatut(r.statut)}</td>
        <td style="display:flex;gap:4px">
          <button class="btn btn-sm" onclick="openModalRdv('${r.id}')"><i class="ti ti-edit"></i></button>
          ${showDossierBtn ? `<button class="btn btn-sm" onclick="showPage('dossiers');loadDossierPatient('${r.patient_id}')">Dossier</button>` : ''}
        </td>
      </tr>`).join('')}
    </tbody></table>`;
}

// ── PLANNING ──
async function renderPlanning() {
  const el = document.getElementById('page-planning');
  el.innerHTML = '<div class="loading">Chargement…</div>';

  const range = weekRange(weekOffset);
  const rdvs  = await getRdvByWeek(range.debut, range.fin);

  const days = ['Lun','Mar','Mer','Jeu','Ven'];
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(range.debut);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  const hours = ['08h','09h','10h','11h','12h','13h','14h','15h','16h','17h'];

  function rdvsAt(dateStr, h) {
    return rdvs.filter(r => r.date === dateStr && r.heure?.startsWith(h.replace('h',':')));
  }

  el.innerHTML = `
    <div class="week-nav">
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn" onclick="weekOffset--;renderPlanning()"><i class="ti ti-chevron-left"></i></button>
        <span style="font-size:13px;font-weight:500">${range.label}</span>
        <button class="btn" onclick="weekOffset++;renderPlanning()"><i class="ti ti-chevron-right"></i></button>
        <button class="btn" onclick="weekOffset=0;renderPlanning()">Aujourd'hui</button>
      </div>
      <button class="btn btn-primary" onclick="openModalRdv()"><i class="ti ti-plus"></i>Nouveau RDV</button>
    </div>
    <div class="week-grid">
      <div class="wh"></div>
      ${dates.map((d,i) => `<div class="wh">${days[i]} ${d.getDate()}</div>`).join('')}
      ${hours.map(h => `
        <div class="wt">${h}</div>
        ${dates.map(d => {
          const ds = d.toISOString().slice(0,10);
          const slots = rdvsAt(ds, h);
          return `<div class="ws">${slots.map(r =>
            `<div class="ap ${typeApColor(r.type)}" onclick="openModalRdv('${r.id}')">${r.patients?.nom?.split(' ')[0] || '?'}<br>${r.type||''}</div>`
          ).join('')}</div>`;
        }).join('')}
      `).join('')}
    </div>
    <div class="week-legend">
      <span><span class="legend-dot" style="background:#B5D4F4"></span>Consultation</span>
      <span><span class="legend-dot" style="background:#9FE1CB"></span>Suivi</span>
      <span><span class="legend-dot" style="background:#FAC775"></span>Préop/Bilan</span>
      <span><span class="legend-dot" style="background:#F5C4B3"></span>Urgence</span>
    </div>`;
}

// ── PATIENTS ──
async function renderPatients(search = '') {
  const el = document.getElementById('page-patients');
  el.innerHTML = '<div class="loading">Chargement…</div>';
  const patients = await getPatients(search);

  el.innerHTML = `
    <div class="search-bar">
      <i class="ti ti-search" style="color:var(--text-2);font-size:16px"></i>
      <input type="text" placeholder="Rechercher par nom…" value="${search}"
        oninput="renderPatients(this.value)" id="patient-search">
      <button class="btn btn-primary" onclick="openModalPatient()"><i class="ti ti-plus"></i>Nouveau patient</button>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <table class="data-table">
        <thead><tr><th>Patient</th><th>Âge</th><th>Parent / Contact</th><th>Dernier RDV</th><th>Motif</th><th></th></tr></thead>
        <tbody>${patients.length ? patients.map(p => {
          const [bg, color] = avatarColor(p.nom);
          return `<tr>
            <td><div style="display:flex;align-items:center;gap:8px">
              <div class="p-av" style="width:28px;height:28px;font-size:10px;background:${bg};color:${color}">${avatarInitials(p.nom)}</div>
              ${p.nom}
            </div></td>
            <td>${p.age || '—'}</td>
            <td>${p.parent_nom || '—'} ${p.parent_tel ? '· '+p.parent_tel : ''}</td>
            <td>${p.dernier_rdv ? fmtDate(p.dernier_rdv) : '—'}</td>
            <td>${p.motif || '—'}</td>
            <td style="display:flex;gap:4px">
              <button class="btn btn-sm" onclick="openModalPatient('${p.id}')"><i class="ti ti-edit"></i></button>
              ${currentRole === 'medecin' ? `<button class="btn btn-sm" onclick="showPage('dossiers');loadDossierPatient('${p.id}')">Dossier</button>` : ''}
            </td>
          </tr>`;
        }).join('') : '<tr class="empty-row"><td colspan="6">Aucun patient trouvé.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

// ── DOSSIERS ──
async function renderDossiers() {
  const el = document.getElementById('page-dossiers');
  el.innerHTML = '<div class="loading">Chargement…</div>';
  const patients = await getPatients();

  el.innerHTML = `
    <div class="dossier-grid">
      <div>
        <div class="card" style="padding:12px">
          <div class="card-title" style="margin-bottom:10px">Patients</div>
          <div id="dossier-patient-list">
            ${patients.map(p => {
              const [bg, color] = avatarColor(p.nom);
              return `<div class="patient-list-item" id="dpi-${p.id}" onclick="loadDossierPatient('${p.id}')">
                <div class="p-av" style="background:${bg};color:${color};width:34px;height:34px;font-size:11px">${avatarInitials(p.nom)}</div>
                <div>
                  <div style="font-size:13px;font-weight:500">${p.nom}</div>
                  <div style="font-size:11px;color:var(--text-2)">${p.age || ''} ${p.motif ? '· '+p.motif : ''}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div id="dossier-detail">
        <div class="card" style="color:var(--text-3);font-size:13px;text-align:center;padding:40px">
          Sélectionnez un patient pour voir son dossier
        </div>
      </div>
    </div>`;

  if (selectedPatientId) loadDossierPatient(selectedPatientId);
}

async function loadDossierPatient(patientId) {
  selectedPatientId = patientId;
  document.querySelectorAll('.patient-list-item').forEach(el => el.classList.remove('selected'));
  const item = document.getElementById('dpi-' + patientId);
  if (item) item.classList.add('selected');

  const detailEl = document.getElementById('dossier-detail');
  if (!detailEl) return;
  detailEl.innerHTML = '<div class="loading">Chargement…</div>';

  const [patient, entrees] = await Promise.all([getPatient(patientId), getDossier(patientId)]);
  if (!patient) return;

  const [bg, color] = avatarColor(patient.nom);
  const derniere = entrees[0];

  detailEl.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="p-av" style="background:${bg};color:${color};width:38px;height:38px;font-size:13px">${avatarInitials(patient.nom)}</div>
          <div>
            <div style="font-size:14px;font-weight:500">${patient.nom}</div>
            <div style="font-size:11px;color:var(--text-2)">${patient.age || ''} · ${patient.motif || ''}</div>
          </div>
        </div>
        <button class="btn btn-primary" onclick="openModalCR('${patientId}')"><i class="ti ti-pencil"></i>Compte-rendu</button>
      </div>
      <div class="section-block">
        <div class="section-block-title">Antécédents</div>
        <div style="font-size:13px;color:var(--text-2)">${patient.antecedents || 'Aucun antécédent renseigné.'}</div>
      </div>
      <div class="section-block">
        <div class="section-block-title">Dernier compte-rendu ${derniere ? '— '+fmtDate(derniere.created_at) : ''}</div>
        <div style="font-size:13px;color:var(--text-2)">${derniere?.note || 'Aucune note.'}</div>
        ${derniere?.ordonnance ? `<div style="margin-top:8px;font-size:13px;color:var(--text-2)"><strong>Ordonnance :</strong> ${derniere.ordonnance}</div>` : ''}
      </div>
      ${entrees.length > 1 ? `<div class="section-block">
        <div class="section-block-title">Historique (${entrees.length} entrées)</div>
        ${entrees.slice(1).map(e => `<div style="font-size:12px;color:var(--text-2);margin-bottom:6px"><strong>${fmtDate(e.created_at)}</strong> — ${e.note?.slice(0,80)||''}…</div>`).join('')}
      </div>` : ''}
    </div>`;
}

// ── FACTURES ──
async function renderFactures() {
  const el = document.getElementById('page-factures');
  el.innerHTML = '<div class="loading">Chargement…</div>';
  const factures = await getFactures();

  el.innerHTML = `
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-header" style="padding:14px 20px">
        <span class="card-title">Factures</span>
        <button class="btn btn-primary" onclick="openModalFacture()"><i class="ti ti-plus"></i>Nouvelle facture</button>
      </div>
      <table class="data-table">
        <thead><tr><th>N°</th><th>Patient</th><th>Date</th><th>Acte</th><th>Montant</th><th>Paiement</th><th>Statut</th><th></th></tr></thead>
        <tbody>${factures.length ? factures.map(f => `<tr>
          <td>#${String(f.id).slice(-4).padStart(4,'0')}</td>
          <td>${f.patients?.nom || '—'}</td>
          <td>${fmtDate(f.date)}</td>
          <td>${f.acte || '—'}</td>
          <td><strong>${(f.montant||0).toLocaleString('fr-FR')} DT</strong></td>
          <td>${f.mode_paiement || '—'}</td>
          <td>${badgeStatut(f.statut)}</td>
          <td>
            <button class="btn btn-sm" onclick="openModalFacture('${f.id}')"><i class="ti ti-edit"></i></button>
            ${f.statut !== 'payee' ? `<button class="btn btn-sm btn-green" onclick="marquerPayee('${f.id}')">Payée</button>` : ''}
          </td>
        </tr>`).join('') : '<tr class="empty-row"><td colspan="8">Aucune facture.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

async function marquerPayee(id) {
  await updateFacture(id, { statut: 'payee' });
  showToast('Facture marquée comme payée');
  renderFactures();
}

// ── FINANCES ──
async function renderFinances() {
  const el = document.getElementById('page-finances');
  el.innerHTML = '<div class="loading">Chargement…</div>';
  const stats = await getStatsMois();

  el.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Revenus (mois)</div><div class="metric-value">${stats.revenus.toLocaleString('fr-FR')} DT</div></div>
      <div class="metric-card"><div class="metric-label">Consultations</div><div class="metric-value">${stats.totalRdv}</div></div>
      <div class="metric-card"><div class="metric-label">Moy. / consultation</div><div class="metric-value">${stats.totalRdv ? Math.round(stats.revenus/stats.totalRdv) : 0} DT</div></div>
      <div class="metric-card"><div class="metric-label">Impayées</div><div class="metric-value">${stats.impayees}</div><div class="metric-delta delta-dn">${stats.impayees > 0 ? 'À recouvrer' : 'RAS'}</div></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:14px">Répartition des actes</div>
      <div class="mini-bar"><div class="mini-bar-label">Consultations</div><div class="mini-bar-track"><div class="mini-bar-fill" style="width:62%;background:#378ADD"></div></div><span style="font-size:11px;color:var(--text-2)">62%</span></div>
      <div class="mini-bar"><div class="mini-bar-label">Chirurgies</div><div class="mini-bar-track"><div class="mini-bar-fill" style="width:28%;background:#1D9E75"></div></div><span style="font-size:11px;color:var(--text-2)">28%</span></div>
      <div class="mini-bar"><div class="mini-bar-label">Bilans/Préop</div><div class="mini-bar-track"><div class="mini-bar-fill" style="width:10%;background:#EF9F27"></div></div><span style="font-size:11px;color:var(--text-2)">10%</span></div>
    </div>`;
}
