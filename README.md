# Objely Admin

Portail d'administration d'Objely — application Next.js séparée de l'app principale, avec sa propre page de connexion, déployée indépendamment sur Vercel (`objely-admi.vercel.app`).

Elle lit et écrit dans le **même projet Supabase** que l'app principale, mais uniquement via la clé `service_role` côté serveur (jamais exposée au navigateur), ce qui lui permet de voir toutes les données (utilisateurs, objets, correspondances, support...) sans être limitée par les policies RLS pensées pour les utilisateurs finaux.

## Authentification

Les comptes admin sont stockés dans une table dédiée `admin_users` (voir la migration `20260920120000_admin_users.sql` dans le repo principal `objely`), complètement séparée des comptes utilisateurs de l'app. Aucune policy RLS n'autorise `anon`/`authenticated` à la lire — elle n'est accessible que via la clé de service.

La session admin est un JWT signé (HS256, `jose`) stocké dans un cookie `httpOnly` (`ADMIN_SESSION_SECRET`), vérifié dans `src/proxy.ts` (middleware Next 16) sur toutes les pages sauf `/login`.

### Créer / réinitialiser un compte admin

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
(async () => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const password_hash = await bcrypt.hash('un-mot-de-passe-fort', 12);
  await supabase.from('admin_users').upsert(
    { email: 'nouvel.admin@objely.com', password_hash, full_name: 'Nom Complet', role: 'admin' },
    { onConflict: 'email' }
  );
  console.log('ok');
})();
"
```

## Pages

- `/login` — connexion admin (séparée de l'app principale)
- `/` — tableau de bord (métriques temps réel, activité récente)
- `/utilisateurs` — liste des utilisateurs, suspension/réactivation de compte
- `/correspondances` — correspondances IA détectées, confirmation/rejet
- `/service-client` — conversations de support, réponse en tant qu'admin
- `/signalements` — signalements utilisateurs, marquage comme résolu
- `/parametres` — changement de son propre mot de passe admin

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

## Variables d'environnement

Voir `.env.example`. `SUPABASE_SECRET_KEY` et `ADMIN_SESSION_SECRET` sont des secrets serveur — à ne jamais préfixer `NEXT_PUBLIC_`.

## Déploiement

Déployé sur Vercel comme projet indépendant de l'app principale, avec ses propres variables d'environnement (mêmes `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SECRET_KEY` que l'app Objely, plus son propre `ADMIN_SESSION_SECRET`).
