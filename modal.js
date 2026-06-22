// ── MODALS ────────────────────────────────────────────────

async function openModalRdv(rdvId = null) {
  const patients = await getPatients();
  const rdv = rdvId ? await db.from('rendez_vous').select('*').eq('id', rdvId).single().then(r => r.data) : null;

  const optionsPatients = patients.map(p =>
    `<option value="${p.id}" ${rdv?.patient_id === p.id ? 'selected' : ''}>${p.nom}</option>`
  ).join('');

  openModal(`
    <h3>${rdv ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h3>
    <div class="field">
      <label>Patient</label>
      <select id="f-patient">${optionsPatients}</select>
    </div>
    <div class="field-row">
      <div class="field"><label>Date</label><input type="date" id="f-date" value="${rdv?.date || todayStr()}"></div>
      <div class="field"><label>Heure</label><input type="time" id="f-heure" value="${rdv?.heure?.slice(0,5) || '09:00'}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Type</label>
        <select id="f-type">
          ${['Consultation','Suivi post-op','Bilan préopératoire','Chirurgie','Urgence'].map(t =>
            `<option ${rdv?.type === t ? 'selected' : ''}>${t}</option>`
          ).join('')}
        </select>
      </div>
      <div class="field"><label>Statut</label>
        <select id="f-statut">
          ${[['confirme','Confirmé'],['en_attente','En attente'],['urgent','Urgent'],['nouveau','Nouveau'],['annule','Annulé']].map(([v,l]) =>
            `<option value="${v}" ${rdv?.statut === v ? 'selected' : ''}>${l}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="field"><label>Notes</label><textarea id="f-notes" rows="2">${rdv?.notes || ''}</textarea></div>
    <div class="modal-actions">
      ${rdv ? `<button class="btn btn-danger" onclick="supprimerRdv('${rdvId}')">Supprimer</button>` : ''}
      <button class="btn" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="sauvegarderRdv(${rdvId ? `'${rdvId}'` : null})">Enregistrer</button>
    </div>`);
}

async function sauvegarderRdv(rdvId) {
  const payload = {
    patient_id:  document.getElementById('f-patient').value,
    date:        document.getElementById('f-date').value,
    heure:       document.getElementById('f-heure').value + ':00',
    type:        document.getElementById('f-type').value,
    statut:      document.getElementById('f-statut').value,
    notes:       document.getElementById('f-notes').value,
  };
  try {
    if (rdvId) await updateRdv(rdvId, payload);
    else await createRdv(payload);
    closeModal();
    showToast(rdvId ? 'RDV mis à jour' : 'RDV créé');
    loadPageData(document.querySelector('.nav-item.active')?.id?.replace('nav-', '') || 'planning');
  } catch (e) {
    showToast('Erreur : ' + e.message);
  }
}

async function supprimerRdv(id) {
  if (!confirm('Supprimer ce rendez-vous ?')) return;
  await deleteRdv(id);
  closeModal();
  showToast('RDV supprimé');
  loadPageData('planning');
}

// ── MODAL PATIENT ──
async function openModalPatient(patientId = null) {
  const patient = patientId ? await getPatient(patientId) : null;
  const v = k => patient?.[k] || '';

  openModal(`
    <h3>${patient ? 'Modifier le patient' : 'Nouveau patient'}</h3>
    <div class="field-row">
      <div class="field"><label>Nom complet</label><input type="text" id="f-nom" value="${v('nom')}" placeholder="Prénom Nom"></div>
      <div class="field"><label>Âge</label><input type="text" id="f-age" value="${v('age')}" placeholder="Ex: 4 ans"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Sexe</label>
        <select id="f-sexe">
          <option value="M" ${v('sexe')==='M'?'selected':''}>Masculin</option>
          <option value="F" ${v('sexe')==='F'?'selected':''}>Féminin</option>
        </select>
      </div>
      <div class="field"><label>Date de naissance</label><input type="date" id="f-ddn" value="${v('date_naissance')}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Parent / Tuteur</label><input type="text" id="f-parent" value="${v('parent_nom')}" placeholder="Nom du parent"></div>
      <div class="field"><label>Téléphone</label><input type="text" id="f-tel" value="${v('parent_tel')}" placeholder="55 000 000"></div>
    </div>
    <div class="field"><label>Motif de consultation</label><input type="text" id="f-motif" value="${v('motif')}" placeholder="Ex: Hernie inguinale, suivi appendicite…"></div>
    <div class="field"><label>Antécédents médicaux</label><textarea id="f-antecedents" rows="2">${v('antecedents')}</textarea></div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="sauvegarderPatient(${patientId ? `'${patientId}'` : null})">Enregistrer</button>
    </div>`);
}

async function sauvegarderPatient(patientId) {
  const payload = {
    nom:            document.getElementById('f-nom').value,
    age:            document.getElementById('f-age').value,
    sexe:           document.getElementById('f-sexe').value,
    date_naissance: document.getElementById('f-ddn').value || null,
    parent_nom:     document.getElementById('f-parent').value,
    parent_tel:     document.getElementById('f-tel').value,
    motif:          document.getElementById('f-motif').value,
    antecedents:    document.getElementById('f-antecedents').value,
  };
  if (!payload.nom) { showToast('Le nom est requis'); return; }
  try {
    if (patientId) await updatePatient(patientId, payload);
    else await createPatient(payload);
    closeModal();
    showToast(patientId ? 'Patient mis à jour' : 'Patient créé');
    renderPatients();
  } catch (e) {
    showToast('Erreur : ' + e.message);
  }
}

// ── MODAL FACTURE ──
async function openModalFacture(factureId = null) {
  const patients = await getPatients();
  let facture = null;
  if (factureId) {
    const { data } = await db.from('factures').select('*').eq('id', factureId).single();
    facture = data;
  }

  openModal(`
    <h3>${facture ? 'Modifier la facture' : 'Nouvelle facture'}</h3>
    <div class="field"><label>Patient</label>
      <select id="f-patient">
        ${patients.map(p => `<option value="${p.id}" ${facture?.patient_id===p.id?'selected':''}>${p.nom}</option>`).join('')}
      </select>
    </div>
    <div class="field-row">
      <div class="field"><label>Acte médical</label><input type="text" id="f-acte" value="${facture?.acte||''}" placeholder="Ex: Consultation, Chirurgie…"></div>
      <div class="field"><label>Montant (DT)</label><input type="number" id="f-montant" value="${facture?.montant||''}" placeholder="0"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Date</label><input type="date" id="f-date" value="${facture?.date||todayStr()}"></div>
      <div class="field"><label>Mode de paiement</label>
        <select id="f-mode">
          ${['Espèces','Chèque','Virement','CNAM','Mutuelle'].map(m =>
            `<option ${facture?.mode_paiement===m?'selected':''}>${m}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="field"><label>Statut</label>
      <select id="f-statut">
        <option value="payee" ${facture?.statut==='payee'?'selected':''}>Payée</option>
        <option value="en_attente" ${facture?.statut==='en_attente'?'selected':''}>En attente</option>
        <option value="impayee" ${facture?.statut==='impayee'?'selected':''}>Impayée</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="sauvegarderFacture(${factureId?`'${factureId}'`:null})">Enregistrer</button>
    </div>`);
}

async function sauvegarderFacture(factureId) {
  const payload = {
    patient_id:    document.getElementById('f-patient').value,
    acte:          document.getElementById('f-acte').value,
    montant:       parseFloat(document.getElementById('f-montant').value) || 0,
    date:          document.getElementById('f-date').value,
    mode_paiement: document.getElementById('f-mode').value,
    statut:        document.getElementById('f-statut').value,
  };
  try {
    if (factureId) await updateFacture(factureId, payload);
    else await createFacture(payload);
    closeModal();
    showToast(factureId ? 'Facture mise à jour' : 'Facture créée');
    renderFactures();
  } catch (e) {
    showToast('Erreur : ' + e.message);
  }
}

// ── MODAL COMPTE-RENDU ──
function openModalCR(patientId) {
  openModal(`
    <h3>Nouveau compte-rendu</h3>
    <div class="field"><label>Note clinique</label><textarea id="f-note" rows="4" placeholder="Observations, diagnostic, évolution…"></textarea></div>
    <div class="field"><label>Ordonnance</label><textarea id="f-ord" rows="3" placeholder="Médicaments, posologie, durée…"></textarea></div>
    <div class="field"><label>Prochain RDV</label><input type="date" id="f-rdv"></div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="sauvegarderCR('${patientId}')">Enregistrer</button>
    </div>`);
}

async function sauvegarderCR(patientId) {
  const note        = document.getElementById('f-note').value;
  const ordonnance  = document.getElementById('f-ord').value;
  const prochain    = document.getElementById('f-rdv').value;
  if (!note) { showToast('Ajoutez une note'); return; }
  try {
    await saveDossierNote(patientId, note, ordonnance, prochain || null);
    closeModal();
    showToast('Compte-rendu enregistré');
    loadDossierPatient(patientId);
  } catch (e) {
    showToast('Erreur : ' + e.message);
  }
}
