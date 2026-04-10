# Crypto Portfolio Tracker

Mini-projet web de 4ᵉ année FinTech — ESILV 2026.

Application web permettant à un utilisateur authentifié de suivre son
portefeuille de cryptomonnaies : ajouter ses positions (symbole, quantité,
prix d'achat), voir la **valeur actuelle** de chaque position grâce à l'API
publique CoinGecko, et consulter son **profit / perte** global et par
ligne, rafraîchi automatiquement toutes les 60 secondes.

> **Sujet choisi** : option 3 — *Gestionnaire de portefeuille crypto*.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
  - [1. Prérequis](#1-prérequis)
  - [2. Installation](#2-installation)
  - [3. Configuration des variables d'environnement](#3-configuration-des-variables-denvironnement)
  - [4. Lancer le backend (serveur)](#4-lancer-le-backend-serveur)
  - [5. Lancer le frontend (client)](#5-lancer-le-frontend-client)
  - [6. Lancer les deux en parallèle](#6-lancer-les-deux-en-parallèle)
- [Tests](#tests)
- [API REST](#api-rest)
- [Évaluation](#évaluation)

## Fonctionnalités

- **Authentification** complète : inscription, validation par email (avec
  fallback dev qui retourne le token directement dans la réponse), connexion
  via JWT dans un cookie `httpOnly`, déconnexion
- **CRUD** sur les positions (GET, POST, PUT, DELETE)
- **Prix temps réel** via l'API publique CoinGecko (pas d'API key requise)
- **Cache TTL 60 s** côté backend pour éviter le rate-limit de CoinGecko
- **Dashboard** : liste, valeur totale, coût total, profit/perte absolu et en %,
  rafraîchissement automatique toutes les 60 s
- **Formulaire** d'ajout/édition avec **raccourcis** pour les 10 cryptos les
  plus courantes (BTC, ETH, SOL, ADA, DOT, MATIC, AVAX, LINK, XRP, DOGE)
- **Guards de route** côté Vue Router : redirection auto vers `/login` si non
  authentifié, vers `/` si déjà connecté
- **Scoping par utilisateur** côté backend : chaque utilisateur ne voit et ne
  modifie que ses propres positions

## Stack technique

| Couche       | Technologies                                                 |
| ------------ | ------------------------------------------------------------ |
| Frontend     | Vue 3, Vite, Vue Router, Pinia, Vitest                       |
| Backend      | Node.js 24, Fastify 5, Mongoose, JWT, Nodemailer             |
| Base         | MongoDB (Atlas en prod, Docker ou Atlas en dev)              |
| API externe  | CoinGecko (prix temps réel)                                  |
| Monorepo     | npm workspaces + Turborepo                                   |
| Lint         | ESLint (config `antfu`), Oxlint, Oxfmt                       |
| Déploiement  | Netlify (front), Render (back), MongoDB Atlas (DB)           |

## Architecture

```
crypto-portfolio-webdev/
├── client/                     # Vue 3 + Vite (frontend)
│   ├── src/
│   │   ├── views/              # LoginView, RegisterView, DashboardView, HoldingFormView
│   │   ├── stores/             # auth.js, portfolio.js (Pinia)
│   │   ├── services/           # api.js (wrapper fetch + ApiError)
│   │   ├── router/             # index.js (routes + guards)
│   │   ├── App.vue             # layout principal + navbar
│   │   └── main.js
│   ├── netlify.toml            # config de déploiement Netlify
│   └── vite.config.js
│
├── server/                     # Fastify + Mongoose (backend)
│   ├── src/
│   │   ├── users/              # auth-routes, users-routes, user-schema
│   │   ├── holdings/           # holdings-routes, holding-schema
│   │   ├── portfolio/          # portfolio-routes (endpoint /summary)
│   │   ├── services/           # mailer.js, price-service.js (CoinGecko + cache)
│   │   ├── plugins/            # auth.js, cors.js, mongoose.js
│   │   ├── utils/              # crypto.js (bcrypt)
│   │   ├── app.js              # build de l'instance Fastify
│   │   ├── config.js           # lecture + validation des env vars
│   │   └── index.js            # point d'entrée (start)
│   ├── tests/                  # tests unitaires Vitest
│   └── .env-example
│
├── mongo-init/                 # script d'init Mongo (local docker uniquement)
├── docker-compose.yml          # MongoDB local sur le port 35115
├── render.yaml                 # blueprint Render (pour déployer l'API)
├── turbo.json                  # orchestration monorepo
└── package.json                # racine du monorepo (workspaces npm)
```

## Démarrage rapide

### 1. Prérequis

- **Node.js 24+** — vérifier avec `node -v`
- **npm 11+** — livré avec Node 24
- **Un cluster MongoDB Atlas** (gratuit, plan M0) — OU **Docker Desktop** si
  vous préfèrez un Mongo local (voir section suivante)
- Git et un terminal (sur Windows, **Git Bash** recommandé)

### 2. Installation

Cloner le repo puis installer toutes les dépendances depuis la racine :

```bash
git clone https://github.com/frytegg/crypto-portfolio-web-dev.git
cd crypto-portfolio-web-dev
npm install
```

L'installation depuis la racine installe automatiquement les dépendances des
workspaces `client` et `server` grâce aux **npm workspaces**.

### 3. Configuration des variables d'environnement

**Backend** — copier le template et le remplir :

```bash
cp server/.env-example server/.env.development.local
```

Puis ouvrir `server/.env.development.local` et renseigner **au minimum** :

- `MONGODB_URI` — voir les deux options ci-dessous
- `JWT_SECRET` — une longue chaîne aléatoire (générer avec
  `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

Le fichier est **auto-documenté** : chaque variable a un commentaire qui
explique à quoi elle sert, son format, et ses valeurs par défaut.

**Frontend** — copier le template :

```bash
cp client/.env.example client/.env.development.local
```

La seule variable est `VITE_API_BASE_URL`. Par défaut elle pointe sur
`http://localhost:3000` — ne change la valeur que si tu lances le backend sur
un autre port.

#### Option A — MongoDB Atlas (recommandée)

1. Créer un compte gratuit sur [cloud.mongodb.com](https://cloud.mongodb.com)
2. Créer un cluster **M0 Free Tier** (AWS, région la plus proche)
3. **Database Access** → "Add New Database User" → créer un user avec le
   rôle `readWrite` sur la base `crypto_portfolio`
4. **Network Access** → "Add IP Address" → ajouter ton IP actuelle (ou
   `0.0.0.0/0` en dev uniquement)
5. **Connect → Drivers → Node.js** → copier la connection string
6. Coller dans `MONGODB_URI`, remplacer `<password>` par le vrai mot de
   passe (URL-encoder les caractères spéciaux : `*` → `%2A`, `@` → `%40`,
   etc.), et ajouter `/crypto_portfolio` avant le `?` pour préciser la base

Exemple final :
```
MONGODB_URI=mongodb+srv://user:Password%2A@cluster0.abcde.mongodb.net/crypto_portfolio?retryWrites=true&w=majority
```

#### Option B — MongoDB local via Docker (offline)

1. Lancer Docker Desktop
2. Depuis la racine du repo :
   ```bash
   docker compose up -d
   ```
3. Dans `server/.env.development.local`, mettre :
   ```
   MONGODB_URI=mongodb://crypto_app:dev_password_2026@localhost:35115/crypto_portfolio?authSource=crypto_portfolio
   ```

Le user applicatif `crypto_app` est créé automatiquement par
`mongo-init/init.js` au premier démarrage du container.

### 4. Lancer le backend (serveur)

Depuis le dossier `server/` :

```bash
cd server
npm run dev
```

Le serveur démarre sur `http://localhost:3000` (ou le port défini dans
`PORT`). Les logs affichent la connexion Mongo puis l'URL d'écoute :

```
[HH:MM:SS UTC] INFO: Connecting to MongoDB...
[HH:MM:SS UTC] INFO: Connected to MongoDB
[HH:MM:SS UTC] INFO: Server listening at http://127.0.0.1:3000
```

Tu peux tester rapidement avec :
```bash
curl http://localhost:3000/
# {"hello":"world"}
```

Le serveur se recharge automatiquement à chaque changement grâce à
`nodemon` (configuré dans `server/nodemon.json`).

### 5. Lancer le frontend (client)

Depuis le dossier `client/` (dans un **autre terminal**) :

```bash
cd client
npm run dev
```

Vite démarre sur `http://localhost:5173`. Ouvre l'URL dans ton navigateur :
tu arrives sur la page de login, d'où tu peux créer un compte et commencer
à ajouter des positions.

### 6. Lancer les deux en parallèle

Pour lancer front + back en une seule commande depuis la racine :

```bash
npm run dev
```

Cette commande utilise **Turborepo** pour exécuter `npm run dev` dans chaque
workspace en parallèle. C'est l'équivalent des étapes 4 et 5 combinées.

## Tests

**Backend** (tests unitaires de la validation des holdings) :
```bash
cd server
npm test
```

**Frontend** (tests unitaires du store Pinia `portfolio`) :
```bash
cd client
npx vitest run
```

## API REST

Toutes les routes renvoient du JSON. Les routes protégées vérifient le JWT
stocké dans le cookie `token`. Le JWT est posé automatiquement par
`POST /auth/login` et effacé par `POST /auth/logout`.

### Auth

| Méthode | Route                              | Auth | Description                           |
| ------- | ---------------------------------- | ---- | ------------------------------------- |
| POST    | `/auth/register`                   | ✗    | Inscription (envoie l'email de validation) |
| POST    | `/auth/login`                      | ✗    | Connexion (pose le cookie JWT)        |
| POST    | `/auth/logout`                     | ✗    | Déconnexion (efface le cookie)        |
| POST    | `/auth/resend-verification-email`  | ✗    | Renvoi de l'email de validation       |

### Users

| Méthode | Route                              | Auth | Description                          |
| ------- | ---------------------------------- | ---- | ------------------------------------ |
| GET     | `/users/verify-email?token=…`      | ✗    | Valider un compte via le token       |
| GET     | `/users/me`                        | ✓    | L'utilisateur connecté               |
| GET     | `/users`                           | ✓    | Liste paginée (`?page`, `?pageSize`, `?search`) |
| GET     | `/users/:id`                       | ✓    | Détail d'un utilisateur              |
| DELETE  | `/users/:id`                       | ✓    | Supprimer son propre compte          |

### Holdings (positions crypto)

| Méthode | Route               | Auth | Description                          |
| ------- | ------------------- | ---- | ------------------------------------ |
| GET     | `/holdings`         | ✓    | Liste des positions de l'utilisateur |
| GET     | `/holdings/:id`     | ✓    | Détail d'une position                |
| POST    | `/holdings`         | ✓    | Créer une position                   |
| PUT     | `/holdings/:id`     | ✓    | Modifier une position                |
| DELETE  | `/holdings/:id`     | ✓    | Supprimer une position               |

### Portfolio

| Méthode | Route                   | Auth | Description                           |
| ------- | ----------------------- | ---- | ------------------------------------- |
| GET     | `/portfolio/summary`    | ✓    | Positions enrichies + totaux (P&L)    |

Exemple de réponse `GET /portfolio/summary` :

```json
{
  "items": [
    {
      "id": "69da6e096686b9d447c93a7b",
      "symbol": "BTC",
      "coingeckoId": "bitcoin",
      "quantity": 0.5,
      "purchasePrice": 40000,
      "currentPrice": 72804,
      "cost": 20000,
      "value": 36402,
      "profit": 16402,
      "profitPercent": 82.01
    }
  ],
  "totals": {
    "totalCost": 24000,
    "totalValue": 40897.6,
    "totalProfit": 16897.6,
    "totalProfitPercent": 70.4,
    "pricedAt": "2026-04-11T15:51:38.355Z"
  }
}
```

## Évaluation

Rappel des critères (fournis dans les consignes) :

| Critère                             | Points |
| ----------------------------------- | ------ |
| Application fonctionnelle           | 8      |
| Utilisation de Vue.js               | 4      |
| Backend Fastify                     | 4      |
| Interaction avec la base de données | 2      |
| Qualité du code / organisation      | 2      |
| **Total**                           | **20** |

## Auteurs

- **Alexandre Lemiere** — [@frytegg](https://github.com/frytegg)
- **Andrea Gonzalez** — [@andreagnzz](https://github.com/andreagnzz)
