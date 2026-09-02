# Architecture API Immo-MyKajy

## Base URL
```
http://localhost:3000/api/v1
```

## Documentation Swagger Interactive
```
http://localhost:3000/api-docs
```

## Authentification
Toutes les routes protégées nécessitent un header :
```
Authorization: Bearer <access_token>
```

## Endpoints Principaux

### Auth
- `POST /auth/register` — Inscription
- `POST /auth/login` — Connexion

### Users
- `GET /users/me` — Profil de l'utilisateur connecté (🔒)

### Properties
- `GET /properties` — Liste des biens
- `POST /properties` — Créer un bien (🔒 OWNER/AGENT)
- `GET /properties/:id` — Détail d'un bien
- `PATCH /properties/:id` — Modifier un bien (🔒 OWNER/AGENT)
- `DELETE /properties/:id` — Supprimer un bien (🔒 ADMIN)

### Listings
- `GET /listings` — Liste des annonces (filtres, pagination)
- `GET /listings/:id` — Détail d'une annonce
- `POST /listings` — Publier une annonce (🔒 OWNER/AGENT)
- `PATCH /listings/:id` — Modifier une annonce (🔒 OWNER/AGENT)

### Favorites
- `GET /favorites` — Mes favoris (🔒)
- `POST /favorites` — Ajouter aux favoris (🔒)
- `DELETE /favorites/:id` — Retirer des favoris (🔒)

### Visits
- `GET /appointments` — Liste des visites (🔒)
- `POST /appointments` — Demander une visite (🔒)
- `PATCH /appointments/:id` — Confirmer / Annuler (🔒 AGENT)

## Enveloppe de Réponse Standard

```json
{
  "statusCode": 200,
  "timestamp": "2026-08-24T10:00:00.000Z",
  "data": { ... }
}
```

## Format d'Erreur Standard

```json
{
  "statusCode": 400,
  "timestamp": "2026-08-24T10:00:00.000Z",
  "path": "/api/v1/listings",
  "message": ["price must be a positive number"]
}
```
