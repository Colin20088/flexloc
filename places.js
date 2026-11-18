// Nombre de places affiché sur le site.
// 7 à la première visite ; si le visiteur quitte le site puis revient sans avoir d'abonnement, il passe à 4.
// Un abonné (localStorage "flexloc_abonne" = "1") garde le nombre actuel, sans changement.
(function () {
  var PLEINES = 7, REDUITES = 4, ABSENCE_MS = 10 * 60 * 1000;
  var CLE_PLACES = 'flexloc_places', CLE_VU = 'flexloc_derniere_visite', CLE_SESSION = 'flexloc_session', CLE_ABONNE = 'flexloc_abonne';

  function lire(stock, cle) { try { return stock.getItem(cle); } catch (e) { return null; } }
  function ecrire(stock, cle, val) { try { stock.setItem(cle, val); } catch (e) {} }

  var maintenant = Date.now();
  var places = parseInt(lire(localStorage, CLE_PLACES), 10) || PLEINES;
  var abonne = lire(localStorage, CLE_ABONNE) === '1';

  if (!abonne) {
    var derniere = parseInt(lire(localStorage, CLE_VU), 10);
    var nouvelleSession = !lire(sessionStorage, CLE_SESSION);
    // Retour sur le site : nouvelle session (onglet fermé puis rouvert) ou absence de plus de 10 minutes
    var retour = derniere && (nouvelleSession || (maintenant - derniere) > ABSENCE_MS);
    if (retour) { places = REDUITES; ecrire(localStorage, CLE_PLACES, String(places)); }
  }
  ecrire(sessionStorage, CLE_SESSION, '1');
  ecrire(localStorage, CLE_VU, String(maintenant));

  function afficher() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-places]'), function (el) { el.textContent = places; });
  }
  function ping() { ecrire(localStorage, CLE_VU, String(Date.now())); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afficher); else afficher();
  window.addEventListener('pagehide', ping);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') ping(); });
})();
