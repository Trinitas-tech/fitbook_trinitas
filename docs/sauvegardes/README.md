# Sauvegardes de la base de données FitBook

Exigence du cahier des charges (A.5.2, A.9) : sauvegardes de la base aux étapes demandées.

| Fichier | Étape | Contenu |
|---------|-------|---------|
| `fitbook_dev_2026-10-29.sql` | Étape 2/3 – fin du développement (dev, MySQL 9.1) | 13 tables InnoDB (schéma + données de démonstration : 14 comptes, 4 salles, 12 cours, séances sur 6 semaines, réservations, avis, favoris, notifications) + table `doctrine_migration_versions` |
| `fitbook_prod_AAAA-MM-JJ.sql` | Étape 4 – après déploiement sur alwaysdata | à produire avec la commande ci-dessous une fois le site en ligne |

## Créer une sauvegarde

```bash
# Développement (WAMP, MySQL 9.1)
mysqldump -u root --single-transaction --routines --add-drop-table --default-character-set=utf8mb4 fitbook \
  > docs/sauvegardes/fitbook_dev_$(date +%F).sql

# Production (alwaysdata)
mysqldump -h mysql-trinitasnt.alwaysdata.net -u trinitasnt_fitbook -p --single-transaction trinitasnt_fitbook \
  > docs/sauvegardes/fitbook_prod_$(date +%F).sql
```

## Restaurer

```bash
mysql -u fitbook -p fitbook < docs/sauvegardes/fitbook_dev_2026-10-29.sql
```

ou via phpMyAdmin (alwaysdata) : sélectionner la base, onglet **Importer**.

> Les mots de passe des comptes de démonstration sont hashés ; mot de passe en clair : `Password123!`.
