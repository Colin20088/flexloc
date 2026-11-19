// Barre de navigation : quand le visiteur est connecté, "Connexion" est remplacé par "Mon espace" + "Se déconnecter".
// L'état vient de auth.js (drapeau localStorage "flexloc_connecte", tenu à jour avec la vraie session Supabase).
(function () {
  var CLE = 'flexloc_connecte';
  var original = null, css = null;
  function lire() { try { return localStorage.getItem(CLE) === '1'; } catch (e) { return false; } }

  function afficher() {
    var ul = document.querySelector('nav .nav-links');
    if (!ul) return;
    if (original === null) original = ul.innerHTML;

    if (!lire()) {                       // visiteur non connecté : bouton d'origine
      ul.classList.remove('connecte');
      ul.innerHTML = original;
      return;
    }

    if (!css) {
      css = document.createElement('style');
      css.textContent =
        'nav .nav-links.connecte { gap: 4px; }' +
        'nav .nav-links.connecte li { display: list-item !important; white-space: nowrap; }' +
        'nav .nav-links.connecte a.lien-espace { color: #fff; font-weight: 600; font-size: .78rem; padding: 7px 6px; border-radius: 999px; }' +
        'nav .nav-links.connecte button.nav-cta { border: 0; font: inherit; font-size: .78rem; font-weight: 600; cursor: pointer; background: #fff; color: #000; padding: 7px 11px; border-radius: 999px; white-space: nowrap; }' +
        '@media (max-width: 640px) { nav .logo { font-size: 1.15rem; gap: 8px; } nav .logo svg { width: 34px; height: 34px; } nav .nav-inner { padding: 0 14px; gap: 10px; } }' +
        '@media (min-width: 641px) { nav .nav-links.connecte { gap: 16px; } nav .nav-links.connecte a.lien-espace, nav .nav-links.connecte button.nav-cta { font-size: .95rem; } nav .nav-links.connecte button.nav-cta { padding: 8px 18px; } }';
      document.head.appendChild(css);
    }

    ul.classList.add('connecte');
    ul.innerHTML =
      '<li><a href="espace.html" class="lien-espace">Mon espace</a></li>' +
      '<li><button type="button" class="nav-cta" id="deconnexion">Se déconnecter</button></li>';

    document.getElementById('deconnexion').addEventListener('click', function () {
      var fin = function () { try { localStorage.removeItem(CLE); } catch (e) {} location.reload(); };
      if (window.flexlocAuth && window.flexlocAuth.configure) window.flexlocAuth.deconnexion().then(fin); else fin();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afficher); else afficher();
  window.addEventListener('flexloc-auth', afficher);
})();
