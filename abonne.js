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
      s.textContent = '.abonne .places, .abonne .globe-cta { display: none !important; }';
      document.head.appendChild(s);
    }

    // Tous les boutons qui menaient au choix d'une destination / d'une formule mènent à « Mon espace »
    Array.prototype.forEach.call(document.querySelectorAll('a.btn[href="teleportation.html"], a.btn[href="offre.html"]'), function (a) {
      if (a.closest('.suite') || a.closest('.secours') || a.closest('.formule')) return;
      a.setAttribute('href', 'espace.html');
      a.textContent = 'Mon espace';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', appliquer); else appliquer();
  window.addEventListener('flexloc-abonne', appliquer);
})();
