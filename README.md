# Immo-MyKajy 🏡

Plateforme immobilière SaaS permettant de publier, rechercher, louer et vendre des biens immobiliers.

## Stack Technique

### Backend
- **NestJS** + TypeScript
- **Prisma ORM** + PostgreSQL
- **JWT** Auth (Passport.js)
- **Swagger/OpenAPI** (`/api-docs`)
- **Jest** pour les tests
- **Docker** pour les services

### Frontend
- **React 19** + TypeScript
- **Vite 8**
- **Tailwind CSS v4** + **shadcn/ui**
- **React Router v7**
- **TanStack Query v5**
- **React Hook Form** + **Zod**
- **Axios**

## Structure du Projet

```
/location-mykajy
  /backend      ← API NestJS
  /frontend     ← Application React
  /docker       ← Configuration Docker
  /docs         ← Documentation
  docker-compose.yml
```

## Démarrage Rapide

### Prérequis
- Node.js 20+
- PostgreSQL 15
- Docker (optionnel)

### 1. Base de données avec Docker
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Editez .env avec vos variables de configuration
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

L'API sera disponible sur `http://localhost:3000/api/v1`  
La documentation Swagger sur `http://localhost:3000/api-docs`

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Le frontend sera disponible sur `http://localhost:5173`

## Comptes de Test (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@mykajy.local | password123 |
| Agent | agent@mykajy.local | password123 |
| Propriétaire | owner@mykajy.local | password123 |
| Client | client@mykajy.local | password123 |

## Modules Fonctionnels

- ✅ **Authentification** — JWT, RBAC, Inscription/Connexion
- ✅ **Base de données** — Prisma, migrations, seed
- ✅ **Catalogue** — Propriétés, annonces (Location/Vente)
- 🔄 **Recherche avancée** — Filtres, pagination, tri
- 📅 **Visites** — Demande et planification
- ❤️ **Favoris** — Gestion des annonces favorites
- 💬 **Messagerie** — Chat interne
- 📄 **Contrats** — Location et vente
- 💳 **Paiements** — Suivi et facturation
- 🔔 **Notifications** — Alertes en temps réel

## Documentation API

La documentation Swagger complète est disponible à :
```
http://localhost:3000/api-docs
```
