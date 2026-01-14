# API Menu Intelligent - Documentation

Ce document décrit les nouvelles routes API pour gérer le menu intelligent de votre restaurant avec :
- **Plats du jour** : Mettre en avant certains plats pour une journée spécifique
- **Promotions** : Appliquer des réductions temporaires sur des produits (ex: 2000 au lieu de 2250)
- **Recommandations** : Suggérer intelligemment des produits (populaires, nouveautés, choix du chef, etc.)

## 📋 Table des matières

1. [Plats du Jour](#plats-du-jour)
2. [Promotions](#promotions)
3. [Recommandations](#recommandations)
4. [Menu Public](#menu-public)

---

## 🍽️ Plats du Jour

### GET /api/menu/dish-of-day

Récupérer les plats du jour pour une date donnée.

**Query Parameters:**
- `date` (optionnel) - Date au format ISO (défaut: aujourd'hui)

**Exemple:**
```bash
GET /api/menu/dish-of-day
GET /api/menu/dish-of-day?date=2026-01-20
```

**Réponse:**
```json
{
  "dishesOfTheDay": [
    {
      "id": "xxx",
      "productId": "yyy",
      "product": {
        "id": "yyy",
        "name": "Poulet Yassa",
        "price": 2500,
        "image": "...",
        "category": {...}
      },
      "date": "2026-01-13T00:00:00.000Z",
      "displayOrder": 0,
      "specialDescription": "Servi avec riz blanc et salade"
    }
  ]
}
```

### POST /api/menu/dish-of-day

Créer un nouveau plat du jour.

**Body:**
```json
{
  "productId": "product_id",
  "date": "2026-01-20",
  "displayOrder": 0,
  "specialDescription": "Description spéciale pour ce jour (optionnel)"
}
```

**Réponse:** 201 Created

### DELETE /api/menu/dish-of-day?id=xxx

Supprimer un plat du jour.

**Réponse:** 200 OK

---

## 💰 Promotions

### GET /api/menu/promotions

Récupérer les promotions.

**Query Parameters:**
- `filter` (optionnel) - `active` | `all` | `upcoming` | `expired` (défaut: `active`)

**Exemple:**
```bash
GET /api/menu/promotions
GET /api/menu/promotions?filter=all
```

**Réponse:**
```json
{
  "promotions": [
    {
      "id": "xxx",
      "name": "Happy Hour",
      "productId": "yyy",
      "product": {...},
      "discountedPrice": 2000,
      "discountPercent": 11.11,
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-12-31T23:59:59.000Z",
      "daysOfWeek": ["FRIDAY", "SATURDAY"],
      "startTime": "17:00",
      "endTime": "20:00",
      "badge": "-11%",
      "description": "Promo tous les vendredis et samedis de 17h à 20h"
    }
  ]
}
```

### POST /api/menu/promotions

Créer une nouvelle promotion.

**Body:**
```json
{
  "productId": "product_id",
  "name": "Promo Weekend",
  "discountedPrice": 2000,
  "startDate": "2026-01-15",
  "endDate": "2026-01-31",
  "daysOfWeek": ["SATURDAY", "SUNDAY"],
  "startTime": "12:00",
  "endTime": "22:00",
  "displayOrder": 0,
  "description": "Promotion spéciale weekend",
  "badge": "-10%"
}
```

**Champs requis:** `productId`, `name`, `discountedPrice`, `startDate`, `endDate`

**Champs optionnels:**
- `daysOfWeek` - Array de jours (ex: ["MONDAY", "FRIDAY"])
- `startTime` / `endTime` - Heures de validité (format "HH:MM")
- `displayOrder` - Ordre d'affichage
- `description` - Description de la promotion
- `badge` - Badge à afficher (ex: "PROMO", "-10%")

**Réponse:** 201 Created

### PATCH /api/menu/promotions?id=xxx

Mettre à jour une promotion.

**Body:** Mêmes champs que POST (tous optionnels)

**Réponse:** 200 OK

### DELETE /api/menu/promotions?id=xxx

Supprimer une promotion.

**Réponse:** 200 OK

---

## ⭐ Recommandations

### GET /api/menu/recommendations

Récupérer les recommandations actives.

**Query Parameters:**
- `type` (optionnel) - Filtrer par type de recommandation

**Types disponibles:**
- `POPULAR` - Populaire / Le plus commandé
- `NEW` - Nouveauté
- `CHEF_CHOICE` - Choix du chef
- `TRENDING` - Tendance
- `SEASONAL` - De saison
- `BEST_RATED` - Mieux noté
- `HOUSE_SPECIAL` - Spécialité maison

**Exemple:**
```bash
GET /api/menu/recommendations
GET /api/menu/recommendations?type=POPULAR
```

**Réponse:**
```json
{
  "recommendations": [
    {
      "id": "xxx",
      "type": "POPULAR",
      "productId": "yyy",
      "product": {...},
      "reason": "Le plus commandé cette semaine",
      "score": 100,
      "badge": "POPULAIRE",
      "displayOrder": 0
    }
  ]
}
```

### POST /api/menu/recommendations

Créer une nouvelle recommandation.

**Body:**
```json
{
  "productId": "product_id",
  "type": "CHEF_CHOICE",
  "reason": "Spécialité du chef - À ne pas manquer !",
  "score": 95,
  "displayOrder": 0,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "badge": "CHEF'S CHOICE"
}
```

**Champs requis:** `productId`, `type`

**Champs optionnels:**
- `reason` - Raison de la recommandation (affichée au client)
- `score` - Score de recommandation (plus élevé = plus forte)
- `displayOrder` - Ordre d'affichage
- `startDate` / `endDate` - Période de validité (optionnel, sans dates = toujours actif)
- `badge` - Badge à afficher

**Réponse:** 201 Created

### PATCH /api/menu/recommendations?id=xxx

Mettre à jour une recommandation.

**Body:** Mêmes champs que POST (tous optionnels)

**Réponse:** 200 OK

### DELETE /api/menu/recommendations?id=xxx

Supprimer une recommandation.

**Réponse:** 200 OK

---

## 🌐 Menu Public

### GET /api/menu/public/[slug]

**Route publique (pas d'authentification requise)**

Récupérer le menu complet d'un établissement avec toutes les informations enrichies :
- Liste des produits par catégorie
- Produits avec leurs promotions actives appliquées
- Plats du jour
- Recommandations

**Exemple:**
```bash
GET /api/menu/public/mon-restaurant-slug
```

**Réponse:**
```json
{
  "establishment": {
    "id": "xxx",
    "name": "Mon Restaurant",
    "slug": "mon-restaurant-slug",
    "description": "Description..."
  },
  "categories": [
    {
      "id": "cat1",
      "name": "Plats Principaux",
      "products": [
        {
          "id": "prod1",
          "name": "Poulet Yassa",
          "price": 2500,
          "image": "...",
          "promotion": {
            "id": "promo1",
            "name": "Happy Hour",
            "discountedPrice": 2000,
            "discountPercent": 20,
            "badge": "-20%"
          },
          "isDishOfDay": true,
          "recommendation": {
            "id": "rec1",
            "type": "POPULAR",
            "reason": "Le plus commandé",
            "badge": "POPULAIRE"
          }
        }
      ]
    }
  ],
  "dishesOfTheDay": [...],
  "promotions": [...],
  "recommendations": [...]
}
```

Cette route filtre automatiquement :
- ✅ Promotions valides selon la date, jour de la semaine et heure actuelle
- ✅ Plats du jour pour aujourd'hui uniquement
- ✅ Recommandations actives selon leur période de validité
- ✅ Produits actifs uniquement (status = true)

---

## 💡 Exemples d'utilisation

### Créer un plat du jour pour aujourd'hui

```bash
POST /api/menu/dish-of-day
{
  "productId": "prod_123",
  "date": "2026-01-13",
  "specialDescription": "Servi avec riz blanc et plantains"
}
```

### Créer une promotion Happy Hour

```bash
POST /api/menu/promotions
{
  "productId": "prod_456",
  "name": "Happy Hour",
  "discountedPrice": 2000,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "daysOfWeek": ["FRIDAY", "SATURDAY"],
  "startTime": "17:00",
  "endTime": "20:00",
  "badge": "-20%",
  "description": "Profitez de 20% de réduction tous les vendredis et samedis de 17h à 20h"
}
```

### Créer une recommandation "Populaire"

```bash
POST /api/menu/recommendations
{
  "productId": "prod_789",
  "type": "POPULAR",
  "reason": "Le plat le plus commandé cette semaine",
  "score": 100,
  "badge": "⭐ POPULAIRE"
}
```

### Créer une nouveauté temporaire

```bash
POST /api/menu/recommendations
{
  "productId": "prod_new",
  "type": "NEW",
  "reason": "Nouvelle recette du chef",
  "score": 90,
  "startDate": "2026-01-13",
  "endDate": "2026-01-31",
  "badge": "🆕 NOUVEAU"
}
```

---

## 📊 Notes importantes

### Promotions
- Le `discountPercent` est calculé automatiquement : `((prix_normal - prix_promo) / prix_normal) * 100`
- Les promotions peuvent être limitées à certains jours (`daysOfWeek`) et heures (`startTime`/`endTime`)
- Le filtrage automatique se fait dans la route publique selon l'heure/jour actuel

### Recommandations
- Le `score` permet de classer les recommandations (plus élevé = plus importante)
- Plusieurs types disponibles pour différentes stratégies marketing
- Sans `startDate`/`endDate`, la recommandation est toujours active

### Plats du jour
- Un produit ne peut être plat du jour qu'une fois par date (contrainte unique)
- La route publique retourne uniquement les plats du jour d'aujourd'hui

### Menu Public
- Route publique accessible sans authentification
- Enrichit automatiquement chaque produit avec ses promotions/recommandations actives
- Filtre intelligent selon date/heure/jour pour n'afficher que le contenu pertinent
