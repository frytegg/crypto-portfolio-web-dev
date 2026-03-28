# WebDev ESILV Starter

Starter de projet pour les étudiants de 4e année FinTech.

Le dépôt est volontairement incomplet : il fournit une base de travail, une structure de monorepo, un front et un back séparés, mais il reste du travail d’implémentation. Le minimum attendu est d’implémenter tout ce qui est indiqué dans les `TODO` du projet.

## Architecture

Ce projet suit une architecture de monorepo :

- `client/` contient l’application front-end
- `server/` contient l’application back-end
- `package.json` à la racine déclare les workspaces npm
- `turbo.json` configure Turborepo pour orchestrer les scripts du monorepo

### Monorepo

Le dépôt utilise les [**npm workspaces**](https://docs.npmjs.com/cli/v7/using-npm/workspaces?v=true) pour gérer plusieurs applications dans un seul repository. Cela permet notamment :

- d’installer les dépendances depuis la racine
- de lancer les scripts des sous-projets depuis un point central
- de garder une structure claire entre front et back

### Workspaces npm

Les workspaces déclarés à la racine sont :

- `client`
- `server`

Les dépendances de chaque application restent isolées dans leur propre [`package.json`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json), tandis que la racine pilote l’ensemble du dépôt.

### Turborepo

Le projet utilise [**Turborepo**](https://turborepo.dev/) pour orchestrer les tâches du monorepo.

Exemple :

```bash
npm run dev
```

Cette commande exécute :

```bash
turbo run dev --parallel
```

Autrement dit, les scripts `dev` des workspaces sont lancés en parallèle.

## Applications

### Front-end : `client/`

L’application front est basée sur :

- [**Vue 3**](https://vuejs.org/) (version beta dans ce starter)
- [**Vite**](https://vite.dev/) pour le bundling et le serveur de développement
- [**Vue Router**](https://router.vuejs.org/) pour le routage
- [**Pinia**](https://pinia.vuejs.org/) pour la gestion d’état
- [**Vitest**](https://vitest.dev/) pour les tests unitaires
- [**Playwright**](https://playwright.dev/) pour les tests end-to-end
- [**ESLint**](https://eslint.org/), [**Oxlint**](https://oxc.rs/docs/guide/usage/linter) et [**Oxfmt**](https://oxc.rs/blog/2026-02-24-oxfmt-beta) pour la qualité et le formatage

### Back-end : `server/`

L’application back est actuellement basée sur :

- [**Node.js**](https://nodejs.org/fr)
- [**Fastify**](https://fastify.dev/) pour construire l’API HTTP

Le serveur est lancé en mode développement avec :

```bash
node --watch src/index.js
```

Le back est conçu pour être enrichi pendant le projet : routes, logique métier, persistance, authentification, validation, gestion d’erreurs, etc.

## Prérequis

Prérequits recommandés :

- **Node.js 24 ou plus récent**
- **npm** compatible avec la version de Node installée

Pourquoi Node 24+ :

- pour travailler avec une version moderne et homogène sur tout le projet
- pour éviter les écarts d’environnement entre machines
- pour bénéficier d’un runtime récent côté front comme côté back

Vérification :

```bash
node -v
npm -v
```

## Installation

Depuis la racine du projet :

```bash
npm install
```

Cette commande installe les dépendances du monorepo et des workspaces.

## Lancement en développement

Depuis la racine :

```bash
npm run dev
```

Cela lance les applications `client` et `server` en parallèle via Turborepo.

Il est aussi possible de lancer une application individuellement depuis son dossier :

```bash
cd client
npm run dev
```

```bash
cd server
npm run dev
```

## Ce qui est attendu

Ce dépôt est un **starter**, pas une application terminée.

Vous devez au minimum :

- créer et remplir le fichier .env.development.local à partir de .env-example
- implémenter tout ce qui est marqué `TODO`
- compléter les routes, contrôleurs et services manquants
- finaliser la logique métier côté back-end
- structurer proprement les échanges entre front et back
- ajouter les validations nécessaires
- gérer correctement les erreurs
- tester les comportements importants
- modifier ce README.md pour enlever les instructions et ne garder que de la documentation de ce qui aura été fait

Selon les consignes du module, vous pourrez aussi être amenés à :

- implémenter l’authentification et l’autorisation
- sécuriser les flux applicatifs
- documenter vos choix techniques

## Conseils de travail

- Travaillez par petites étapes validées.
- Ne laissez pas les `TODO` s’accumuler jusqu’à la fin.
- Gardez une séparation claire entre front (`client`) et back (`server`).
- Faites évoluer le projet de manière cohérente avec la structure du monorepo.

## Structure du dépôt

```text
.
├── client/            # application front-end
├── server/            # application back-end
├── mongo-init/        # fichier de démarrage du conteneur mongodb (optionnel)
├── .github/           # configuration pour copilot (et éventuellement plus tard pour les GHA)
├── .vscode/           # configuration VSCode spécifique à ce projet
├── package.json       # racine du monorepo
├── eslint.config.mjs  # configuration du linter
├── CLAUDE.md          # instructions spécifiques pour Claude Code (inclus les fichiers de copilote)
├── AGENTS.md          # instructions spécifiques pour d’autres agents IA (inclus les fichiers de copilote)
├── .editorconfig      # configuration basique des fichiers pour l’éditeur
└── turbo.json         # orchestration des tâches
```
