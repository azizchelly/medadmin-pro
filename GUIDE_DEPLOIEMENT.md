# MedAdmin Pro — Guide de déploiement
## Chirurgie pédiatrique · Dr. Amrani

---

## ÉTAPE 1 — Créer la base de données Supabase (5 min)

1. Aller sur **https://supabase.com** → créer un compte gratuit
2. Cliquer **"New project"** → nommer le projet `medadmin`
3. Choisir un mot de passe fort (le noter !)
4. Attendre la création (~1 min)

### Créer les tables
5. Dans le menu gauche → **SQL Editor** → **New query**
6. Copier-coller tout le contenu du fichier `schema.sql`
7. Cliquer **Run** → les tables sont créées ✓

### Récupérer les clés API
8. Menu gauche → **Project Settings** → **API**
9. Copier :
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **anon public key** (longue chaîne commençant par `eyJ...`)

---

## ÉTAPE 2 — Créer les comptes utilisateurs (2 min)

Dans Supabase → **Authentication** → **Users** → **Add user** :

### Compte Médecin (Dr. Amrani)
- Email : `dr.amrani@cabinet.com` (ou son vrai email)
- Mot de passe : (choisir)
- Après création → cliquer sur l'utilisateur → **User metadata** → ajouter :
  ```json
  { "role": "medecin" }
  ```

### Compte Secrétaire
- Email : `secretaire@cabinet.com`
- Mot de passe : (choisir)
- Metadata :
  ```json
  { "role": "secretaire" }
  ```

---

## ÉTAPE 3 — Configurer le projet (1 min)

Ouvrir le fichier `js/config.js` et remplacer :

```javascript
const SUPABASE_URL = 'https://VOTRE_ID.supabase.co';     // ← coller ici
const SUPABASE_ANON_KEY = 'eyJhbGciOi...';               // ← coller ici
```

---

## ÉTAPE 4 — Déployer sur Vercel (3 min)

### Option A — Via GitHub (recommandé)
1. Créer un compte **https://github.com** (si pas déjà fait)
2. Créer un nouveau dépôt → y uploader tous les fichiers du projet
3. Aller sur **https://vercel.com** → se connecter avec GitHub
4. **"Add New Project"** → sélectionner votre dépôt
5. Cliquer **Deploy** → votre site est en ligne en ~1 min ! ✓

### Option B — Via Vercel CLI
```bash
npm install -g vercel
cd medadmin
vercel
```

---

## RÉSULTAT FINAL

Votre site sera accessible à une URL du type :
**`https://medadmin.vercel.app`**

| Rôle        | Email                        | Accès |
|-------------|------------------------------|-------|
| Médecin     | dr.amrani@cabinet.com        | Complet (dossiers, stats, tout) |
| Secrétaire  | secretaire@cabinet.com       | RDV, patients, factures |

---

## STRUCTURE DES FICHIERS

```
medadmin/
├── index.html          ← page principale
├── schema.sql          ← base de données (exécuter une seule fois)
├── vercel.json         ← config déploiement
├── css/
│   └── style.css       ← tous les styles
└── js/
    ├── config.js       ← ⚠️  METTRE VOS CLÉS ICI
    ├── auth.js         ← connexion / déconnexion
    ├── db.js           ← toutes les requêtes base de données
    ├── ui.js           ← utilitaires d'affichage
    ├── pages.js        ← rendu des pages
    ├── modal.js        ← formulaires (RDV, patients, factures)
    ├── ai.js           ← assistant IA
    └── app.js          ← démarrage de l'application
```

---

## FONCTIONNALITÉS INCLUSES

### Médecin
- Tableau de bord avec métriques temps réel
- Planning semaine (navigation avant/arrière)
- Liste des patients avec recherche
- Dossiers médicaux (antécédents, notes, ordonnances)
- Factures (créer, modifier, marquer payée)
- Statistiques financières
- Assistant IA (analyse planning, finances, patients)

### Secrétaire
- Tableau de bord simplifié
- Planning semaine
- Gestion des patients (créer, modifier)
- Factures (créer, modifier, marquer payée)
- Assistant IA (aide administrative)
- ❌ Pas d'accès aux dossiers médicaux
- ❌ Pas d'accès aux statistiques financières détaillées

---

*MedAdmin Pro — Développé pour le cabinet du Dr. Amrani*
