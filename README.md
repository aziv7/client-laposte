## Client La Poste — Suivi de carte (Next.js)

Frontend **Next.js (App Router)** + **shadcn/ui** + **Tailwind**.

### Prérequis
- Node.js + npm
- Le backend [`api-laposte`](../api-laposte) en local (par défaut sur `http://localhost:3000`)

#### Créer un admin (backend)
Dans le repo `api-laposte` (Docker) :

```bash
docker compose --env-file env.example exec -T api node dist/scripts/createAdmin.js --username admin --password 'ChangeMe1234'
```

### Configuration
Copiez l’exemple d’environnement (ne pas commiter `.env.local`) :

```bash
cp env.example .env.local
```

### Démarrage
Installer puis lancer le serveur de dev :

```bash
npm install
npm run dev
```

Le frontend démarre en général sur `http://localhost:3001` (car `3000` est utilisé par l’API).

### URLs
- **Public**: `/` (suivi du statut de carte)
- **Admin**: `/admin/login` puis `/admin` (consultation + mise à jour statuts)

### Notes (auth admin)
- Login/refresh/logout utilisent un **cookie httpOnly** (`admin_refresh_token`) : les appels frontend utilisent `credentials: 'include'`.
- Les endpoints admin protégés utilisent `Authorization: Bearer <accessToken>` (stocké **en mémoire**).
- **Même site** requis (cookie `SameSite=Lax`) : en prod, frontend et API doivent être sur le même “site” (même schéma + même domaine registrable).

### Messages d’erreur
Les erreurs API sont affichées via toast et incluent le `requestId` quand disponible.
