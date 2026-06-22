// ── DATABASE ──────────────────────────────────────────────
// Toutes les requêtes Supabase centralisées ici

// ── PATIENTS ──
async function getPatients(search = '') {
  let query = db.from('patients').select('*').order('nom');
  if (search) query = query.ilike('nom', `%${search}%`);
  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  return data;
}

async function getPatient(id) {
  const { data, error } = await db.from('patients').select('*').eq('id', id).single();
  if (error) { console.error(error); return null; }
  return data;
}

async function createPatient(patient) {
  const { data, error } = await db.from('patients').insert([patient]).select().single();
  if (error) throw error;
  return data;
}

async function updatePatient(id, fields) {
  const { error } = await db.from('patients').update(fields).eq('id', id);
  if (error) throw error;
}

// ── RENDEZ-VOUS ──
async function getRdvByDate(dateStr) {
  const { data, error } = await db
    .from('rendez_vous')
    .select('*, patients(nom, age)')
    .eq('date', dateStr)
    .order('heure');
  if (error) { console.error(error); return []; }
  return data;
}

async function getRdvByWeek(dateDebut, dateFin) {
  const { data, error } = await db
    .from('rendez_vous')
    .select('*, patients(nom, age)')
    .gte('date', dateDebut)
    .lte('date', dateFin)
    .order('date').order('heure');
  if (error) { console.error(error); return []; }
  return data;
}

async function createRdv(rdv) {
  const { data, error } = await db.from('rendez_vous').insert([rdv]).select().single();
  if (error) throw error;
  return data;
}

async function updateRdv(id, fields) {
  const { error } = await db.from('rendez_vous').update(fields).eq('id', id);
  if (error) throw error;
}

async function deleteRdv(id) {
  const { error } = await db.from('rendez_vous').delete().eq('id', id);
  if (error) throw error;
}

// ── FACTURES ──
async function getFactures() {
  const { data, error } = await db
    .from('factures')
    .select('*, patients(nom)')
    .order('date', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

async function createFacture(facture) {
  const { data, error } = await db.from('factures').insert([facture]).select().single();
  if (error) throw error;
  return data;
}

async function updateFacture(id, fields) {
  const { error } = await db.from('factures').update(fields).eq('id', id);
  if (error) throw error;
}

// ── DOSSIERS MÉDICAUX ──
async function getDossier(patientId) {
  const { data, error } = await db
    .from('dossiers')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

async function saveDossierNote(patientId, note, ordonnance, prochain_rdv) {
  const { error } = await db.from('dossiers').insert([{
    patient_id: patientId,
    note,
    ordonnance,
    prochain_rdv,
    medecin_id: currentUser.id
  }]);
  if (error) throw error;
}

// ── STATS ──
async function getStatsMois() {
  const now = new Date();
  const debut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const fin   = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);

  const [rdvRes, factRes, patientsRes] = await Promise.all([
    db.from('rendez_vous').select('id', { count: 'exact' }).gte('date', debut).lte('date', fin),
    db.from('factures').select('montant, statut').gte('date', debut).lte('date', fin),
    db.from('patients').select('id', { count: 'exact' })
  ]);

  const totalRdv = rdvRes.count || 0;
  const totalPatients = patientsRes.count || 0;
  const factures = factRes.data || [];
  const revenus = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + (f.montant || 0), 0);
  const impayees = factures.filter(f => f.statut === 'impayee' || f.statut === 'en_attente').length;

  return { totalRdv, totalPatients, revenus, impayees };
}
