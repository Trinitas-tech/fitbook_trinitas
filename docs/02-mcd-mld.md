# FitBook – Modèle conceptuel (MCD) et modèle logique (MLD)

> Document à faire valider avant le début du développement.
> Le MCD est décrit ici au format Merise (entités, associations, cardinalités). Le fichier
> **JMerise** s'obtient par rétro-conception du script `fitbook.sql` (voir section 6).
> Une version diagramme est disponible dans FigJam (voir lien dans le README).

## 1. Choix de modélisation

- **Un seul compte utilisateur** (`UTILISATEUR`) avec un champ `roles` (convention Symfony).
  Les données spécifiques au coach sont dans l'entité `COACH` (relation 1,1 – 0,1).
- **Salle ≠ Coach** : une salle est gérée par un gestionnaire ; un coach est un utilisateur.
  Un cours est proposé par une salle et peut être animé par un coach.
- **Cours vs Séance** : le `COURS` est l'offre (ex. « Yoga débutant, 60 min, 12 places »),
  la `SEANCE` est son occurrence datée et réservable (ex. « lundi 20/10 à 18h »).
  Un coach peut aussi créer une séance individuelle sans cours (coaching privé) :
  une séance est donc liée **soit** à un cours, **soit** directement à un coach (contrainte XOR).
- **Horaires de salle** et **disponibilités de coach** sont deux entités distinctes :
  l'une décrit l'ouverture d'un lieu, l'autre la plage de travail d'une personne.
- **Avis** : un avis cible une salle **ou** un coach (contrainte XOR) et n'est possible
  qu'après une réservation terminée (règle métier contrôlée par l'API).
- **Favoris** : deux associations porteuses de date (`FAVORI_SALLE`, `FAVORI_COACH`).
- **Réservation** : contrôle de capacité `SUM(nb_places) ≤ SEANCE.capacite` en transaction.

## 2. MCD – Entités

| Entité | Attributs (identifiant = premier attribut, en gras) |
|--------|------------------------------------------------------|
| UTILISATEUR | **id**, email, mot_de_passe, nom, prenom, telephone, avatar_url, roles, est_verifie, est_actif, date_creation |
| COACH | **id**, specialite, bio, tarif_horaire, ville, est_valide |
| SALLE | **id**, nom, description, adresse, ville, code_postal, latitude, longitude, telephone, image_url, capacite_totale |
| ACTIVITE | **id**, nom, description, icone |
| COURS | **id**, titre, description, niveau, duree_minutes, prix, capacite, image_url |
| SEANCE | **id**, date_debut, date_fin, capacite, prix, statut, lieu |
| HORAIRE | **id**, jour_semaine, heure_ouverture, heure_fermeture |
| DISPONIBILITE | **id**, jour_semaine, heure_debut, heure_fin |
| RESERVATION | **id**, date_reservation, statut, nb_places, code_qr |
| AVIS | **id**, note, commentaire, date_avis, statut_moderation |
| NOTIFICATION | **id**, type, sujet, contenu, date_envoi, est_lue |

Valeurs énumérées :
- `UTILISATEUR.roles` : ROLE_USER, ROLE_COACH, ROLE_MANAGER, ROLE_ADMIN
- `COURS.niveau` : debutant, intermediaire, avance, tous_niveaux
- `SEANCE.statut` : planifiee, complete, annulee, terminee
- `RESERVATION.statut` : confirmee, annulee, terminee
- `AVIS.statut_moderation` : en_attente, approuve, masque
- `NOTIFICATION.type` : confirmation, annulation, rappel, info
- `jour_semaine` : 1 (lundi) à 7 (dimanche)

## 3. MCD – Associations et cardinalités

Lecture : `ENTITE_A (card_A) — ASSOCIATION — (card_B) ENTITE_B`

| Association | Entité A | Card. A | Card. B | Entité B | Commentaire |
|-------------|----------|---------|---------|----------|-------------|
| EST | UTILISATEUR | 0,1 | 1,1 | COACH | Un utilisateur est au plus un coach ; un coach est exactement un utilisateur |
| GERE | UTILISATEUR | 0,N | 1,1 | SALLE | Un gestionnaire gère plusieurs salles |
| EFFECTUE | UTILISATEUR | 0,N | 1,1 | RESERVATION | |
| REDIGE | UTILISATEUR | 0,N | 1,1 | AVIS | |
| RECOIT_NOTIF | UTILISATEUR | 0,N | 1,1 | NOTIFICATION | |
| FAVORI_SALLE (date_ajout) | UTILISATEUR | 0,N | 0,N | SALLE | Association porteuse |
| FAVORI_COACH (date_ajout) | UTILISATEUR | 0,N | 0,N | COACH | Association porteuse |
| PROPOSE | SALLE | 0,N | 1,1 | COURS | |
| OUVRE | SALLE | 0,N | 1,1 | HORAIRE | |
| CATEGORISE | ACTIVITE | 0,N | 1,1 | COURS | |
| ANIME | COACH | 0,N | 0,1 | COURS | Cours animé par un coach (facultatif) |
| DECLARE | COACH | 0,N | 1,1 | DISPONIBILITE | |
| PLANIFIE | COURS | 0,N | 0,1 | SEANCE | Séance collective d'un cours |
| DONNE | COACH | 0,N | 0,1 | SEANCE | Séance privée du coach (XOR avec PLANIFIE) |
| CONCERNE | SEANCE | 0,N | 1,1 | RESERVATION | |
| DECLENCHE | RESERVATION | 0,N | 0,1 | NOTIFICATION | |
| NOTE_SALLE | SALLE | 0,N | 0,1 | AVIS | XOR avec NOTE_COACH |
| NOTE_COACH | COACH | 0,N | 0,1 | AVIS | XOR avec NOTE_SALLE |

Contraintes d'intégrité (CIF / XOR) à représenter sur le schéma :
- **XOR(PLANIFIE, DONNE)** sur SEANCE : une séance est liée à un cours ou à un coach, jamais aux deux, jamais à aucun.
- **XOR(NOTE_SALLE, NOTE_COACH)** sur AVIS.

## 4. MLD (déduit du MCD, règles de passage Merise)

Convention : `table(clé_primaire, attributs, #clé_étrangère)`.

```
utilisateur   (id, email, mot_de_passe, nom, prenom, telephone, avatar_url, roles,
               est_verifie, est_actif, date_creation)
coach         (id, specialite, bio, tarif_horaire, ville, est_valide, #utilisateur_id UNIQUE)
salle         (id, nom, description, adresse, ville, code_postal, latitude, longitude,
               telephone, image_url, capacite_totale, #gestionnaire_id -> utilisateur)
activite      (id, nom, description, icone)
cours         (id, titre, description, niveau, duree_minutes, prix, capacite, image_url,
               #salle_id, #activite_id, #coach_id NULL)
seance        (id, date_debut, date_fin, capacite, prix, statut, lieu,
               #cours_id NULL, #coach_id NULL)        -- CHECK : exactement un des deux non NULL
horaire       (id, jour_semaine, heure_ouverture, heure_fermeture, #salle_id)
disponibilite (id, jour_semaine, heure_debut, heure_fin, #coach_id)
reservation   (id, date_reservation, statut, nb_places, code_qr, #utilisateur_id, #seance_id)
               -- UNIQUE(utilisateur_id, seance_id)
avis          (id, note, commentaire, date_avis, statut_moderation, #auteur_id -> utilisateur,
               #salle_id NULL, #coach_id NULL)        -- CHECK : exactement un des deux non NULL
notification  (id, type, sujet, contenu, date_envoi, est_lue, #utilisateur_id, #reservation_id NULL)
favori_salle  (#utilisateur_id, #salle_id, date_ajout)   -- PK composite
favori_coach  (#utilisateur_id, #coach_id, date_ajout)   -- PK composite
```

Correspondance avec Doctrine (Symfony) :

| Table MLD | Entité Doctrine | Relation |
|-----------|-----------------|----------|
| coach.utilisateur_id | `Coach::$user` | OneToOne |
| salle.gestionnaire_id | `Gym::$manager` | ManyToOne |
| cours.* | `Course::$gym`, `$activity`, `$coach` | ManyToOne ×3 |
| seance.* | `Session::$course`, `$coach` | ManyToOne ×2 (nullable) |
| reservation.* | `Booking::$user`, `$session` | ManyToOne ×2 + UniqueConstraint |
| avis.* | `Review::$author`, `$gym`, `$coach` | ManyToOne ×3 |
| favori_salle / favori_coach | `User::$favoriteGyms`, `$favoriteCoaches` | ManyToMany |

## 5. Points à valider avec le formateur

1. Un seul compte avec rôles (plutôt que des tables distinctes par type d'utilisateur) : OK ?
2. Séance liée à un cours **ou** à un coach (coaching privé) : conserver le coaching privé ou se limiter aux cours de salle ?
3. Avis sur salle et coach uniquement (pas sur un cours) : OK ?
4. Table `notification` persistée en base en plus de l'envoi d'e-mail : utile pour le bonus « notification avant une séance » ?

## 6. Produire le MCD dans JMerise (version 0.6.3)

Le format `.mcd` de JMerise est binaire (sérialisation Java) : il ne se génère pas à la main.
On utilise la rétro-conception depuis le script SQL `docs/fitbook.sql`.

1. Lancer JMerise (`JMerise.jar`, Java 8 ou plus).
2. Menu **Rétro-Conception** → **Concevoir MCD à partir d'un script SQL**.
3. Coller le contenu de `docs/fitbook.sql` (ou l'ouvrir) et lancer la génération :
   JMerise crée le MLD puis le MCD (entités, associations, cardinalités).
4. Vérifier et retoucher dans le MCD :
   - renommer les associations avec les noms de la section 3 (EST, GERE, PROPOSE, …) ;
   - `favori_salle` / `favori_coach` doivent apparaître comme associations porteuses
     (0,N – 0,N) avec `date_ajout` ;
   - `coach ↔ utilisateur` : cardinalités 1,1 – 0,1 (clé étrangère UNIQUE) ;
   - ajouter les deux contraintes **XOR** (SEANCE : PLANIFIE/DONNE ; AVIS : NOTE_SALLE/NOTE_COACH)
     avec l'outil « Contrainte » de JMerise, elles ne sont pas déduites du SQL.
5. Réorganiser la disposition, puis **Fichier → Enregistrer** sous `docs/fitbook.mcd`.
6. Exporter l'image (**Fichier → Exporter en image**) vers `docs/diagrammes/mcd-jmerise.png`.

Si l'import échoue sur les lignes de commentaire (`--`), les supprimer avant de coller.
