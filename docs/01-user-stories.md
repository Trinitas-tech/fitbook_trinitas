# FitBook – User stories

> Document à faire valider avant le début du développement (étape 1 du cahier des charges).
> Format : **En tant que** [rôle], **je veux** [action] **afin de** [bénéfice].
> Priorité MoSCoW : **M** = Must (obligatoire), **S** = Should, **C** = Could (bonus).

## Rôles

| Rôle | Code Symfony | Description |
|------|--------------|-------------|
| Visiteur | – | Personne non connectée |
| Sportif | `ROLE_USER` | Utilisateur qui recherche et réserve des séances |
| Coach | `ROLE_COACH` | Professionnel indépendant qui propose des séances |
| Gestionnaire de salle | `ROLE_MANAGER` | Responsable d'une ou plusieurs salles et de leurs cours |
| Administrateur | `ROLE_ADMIN` | Administre et modère toute la plateforme |

---

## 1. Authentification et compte (transversal)

| ID | User story | Critères d'acceptation | Prio |
|----|------------|------------------------|------|
| US-01 | En tant que visiteur, je veux créer un compte avec mon e-mail, un mot de passe et mon rôle (sportif, coach ou gestionnaire) afin d'accéder à la plateforme. | Formulaire validé côté serveur (e-mail unique, mot de passe ≥ 8 caractères). Le mot de passe est hashé. Un e-mail de confirmation est envoyé. | M |
| US-02 | En tant que nouvel inscrit, je veux confirmer mon adresse e-mail via un lien afin d'activer mon compte. | Le lien expire après 24 h. Sans confirmation, la connexion est refusée avec un message clair. | M |
| US-03 | En tant qu'utilisateur inscrit, je veux me connecter et me déconnecter afin de sécuriser mon espace. | Authentification JWT (API) ; message d'erreur générique en cas d'échec ; redirection vers l'espace correspondant au rôle. | M |
| US-04 | En tant qu'utilisateur, je veux réinitialiser mon mot de passe oublié par e-mail afin de récupérer mon accès. | Lien à usage unique, expiration 1 h. | S |
| US-05 | En tant qu'utilisateur, je veux modifier mon profil (nom, prénom, téléphone, avatar, mot de passe) afin de garder mes informations à jour. | Validation serveur ; l'e-mail ne peut pas être modifié sans re-confirmation. | M |
| US-06 | En tant qu'utilisateur, je veux que chaque page ou action soit limitée à mon rôle afin que personne n'accède aux données des autres. | Voters Symfony : un coach ne modifie que ses séances, un gestionnaire que ses salles, un sportif que ses réservations. Réponse 403 sinon. | M |

## 2. Sportif

| ID | User story | Critères d'acceptation | Prio |
|----|------------|------------------------|------|
| US-10 | En tant que sportif, je veux rechercher des salles, cours et coachs par mot-clé afin de trouver rapidement une activité. | Barre de recherche globale ; résultats regroupés par type ; recherche insensible à la casse. | M |
| US-11 | En tant que sportif, je veux filtrer les résultats (ville, activité, niveau, prix, date, note minimale, type) afin d'affiner ma recherche. | Filtres combinables ; URL partageable (query params) ; compteur de résultats. | M |
| US-12 | En tant que sportif, je veux consulter la fiche d'une salle (adresse, horaires, cours proposés, avis, note) afin de décider d'y aller. | Fiche responsive ; horaires de la semaine ; liste des cours ; moyenne des avis. | M |
| US-13 | En tant que sportif, je veux consulter la fiche d'un coach (spécialité, tarif, disponibilités, avis) afin de choisir un accompagnement. | Calendrier des créneaux disponibles. | M |
| US-14 | En tant que sportif, je veux consulter la fiche d'un cours et ses prochaines séances afin de réserver un créneau. | Chaque séance affiche date, heure, places restantes et prix. | M |
| US-15 | En tant que sportif, je veux réserver une place à une séance afin de participer. | Réservation impossible si séance complète ou passée ; une seule réservation par sportif et par séance ; confirmation à l'écran et par e-mail. | M |
| US-16 | En tant que sportif, je veux consulter l'historique de mes réservations (à venir / passées) afin de suivre mon activité. | Tri par date ; statut visible (confirmée, annulée, terminée). | M |
| US-17 | En tant que sportif, je veux annuler une réservation afin de libérer ma place. | Annulation possible jusqu'à 2 h avant le début ; la place est libérée ; e-mail d'annulation. | M |
| US-18 | En tant que sportif, je veux ajouter une salle ou un coach à mes favoris afin de les retrouver facilement. | Bouton cœur sur les fiches et cartes ; page « Mes favoris ». | M |
| US-19 | En tant que sportif, je veux publier un avis avec une note (1 à 5) sur une salle ou un coach afin de partager mon expérience. | Un avis possible uniquement après une réservation terminée ; un seul avis par salle/coach ; modifiable par son auteur. | M |
| US-20 | En tant que sportif, je veux recevoir un rappel par e-mail avant ma séance afin de ne pas l'oublier. | Rappel 24 h avant (commande Symfony planifiée). | C |
| US-21 | En tant que sportif, je veux voir les salles sur une carte et trier par distance afin de trouver celles proches de moi. | Carte interactive (Leaflet) ; géolocalisation navigateur. | C |
| US-22 | En tant que sportif, je veux recevoir un QR code de confirmation afin de le présenter à l'entrée. | QR code généré à la confirmation, visible dans la réservation. | C |

## 3. Coach

| ID | User story | Critères d'acceptation | Prio |
|----|------------|------------------------|------|
| US-30 | En tant que coach, je veux compléter mon profil professionnel (spécialité, bio, tarif horaire, ville, photo) afin d'être visible dans la recherche. | Profil incomplet = non visible publiquement. | M |
| US-31 | En tant que coach, je veux créer, modifier et supprimer mes séances (date, durée, lieu, capacité, prix) afin de proposer mon offre. | CRUD sécurisé par Voter ; suppression impossible si des réservations confirmées existent (annulation requise). | M |
| US-32 | En tant que coach, je veux définir mes disponibilités hebdomadaires afin que les sportifs sachent quand me réserver. | Créneaux par jour de la semaine ; une séance ne peut être créée hors disponibilité. | M |
| US-33 | En tant que coach, je veux visualiser mes séances dans un calendrier afin d'organiser ma semaine. | Vue semaine/mois ; clic sur une séance = détail et liste des participants. | M |
| US-34 | En tant que coach, je veux consulter la liste des réservations de chaque séance afin de préparer mes cours. | Nom des participants, nombre de places restantes. | M |
| US-35 | En tant que coach, je veux consulter les avis et notes reçus afin d'améliorer mes prestations. | Moyenne + liste chronologique. | M |
| US-36 | En tant que coach, je veux voir des statistiques (séances données, taux de remplissage, note moyenne) afin de suivre mon activité. | Tableau de bord avec 3 indicateurs minimum. | C |

## 4. Gestionnaire de salle

| ID | User story | Critères d'acceptation | Prio |
|----|------------|------------------------|------|
| US-40 | En tant que gestionnaire, je veux créer et modifier la fiche de ma salle (nom, adresse, description, photo, capacité) afin de la présenter aux sportifs. | CRUD sécurisé ; une salle appartient à un seul gestionnaire. | M |
| US-41 | En tant que gestionnaire, je veux définir les horaires d'ouverture de la salle afin d'informer les sportifs. | Un créneau par jour de la semaine ; jours fermés possibles. | M |
| US-42 | En tant que gestionnaire, je veux créer, modifier et supprimer les cours de ma salle (activité, niveau, durée, capacité, prix, coach) afin de proposer une offre. | CRUD ; un cours est lié à une activité et éventuellement à un coach. | M |
| US-43 | En tant que gestionnaire, je veux planifier les séances d'un cours (date, heure, capacité) afin de les rendre réservables. | Planification unitaire ou récurrente hebdomadaire ; capacité ≤ capacité de la salle. | M |
| US-44 | En tant que gestionnaire, je veux consulter le calendrier et les réservations de ma salle afin de gérer la fréquentation. | Vue calendrier + liste ; filtre par cours ; export CSV (bonus). | M |
| US-45 | En tant que gestionnaire, je veux annuler une séance afin de gérer un imprévu. | Toutes les réservations passent en « annulée » et les sportifs reçoivent un e-mail. | M |
| US-46 | En tant que gestionnaire, je veux consulter les avis reçus par ma salle afin de suivre la satisfaction. | Moyenne + liste. | M |

## 5. Administrateur

| ID | User story | Critères d'acceptation | Prio |
|----|------------|------------------------|------|
| US-50 | En tant qu'administrateur, je veux lister, rechercher, modifier et désactiver les utilisateurs afin d'administrer la plateforme. | Changement de rôle possible ; un compte désactivé ne peut plus se connecter. | M |
| US-51 | En tant qu'administrateur, je veux gérer les salles, coachs et activités (CRUD complet) afin de garantir la qualité du catalogue. | Validation des profils coach avant publication. | M |
| US-52 | En tant qu'administrateur, je veux consulter et annuler n'importe quelle réservation afin d'intervenir en cas de litige. | Filtres par statut, date, utilisateur. | M |
| US-53 | En tant qu'administrateur, je veux modérer les avis (approuver, masquer, supprimer) afin de supprimer les contenus inappropriés. | Un avis masqué n'est plus compté dans la moyenne. | M |
| US-54 | En tant qu'administrateur, je veux voir des statistiques globales (inscriptions, réservations, taux de remplissage) afin de piloter la plateforme. | Tableau de bord avec graphiques. | C |

## 6. Système (règles métier et notifications)

| ID | User story | Critères d'acceptation | Prio |
|----|------------|------------------------|------|
| US-60 | En tant que système, je veux refuser toute réservation dépassant la capacité d'une séance afin d'éviter la surréservation. | Contrôle en transaction côté API (verrou) ; message « séance complète ». | M |
| US-61 | En tant que système, je veux envoyer un e-mail à chaque confirmation ou annulation de réservation afin de tenir l'utilisateur informé. | Symfony Mailer ; e-mails HTML en français. | M |
| US-62 | En tant que système, je veux recalculer la note moyenne d'une salle ou d'un coach à chaque avis afin d'afficher une note à jour. | Moyenne arrondie à 1 décimale. | M |
| US-63 | En tant que système, je veux passer automatiquement une séance en « terminée » après sa date de fin afin de permettre la publication d'avis. | Commande planifiée. | S |

---

## Récapitulatif

| Rôle | Must | Should | Could | Total |
|------|------|--------|-------|-------|
| Transversal | 5 | 1 | 0 | 6 |
| Sportif | 10 | 0 | 3 | 13 |
| Coach | 6 | 0 | 1 | 7 |
| Gestionnaire | 7 | 0 | 0 | 7 |
| Administrateur | 4 | 0 | 1 | 5 |
| Système | 3 | 1 | 0 | 4 |
| **Total** | **35** | **2** | **5** | **42** |
