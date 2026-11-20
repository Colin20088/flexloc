// Adapte les pages pour un abonné : on ne lui propose plus de s'abonner.
// (l'état « abonné » est tenu à jour par auth.js dans localStorage "flexloc_abonne")
// Il change de formule uniquement depuis « Mon espace » (bouton « Changer de formule »).
(function () {
  function abonne() { try { return localStorage.getItem('flexloc_abonne') === '1'; } catch (e) { return false; } }

  function appliquer() {
    if (!abonne()) return;
    document.documentElement.classList.add('abonne');

    if (!document.getElementById('style-abonne')) {
      var s = document.createElement('style'); s.id = 'style-abonne';
      s.textContent = '.abonne .places { display: none !important; }';
      document.head.appendChild(s);
    }

    // Les boutons de la page d'accueil mènent au même parcours que la version gratuite (choix de la destination),
    // jamais à la page des offres : l'abonné n'a pas à se réabonner. Le parcours s'arrête à l'étape 2 (voir destination.html).
    Array.prototype.forEach.call(document.querySelectorAll('a.btn[href="offre.html"]'), function (a) {
      if (a.closest('.suite') || a.closest('.secours') || a.closest('.formule')) return;
      a.setAttribute('href', 'teleportation.html');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', appliquer); else appliquer();
  window.addEventListener('flexloc-abonne', appliquer);
})();
