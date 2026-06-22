-- ══════════════════════════════════════════════════════════
--  SCHÉMA BASE DE DONNÉES — MedAdmin Pro
--  À copier-coller dans Supabase > SQL Editor > New query
--  Puis cliquer "Run"
-- ══════════════════════════════════════════════════════════

-- ── TABLE PATIENTS ──
CREATE TABLE IF NOT EXISTS patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             TEXT NOT NULL,
  age             TEXT,
  sexe            TEXT CHECK (sexe IN ('M', 'F')),
  date_naissance  DATE,
  parent_nom      TEXT,
  parent_tel      TEXT,
  motif           TEXT,
  antecedents     TEXT,
  dernier_rdv     DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE RENDEZ-VOUS ──
CREATE TABLE IF NOT EXISTS rendez_vous (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  heure       TIME NOT NULL,
  type        TEXT,
  statut      TEXT DEFAULT 'en_attente'
              CHECK (statut IN ('confirme','en_attente','urgent','nouveau','annule')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE FACTURES ──
CREATE TABLE IF NOT EXISTS factures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
  acte            TEXT,
  montant         NUMERIC(10,2) DEFAULT 0,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  mode_paiement   TEXT DEFAULT 'Espèces',
  statut          TEXT DEFAULT 'en_attente'
                  CHECK (statut IN ('payee','en_attente','impayee')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE DOSSIERS MÉDICAUX ──
CREATE TABLE IF NOT EXISTS dossiers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  medecin_id    UUID,  -- référence auth.users
  note          TEXT,
  ordonnance    TEXT,
  prochain_rdv  DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
--  SÉCURITÉ — Row Level Security (RLS)
--  Protège les données : seuls les utilisateurs connectés
--  peuvent accéder aux données du cabinet
-- ══════════════════════════════════════════════════════════

ALTER TABLE patients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous   ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers      ENABLE ROW LEVEL SECURITY;

-- Politique : tout utilisateur authentifié peut lire/écrire
CREATE POLICY "Accès authentifié" ON patients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié" ON rendez_vous
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié" ON factures
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié" ON dossiers
  FOR ALL USING (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════
--  DONNÉES DE TEST (optionnel — à supprimer en production)
-- ══════════════════════════════════════════════════════════

INSERT INTO patients (nom, age, sexe, parent_nom, parent_tel, motif, antecedents) VALUES
  ('Mehdi Bouraoui',  '4 ans',  'M', 'Karim Bouraoui',   '55 123 456', 'Suivi appendicite',    'Appendicite opérée mars 2026. Allergie pénicilline.'),
  ('Salma Khemiri',   '7 ans',  'F', 'Nadia Khemiri',    '55 987 654', 'Hernie inguinale',     'Aucun antécédent.'),
  ('Adam Riahi',      '2 ans',  'M', 'Sonia Riahi',      '55 111 222', 'Urgence chirurgicale', 'Prématuré (32 SA).'),
  ('Lina Trabelsi',   '11 ans', 'F', 'Amine Trabelsi',   '55 444 333', 'Bilan préopératoire',  'Allergie latex.'),
  ('Youssef Mansour', '5 ans',  'M', 'Rim Mansour',      '55 777 888', 'Première consultation','Aucun antécédent connu.');
