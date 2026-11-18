// Connexion réelle via Supabase : e-mail + mot de passe, et Google.
// Expose window.flexlocAuth. Tient à jour le drapeau local "flexloc_connecte" (utilisé par nav.js pour l'affichage).
(function () {
  var CLE = 'flexloc_connecte';
  var cfg = window.FLEXLOC_SUPABASE || {};
  var configure = !!(cfg.url && cfg.anonKey);
  var client = null;

  function drapeau(actif) {
    try { if (actif) localStorage.setItem(CLE, '1'); else localStorage.removeItem(CLE); } catch (e) {}
  }
  function prevenir() { window.dispatchEvent(new Event('flexloc-auth')); }

  var api = window.flexlocAuth = { configure: configure };

  if (!configure) { drapeau(false); return; }

  function charger() {
    return new Promise(function (ok, ko) {
      if (window.supabase) return ok();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      s.onload = function () { ok(); };
      s.onerror = function () { ko(new Error('Impossible de charger la connexion (réseau).')); };
      document.head.appendChild(s);
    });
  }

  var pret = charger().then(function () {
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
    client.auth.onAuthStateChange(function (evt, session) {
      var avant = localStorage.getItem(CLE) === '1';
      drapeau(!!session);
      if (avant !== !!session) prevenir();
    });
    return client.auth.getSession().then(function (r) {
      var connecte = !!(r.data && r.data.session);
      var avant = localStorage.getItem(CLE) === '1';
      drapeau(connecte);
      if (avant !== connecte) prevenir();
      return client;
    });
  });

  function page(nom) { return new URL(nom, location.href).href; }

  function traduire(err) {
    var m = (err && err.message) || 'Une erreur est survenue.';
    if (/invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
    if (/email not confirmed/i.test(m)) return 'Confirme d\'abord ton e-mail (regarde ta boîte de réception).';
    if (/already registered|already been registered/i.test(m)) return 'Un compte existe déjà avec cet e-mail : connecte-toi.';
    if (/password should be at least/i.test(m)) return 'Choisis un mot de passe d\'au moins 6 caractères.';
    if (/rate limit/i.test(m)) return 'Trop de tentatives, réessaie dans quelques minutes.';
    return m;
  }

  api.google = function () {
    return pret.then(function (c) {
      return c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: page('offre.html') } });
    }).then(function (r) { return r.error ? { erreur: traduire(r.error) } : { ok: true }; })
      .catch(function (e) { return { erreur: traduire(e) }; });
  };

  api.connexion = function (email, mdp) {
    return pret.then(function (c) { return c.auth.signInWithPassword({ email: email, password: mdp }); })
      .then(function (r) { return r.error ? { erreur: traduire(r.error) } : { ok: true }; })
      .catch(function (e) { return { erreur: traduire(e) }; });
  };

  api.inscription = function (email, mdp) {
    return pret.then(function (c) {
      return c.auth.signUp({ email: email, password: mdp, options: { emailRedirectTo: page('offre.html') } });
    }).then(function (r) {
      if (r.error) return { erreur: traduire(r.error) };
      if (!r.data.session) return { info: 'Compte créé. Clique sur le lien reçu par e-mail pour le confirmer, puis reviens te connecter.' };
      return { ok: true };
    }).catch(function (e) { return { erreur: traduire(e) }; });
  };

  api.deconnexion = function () {
    return pret.then(function (c) { return c.auth.signOut(); })
      .then(function () { drapeau(false); prevenir(); })
      .catch(function () { drapeau(false); prevenir(); });
  };
})();
