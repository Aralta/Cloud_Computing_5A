# Présentation du front & brief API

## 1) Le front

### Composition
Le front a 3 éléments :
- La section login
- Une barre utilisateur
- Le calendrier  
Les manipulations sur calendrier se font dans un form Modal  

Affichage :
- pas loggé -> on affiche le login, on cache topbar + calendrier
- loggé -> on affiche topbar + calendrier, on cache le login

### Forme des Events
Un Event contient :
- title
- description
- start / end : date+heure début/fin
- viewUserIds : liste des ID utilisateurs qui voient l’Event
- editUserIds : liste des ID utilisateurs qui peuvent modifier l’Event
- (renvoyés par le back) eventId, ownerId

### Interactions principales
- Load : FullCalendar charge les events via GET /events?start&end
- Create : sélection d’un créneau -> ouverture d’un formulaire en Modal -> POST /events -> affichage **uniquement si succès**
- Edit : click event -> Modal -> PATCH /events/:eventId -> revert si erreur
- Drag/resize : PATCH /events/:eventId -> revert si erreur
- Delete : depuis le modal -> DELETE /events/:eventId

### Users
- La liste des utilisateurs est chargée en cache à l'initialisation

### Requêtes
Tous les appels passent par apiFetch :
- ajoute Content-Type: application/json
- ajoute Authorization: Bearer <accessToken> si token présent
- parse les réponses JSON
- si réponse 401/403 : panique auto-logout (clear session + retour login)

### Dates
- Le front envoie start/end en ISO UTC.
- L’UI manipule/affiche les dates en local (timezone navigateur).
- Donc côté back : accepter et stocker des ISO strings.

---

## 2) Brief API

Il faudra adapter API_BASE pour la prod !

IMPORTANT :
- Toutes les routes sauf /auth/login doivent accepter le header :
  Authorization: Bearer <accessToken>
- Si token invalide/expiré ou accès refusé : renvoyer 401 ou 403
  (le front fera auto-logout)

### Auth
POST /auth/login

Request JSON :
{ "email": "user@mail.com", "password": "..." }

JSON attendu :
{
  "accessToken": "jwt_surement",
  "user": { "id": 1, "name": "Alice", "email": "alice@mail.com" }
}

### Users
GET /users

JSON attendu :  
[  
  { "id": 1, "name": "Alice", "email": "alice@mail.com" },  
  { "id": 2, "name": "Bob", "email": "bob@mail.com" }  
]

### Events

1) Load
GET /events?start=ISO&end=ISO

JSON attendu :  
[  
  {  
    "eventId": "e_123",  
    "title": "Reunion",  
    "description": "On se réunit",  
    "start": "2026-01-01T10:00:00.000Z",  
    "end": "2026-01-01T10:30:00.000Z",  
    "ownerId": 1,  
    "viewUserIds": [2, 3],  
    "editUserIds": [4]  
  }  
]  

Le front envoie pas le self user ID, le **back peut le dériver du JWT**

2) Create
POST /events

Request JSON :  
{  
  "title": "...",  
  "description": "...",  
  "start": "ISO",  
  "end": "ISO",  
  "viewUserIds": [],  
  "editUserIds": []  
}  

JSON de confirmation : :
{ "eventId": "e_456", "ownerId": 1 }

Le front n’affiche l’event qu’après confirmation.

3) Edit
PATCH /events/:eventId

Request JSON :  
{  
  "title": "...",  
  "description": "...",  
  "start": "ISO",  
  "end": "ISO",  
  "viewUserIds": [...],  
  "editUserIds": [...]  
}

OK si code HTTP 200 (ou 204).

4) Delete
DELETE /events/:eventId

OK si code HTTP 200 (ou 204).
