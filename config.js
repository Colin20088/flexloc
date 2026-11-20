// Configuration de la connexion (Supabase).
// Ces deux valeurs sont PUBLIQUES (elles se trouvent dans Supabase > Project Settings > API) :
//   url     = "Project URL"        ex. https://abcdxyz.supabase.co
//   anonKey = "anon public key"    (jamais la clé "service_role" !)
window.FLEXLOC_SUPABASE = {
  url: 'https://wjabuoactqcnajscokru.supabase.co',
  anonKey: 'sb_publishable_uLEZWJEH8MaNB9k1sCBdbA_vlfBVN2l',
  // Adresse de l'app de changement de position (à remplacer par l'adresse définitive une fois l'app déployée)
  // Identifiant (plan_...) de l'offre « Téléportation illimitée 5,90 € » créée chez Whop. Vide = bouton « Bientôt disponible ».
  planIllimite: 'plan_LJoOp4Eu6ImES',
  // Identifiant (plan_...) de l'offre « Indétectable 15,90 €/mois » créée chez Whop. Vide = le bouton affiche « Bientôt disponible ».
  planIndetectable: 'plan_90YZ3eD1Zn6ox',
  appUrl: 'https://mock-location-map--9gkk6x9d.preview.emergentagent.com'
};
