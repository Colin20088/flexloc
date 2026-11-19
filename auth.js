// Connexion réelle via Supabase : e-mail + mot de passe, et Google.
// Expose window.flexlocAuth. Tient à jour le drapeau local "flexloc_connecte" (utilisé par nav.js pour l'affichage).
(function () {
  var CLE = 'flexloc_connecte';
  var cfg = window.FLEXLOC_SUPABASE || {};
  var configure = !!(cfg.url && cfg.anonKey);
  var client = null;

  function drapeau(actif) {
    try {
      if (actif) localStorage.setItem(CLE, '1');
      else { localStorage.removeItem(CLE); localStorage.removeItem('flexloc_abonne'); }
    } catch (e) {}
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
    // La session est gardée dans le navigateur et renouvelée automatiquement :
    // le visiteur reste connecté tant qu'il ne clique pas sur « Se déconnecter ».
    client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
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

  // Demande au serveur de créer une session de paiement Whop pour la formule choisie (ex. "annuel-promo")
  api.creerPaiement = function (cle, suite, avecPack) {
    return pret.then(function (c) {
      return c.auth.getSession().then(function (r) {
        var session = r.data && r.data.session;
        if (!session) return { erreur: 'Connexion requise.' };
        return fetch(cfg.url + '/functions/v1/creer-paiement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token, apikey: cfg.anonKey },
          body: JSON.stringify({ cle: cle, suite: suite || '', avecPack: !!avecPack })
        }).then(function (rep) {
          return rep.json().catch(function () { return {}; }).then(function (d) {
            if (!rep.ok) return { erreur: d.detail || d.erreur || ('Erreur ' + rep.status) };
            return d;
          });
        });
      });
    }).catch(function (e) { return { erreur: (e && e.message) || 'Erreur réseau.' }; });
  };

  // Achat en 1 clic de « Téléportation illimitée » avec la carte déjà enregistrée (voir supabase/6-fonction-acheter-illimite.ts)
  api.acheterIllimite = function () {
    return pret.then(function (c) {
      return c.auth.getSession().then(function (r) {
        var session = r.data && r.data.session;
        if (!session) return { statut: 'echec', detail: 'Connexion requise.' };
        return fetch(cfg.url + '/functions/v1/acheter-illimite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token, apikey: cfg.anonKey },
          body: '{}'
        }).then(function (rep) {
          return rep.json().catch(function () { return {}; }).then(function (d) { return d && d.statut ? d : { statut: 'echec', detail: 'Erreur ' + rep.status }; });
        });
      });
    }).catch(function (e) { return { statut: 'echec', detail: (e && e.message) || 'Erreur réseau.' }; });
  };
  // E-mail du compte connecté (null si personne n'est connecté)
  api.email = function () {
    return pret.then(function (c) { return c.auth.getSession(); })
      .then(function (r) { return r.data && r.data.session ? r.data.session.user.email : null; })
      .catch(function () { return null; });
  };

  // Infos du compte connecté + ses abonnements (la base ne renvoie que les lignes de cet e-mail)
  api.espace = function () {
    return pret.then(function (c) {
      return c.auth.getSession().then(function (r) {
        var session = r.data && r.data.session;
        if (!session) return { connecte: false };
        return c.from('abonnements')
          .select('membership_id, offre, status, current_period_end, cancel_at_period_end, manage_url, updated_at')
          .order('updated_at', { ascending: false })
          .then(function (res) {
            if (res.error) return { connecte: true, email: session.user.email, erreur: res.error.message };
            return { connecte: true, email: session.user.email, abonnements: res.data || [] };
          });
      });
    }).catch(function (e) { return { connecte: false, erreur: traduire(e) }; });
  };

  // Abonnement actif (hors Pack voyageur) ? Même règle que « Mon espace » : en cours, ou résilié mais payé jusqu'à la fin.
  api.estActif = function (a) {
    return !!a && a.offre !== 'pack' && a.offre !== 'illimite' && (a.status === 'active' || a.status === 'trialing' ||
      (a.cancel_at_period_end && a.current_period_end && new Date(a.current_period_end) > new Date()));
  };

  // Mémorise « cet utilisateur est abonné » pour que toutes les pages s'adaptent (plus d'offres affichées)
  pret.then(function () { return api.espace(); }).then(function (r) {
    if (!r || !r.connecte || r.erreur) return;
    var actif = (r.abonnements || []).some(api.estActif);
    var avant = localStorage.getItem('flexloc_abonne') === '1';
    try { if (actif) localStorage.setItem('flexloc_abonne', '1'); else localStorage.removeItem('flexloc_abonne'); } catch (e) {}
    if (avant !== actif) window.dispatchEvent(new Event('flexloc-abonne'));
  }).catch(function () {});

  api.deconnexion = function () {
    return pret.then(function (c) { return c.auth.signOut(); })
      .then(function () { drapeau(false); prevenir(); })
      .catch(function () { drapeau(false); prevenir(); });
  };
})();
