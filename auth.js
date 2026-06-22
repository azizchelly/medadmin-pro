// ── AUTH ──────────────────────────────────────────────────
// Gère la connexion, déconnexion et le rôle utilisateur

let currentUser = null;
let currentRole = null;

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value.trim();
  const errEl = document.getElementById('login-error');
  const btn   = document.getElementById('btn-login');

  errEl.style.display = 'none';
  if (!email || !pass) {
    errEl.textContent = 'Veuillez remplir tous les champs.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Connexion…';

  const { data, error } = await db.auth.signInWithPassword({ email, password: pass });

  btn.disabled = false;
  btn.textContent = 'Se connecter';

  if (error) {
    errEl.textContent = 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
    errEl.style.display = 'block';
    return;
  }

  currentUser = data.user;
  // Le rôle est stocké dans les métadonnées utilisateur (défini à la création du compte)
  currentRole = data.user.user_metadata?.role || 'secretaire';
  launchApp();
}

async function logout() {
  await db.auth.signOut();
  currentUser = null;
  currentRole = null;
  document.getElementById('app-shell').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
}

// Vérifie si une session existe déjà au chargement
async function checkSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    currentRole = session.user.user_metadata?.role || 'secretaire';
    launchApp();
  }
}
