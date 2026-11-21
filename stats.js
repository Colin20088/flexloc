// Statistiques de fréquentation (anonymes) : visiteurs, présence en ligne, destinations choisies.
// Chaque navigateur reçoit un identifiant aléatoire ; aucun e-mail ni donnée personnelle n'est envoyé.
// Lecture réservée à l'administrateur : voir admin.html et supabase/8-statistiques.sql.
(function () {
  var cfg = window.FLEXLOC_SUPABASE || {};
  if (!cfg.url || !cfg.anonKey) return;

  var nom = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
  if (nom === 'admin') return;                                       // la page admin ne compte pas
  try { if (localStorage.getItem('flexloc_no_stats') === '1') return; } catch (e) {}   // « ne pas compter mes visites »

  var id = null;
  try { id = localStorage.getItem('flexloc_vid'); } catch (e) {}
  if (!id) {
    var a = new Uint8Array(12);
    try { (window.crypto || window.msCrypto).getRandomValues(a); } catch (e) { for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); }
    id = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    try { localStorage.setItem('flexloc_vid', id); } catch (e) {}
  }

  function envoyer(type, destination) {
    try {
      fetch(cfg.url + '/rest/v1/rpc/enregistrer_visite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey },
        body: JSON.stringify({ p_visiteur: id, p_page: nom, p_type: type, p_destination: destination || null }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  envoyer('vue');

  // Destination choisie : comptée une seule fois par session et par ville
  if (nom === 'destination') {
    var ville = '';
    try { ville = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    if (!ville) { try { ville = sessionStorage.getItem('ville') || ''; } catch (e) {} }
    ville = (ville || '').trim();
    if (ville) {
      var cle = 'flexloc_dest_' + ville.toLowerCase(), deja = false;
      try { deja = sessionStorage.getItem(cle) === '1'; sessionStorage.setItem(cle, '1'); } catch (e) {}
      if (!deja) envoyer('destination', ville);
    }
  }

  // « En ligne » : un signal toutes les 45 s tant que la page est visible
  setInterval(function () { if (document.visibilityState === 'visible') envoyer('ping'); }, 45000);
})();
