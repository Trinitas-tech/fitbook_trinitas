-- MySQL dump 10.13  Distrib 9.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: fitbook
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activite`
--

DROP TABLE IF EXISTS `activite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activite` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `description` longtext,
  `icone` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_activite_nom` (`nom`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activite`
--

LOCK TABLES `activite` WRITE;
/*!40000 ALTER TABLE `activite` DISABLE KEYS */;
INSERT INTO `activite` VALUES (88,'Yoga','Cours de Yoga encadrés par des professionnels.','🧘'),(89,'Pilates','Cours de Pilates encadrés par des professionnels.','🤸'),(90,'Musculation','Cours de Musculation encadrés par des professionnels.','🏋️'),(91,'CrossFit','Cours de CrossFit encadrés par des professionnels.','💪'),(92,'Cardio','Cours de Cardio encadrés par des professionnels.','🏃'),(93,'Boxe','Cours de Boxe encadrés par des professionnels.','🥊'),(94,'Natation','Cours de Natation encadrés par des professionnels.','🏊'),(95,'Danse','Cours de Danse encadrés par des professionnels.','💃'),(96,'Cyclisme','Cours de Cyclisme encadrés par des professionnels.','🚴'),(97,'Zumba','Cours de Zumba encadrés par des professionnels.','🎉');
/*!40000 ALTER TABLE `activite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `avis`
--

DROP TABLE IF EXISTS `avis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rating` smallint NOT NULL,
  `commentaire` longtext,
  `date_avis` datetime NOT NULL,
  `statut_moderation` varchar(20) NOT NULL,
  `auteur_id` int NOT NULL,
  `salle_id` int DEFAULT NULL,
  `coach_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_avis_auteur_salle` (`auteur_id`,`salle_id`),
  UNIQUE KEY `uniq_avis_auteur_coach` (`auteur_id`,`coach_id`),
  KEY `IDX_8F91ABF060BB6FE6` (`auteur_id`),
  KEY `IDX_8F91ABF0DC304035` (`salle_id`),
  KEY `IDX_8F91ABF03C105691` (`coach_id`),
  CONSTRAINT `FK_8F91ABF03C105691` FOREIGN KEY (`coach_id`) REFERENCES `coach` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_8F91ABF060BB6FE6` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_8F91ABF0DC304035` FOREIGN KEY (`salle_id`) REFERENCES `salle` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_avis_note` CHECK ((`rating` between 1 and 5)),
  CONSTRAINT `chk_avis_salle_xor_coach` CHECK (((`salle_id` is null) <> (`coach_id` is null)))
) ENGINE=InnoDB AUTO_INCREMENT=170 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avis`
--

LOCK TABLES `avis` WRITE;
/*!40000 ALTER TABLE `avis` DISABLE KEYS */;
INSERT INTO `avis` VALUES (152,3,'Excellente salle, matériel récent et coachs à l\'écoute.','2026-10-29 08:53:18','approuve',116,39,NULL),(153,4,'Très bonne ambiance, je recommande !','2026-10-29 08:53:18','approuve',117,39,NULL),(154,5,'Un peu cher mais la qualité est au rendez-vous.','2026-10-29 08:53:18','en_attente',118,39,NULL),(155,4,'Très bonne ambiance, je recommande !','2026-10-29 08:53:18','approuve',116,40,NULL),(156,5,'Un peu cher mais la qualité est au rendez-vous.','2026-10-29 08:53:18','approuve',117,40,NULL),(157,3,'Cours dynamiques, on ne s\'ennuie jamais.','2026-10-29 08:53:18','approuve',118,40,NULL),(158,5,'Un peu cher mais la qualité est au rendez-vous.','2026-10-29 08:53:18','approuve',116,41,NULL),(159,3,'Cours dynamiques, on ne s\'ennuie jamais.','2026-10-29 08:53:18','approuve',117,41,NULL),(160,4,'Vestiaires un peu petits, sinon parfait.','2026-10-29 08:53:18','approuve',118,41,NULL),(161,3,'Cours dynamiques, on ne s\'ennuie jamais.','2026-10-29 08:53:18','approuve',116,42,NULL),(162,4,'Vestiaires un peu petits, sinon parfait.','2026-10-29 08:53:18','approuve',117,42,NULL),(163,5,'Excellente salle, matériel récent et coachs à l\'écoute.','2026-10-29 08:53:18','approuve',118,42,NULL),(164,4,'Un peu cher mais la qualité est au rendez-vous.','2026-10-29 08:53:18','approuve',116,NULL,45),(165,5,'Cours dynamiques, on ne s\'ennuie jamais.','2026-10-29 08:53:18','approuve',117,NULL,45),(166,5,'Cours dynamiques, on ne s\'ennuie jamais.','2026-10-29 08:53:18','approuve',116,NULL,46),(167,4,'Vestiaires un peu petits, sinon parfait.','2026-10-29 08:53:18','approuve',117,NULL,46),(168,4,'Vestiaires un peu petits, sinon parfait.','2026-10-29 08:53:18','approuve',116,NULL,47),(169,5,'Excellente salle, matériel récent et coachs à l\'écoute.','2026-10-29 08:53:18','approuve',117,NULL,47);
/*!40000 ALTER TABLE `avis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coach`
--

DROP TABLE IF EXISTS `coach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach` (
  `id` int NOT NULL AUTO_INCREMENT,
  `specialite` varchar(100) DEFAULT NULL,
  `bio` longtext,
  `tarif_horaire` decimal(8,2) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `est_valide` tinyint NOT NULL,
  `utilisateur_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_3F596DCCFB88E14F` (`utilisateur_id`),
  CONSTRAINT `FK_3F596DCCFB88E14F` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coach`
--

LOCK TABLES `coach` WRITE;
/*!40000 ALTER TABLE `coach` DISABLE KEYS */;
INSERT INTO `coach` VALUES (45,'Yoga & Pilates','Professeure de yoga certifiée, 8 ans d\'expérience. Séances douces et accessibles.',45.00,'Lyon',1,112),(46,'Musculation & CrossFit','Ancien athlète, coach diplômé BPJEPS. Programmes personnalisés force et conditionnement.',55.00,'Lyon',1,113),(47,'Running & Cardio','Préparatrice physique, spécialiste endurance et perte de poids.',40.00,'Paris',1,114),(48,'Boxe','Boxeur amateur, coach en cours de validation.',35.00,'Paris',0,115);
/*!40000 ALTER TABLE `coach` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cours`
--

DROP TABLE IF EXISTS `cours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) NOT NULL,
  `description` longtext,
  `niveau` varchar(20) NOT NULL,
  `duree_minutes` int NOT NULL,
  `prix` decimal(8,2) NOT NULL,
  `capacite` int NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `salle_id` int NOT NULL,
  `activite_id` int NOT NULL,
  `coach_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_FDCA8C9CDC304035` (`salle_id`),
  KEY `IDX_FDCA8C9C9B0F88B1` (`activite_id`),
  KEY `IDX_FDCA8C9C3C105691` (`coach_id`),
  CONSTRAINT `FK_FDCA8C9C3C105691` FOREIGN KEY (`coach_id`) REFERENCES `coach` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_FDCA8C9C9B0F88B1` FOREIGN KEY (`activite_id`) REFERENCES `activite` (`id`),
  CONSTRAINT `FK_FDCA8C9CDC304035` FOREIGN KEY (`salle_id`) REFERENCES `salle` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cours`
--

LOCK TABLES `cours` WRITE;
/*!40000 ALTER TABLE `cours` DISABLE KEYS */;
INSERT INTO `cours` VALUES (103,'Full Body débutant','Séance de Full Body débutant (Musculation) encadrée dans la salle FitZone Lyon Part-Dieu.','debutant',60,12.00,15,NULL,39,90,46),(104,'WOD du soir','Séance de WOD du soir (CrossFit) encadrée dans la salle FitZone Lyon Part-Dieu.','intermediaire',60,15.00,12,NULL,39,91,46),(105,'HIIT express','Séance de HIIT express (Cardio) encadrée dans la salle FitZone Lyon Part-Dieu.','tous_niveaux',45,10.00,20,NULL,39,92,47),(106,'Zumba party','Séance de Zumba party (Zumba) encadrée dans la salle FitZone Lyon Part-Dieu.','tous_niveaux',60,9.00,25,NULL,39,97,NULL),(107,'Yoga Vinyasa matin','Séance de Yoga Vinyasa matin (Yoga) encadrée dans la salle Yoga Loft Croix-Rousse.','tous_niveaux',75,18.00,12,NULL,40,88,45),(108,'Pilates renforcement','Séance de Pilates renforcement (Pilates) encadrée dans la salle Yoga Loft Croix-Rousse.','intermediaire',60,16.00,10,NULL,40,89,45),(109,'Yin Yoga & relaxation','Séance de Yin Yoga & relaxation (Yoga) encadrée dans la salle Yoga Loft Croix-Rousse.','debutant',60,15.00,12,NULL,40,88,NULL),(110,'Haltérophilie technique','Séance de Haltérophilie technique (Musculation) encadrée dans la salle Urban Fitness Bastille.','avance',90,20.00,8,NULL,41,90,NULL),(111,'Aquagym','Séance de Aquagym (Natation) encadrée dans la salle Urban Fitness Bastille.','tous_niveaux',45,11.00,15,NULL,41,94,NULL),(112,'Running club','Séance de Running club (Cardio) encadrée dans la salle Urban Fitness Bastille.','tous_niveaux',60,8.00,30,NULL,41,92,47),(113,'Boxe anglaise initiation','Séance de Boxe anglaise initiation (Boxe) encadrée dans la salle Boxing Club République.','debutant',60,14.00,16,NULL,42,93,NULL),(114,'Cardio boxing','Séance de Cardio boxing (Boxe) encadrée dans la salle Boxing Club République.','intermediaire',45,12.00,16,NULL,42,93,NULL);
/*!40000 ALTER TABLE `cours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disponibilite`
--

DROP TABLE IF EXISTS `disponibilite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disponibilite` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jour_semaine` smallint NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `coach_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_2CBACE2F3C105691` (`coach_id`),
  CONSTRAINT `FK_2CBACE2F3C105691` FOREIGN KEY (`coach_id`) REFERENCES `coach` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=429 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disponibilite`
--

LOCK TABLES `disponibilite` WRITE;
/*!40000 ALTER TABLE `disponibilite` DISABLE KEYS */;
INSERT INTO `disponibilite` VALUES (380,1,'08:00:00','12:00:00',45),(381,1,'14:00:00','20:00:00',45),(382,2,'08:00:00','12:00:00',45),(383,2,'14:00:00','20:00:00',45),(384,3,'08:00:00','12:00:00',45),(385,3,'14:00:00','20:00:00',45),(386,4,'08:00:00','12:00:00',45),(387,4,'14:00:00','20:00:00',45),(388,5,'08:00:00','12:00:00',45),(389,5,'14:00:00','20:00:00',45),(390,6,'09:00:00','13:00:00',45),(391,1,'08:00:00','12:00:00',46),(392,1,'14:00:00','20:00:00',46),(393,2,'08:00:00','12:00:00',46),(394,2,'14:00:00','20:00:00',46),(395,3,'08:00:00','12:00:00',46),(396,3,'14:00:00','20:00:00',46),(397,4,'08:00:00','12:00:00',46),(398,4,'14:00:00','20:00:00',46),(399,5,'08:00:00','12:00:00',46),(400,5,'14:00:00','20:00:00',46),(401,6,'09:00:00','13:00:00',46),(402,1,'08:00:00','12:00:00',47),(403,1,'14:00:00','20:00:00',47),(404,2,'08:00:00','12:00:00',47),(405,2,'14:00:00','20:00:00',47),(406,3,'08:00:00','12:00:00',47),(407,3,'14:00:00','20:00:00',47),(408,4,'08:00:00','12:00:00',47),(409,4,'14:00:00','20:00:00',47),(410,5,'08:00:00','12:00:00',47),(411,5,'14:00:00','20:00:00',47),(412,6,'09:00:00','13:00:00',47),(413,1,'08:00:00','12:00:00',48),(414,1,'14:00:00','20:00:00',48),(415,2,'08:00:00','12:00:00',48),(416,2,'14:00:00','20:00:00',48),(417,3,'08:00:00','12:00:00',48),(418,3,'14:00:00','20:00:00',48),(419,4,'08:00:00','12:00:00',48),(420,4,'14:00:00','20:00:00',48),(421,5,'08:00:00','12:00:00',48),(422,5,'14:00:00','20:00:00',48),(423,6,'09:00:00','13:00:00',48);
/*!40000 ALTER TABLE `disponibilite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctrine_migration_versions`
--

DROP TABLE IF EXISTS `doctrine_migration_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctrine_migration_versions` (
  `version` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctrine_migration_versions`
--

LOCK TABLES `doctrine_migration_versions` WRITE;
/*!40000 ALTER TABLE `doctrine_migration_versions` DISABLE KEYS */;
INSERT INTO `doctrine_migration_versions` VALUES ('App\\Migrations\\Version20261027114606','2026-10-27 11:46:18',1091),('App\\Migrations\\Version20261027120000','2026-10-27 11:53:35',160);
/*!40000 ALTER TABLE `doctrine_migration_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favori_coach`
--

DROP TABLE IF EXISTS `favori_coach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favori_coach` (
  `date_ajout` datetime NOT NULL,
  `utilisateur_id` int NOT NULL,
  `coach_id` int NOT NULL,
  PRIMARY KEY (`utilisateur_id`,`coach_id`),
  KEY `IDX_A19542FDFB88E14F` (`utilisateur_id`),
  KEY `IDX_A19542FD3C105691` (`coach_id`),
  CONSTRAINT `FK_A19542FD3C105691` FOREIGN KEY (`coach_id`) REFERENCES `coach` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_A19542FDFB88E14F` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favori_coach`
--

LOCK TABLES `favori_coach` WRITE;
/*!40000 ALTER TABLE `favori_coach` DISABLE KEYS */;
INSERT INTO `favori_coach` VALUES ('2026-10-29 08:53:18',116,45);
/*!40000 ALTER TABLE `favori_coach` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favori_salle`
--

DROP TABLE IF EXISTS `favori_salle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favori_salle` (
  `date_ajout` datetime NOT NULL,
  `utilisateur_id` int NOT NULL,
  `salle_id` int NOT NULL,
  PRIMARY KEY (`utilisateur_id`,`salle_id`),
  KEY `IDX_D05B516DFB88E14F` (`utilisateur_id`),
  KEY `IDX_D05B516DDC304035` (`salle_id`),
  CONSTRAINT `FK_D05B516DDC304035` FOREIGN KEY (`salle_id`) REFERENCES `salle` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_D05B516DFB88E14F` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favori_salle`
--

LOCK TABLES `favori_salle` WRITE;
/*!40000 ALTER TABLE `favori_salle` DISABLE KEYS */;
INSERT INTO `favori_salle` VALUES ('2026-10-29 08:53:18',116,39),('2026-10-29 08:53:18',116,40),('2026-10-29 08:53:18',117,41);
/*!40000 ALTER TABLE `favori_salle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horaire`
--

DROP TABLE IF EXISTS `horaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horaire` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jour_semaine` smallint NOT NULL,
  `heure_ouverture` time NOT NULL,
  `heure_fermeture` time NOT NULL,
  `salle_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_horaire_salle_jour` (`salle_id`,`jour_semaine`),
  KEY `IDX_BBC83DB6DC304035` (`salle_id`),
  CONSTRAINT `FK_BBC83DB6DC304035` FOREIGN KEY (`salle_id`) REFERENCES `salle` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=228 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horaire`
--

LOCK TABLES `horaire` WRITE;
/*!40000 ALTER TABLE `horaire` DISABLE KEYS */;
INSERT INTO `horaire` VALUES (204,1,'07:00:00','22:00:00',39),(205,2,'07:00:00','22:00:00',39),(206,3,'07:00:00','22:00:00',39),(207,4,'07:00:00','22:00:00',39),(208,5,'07:00:00','22:00:00',39),(209,6,'09:00:00','19:00:00',39),(210,1,'07:00:00','22:00:00',40),(211,2,'07:00:00','22:00:00',40),(212,3,'07:00:00','22:00:00',40),(213,4,'07:00:00','22:00:00',40),(214,5,'07:00:00','22:00:00',40),(215,6,'09:00:00','19:00:00',40),(216,1,'07:00:00','22:00:00',41),(217,2,'07:00:00','22:00:00',41),(218,3,'07:00:00','22:00:00',41),(219,4,'07:00:00','22:00:00',41),(220,5,'07:00:00','22:00:00',41),(221,6,'09:00:00','19:00:00',41),(222,1,'07:00:00','22:00:00',42),(223,2,'07:00:00','22:00:00',42),(224,3,'07:00:00','22:00:00',42),(225,4,'07:00:00','22:00:00',42),(226,5,'07:00:00','22:00:00',42),(227,6,'09:00:00','19:00:00',42);
/*!40000 ALTER TABLE `horaire` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `sujet` varchar(255) NOT NULL,
  `contenu` longtext NOT NULL,
  `date_envoi` datetime NOT NULL,
  `est_lue` tinyint NOT NULL,
  `utilisateur_id` int NOT NULL,
  `reservation_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_BF5476CAFB88E14F` (`utilisateur_id`),
  KEY `IDX_BF5476CAB83297E7` (`reservation_id`),
  CONSTRAINT `FK_BF5476CAB83297E7` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_BF5476CAFB88E14F` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation`
--

DROP TABLE IF EXISTS `reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date_reservation` datetime NOT NULL,
  `statut` varchar(20) NOT NULL,
  `nb_places` int NOT NULL,
  `code_qr` varchar(255) DEFAULT NULL,
  `utilisateur_id` int NOT NULL,
  `seance_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_reservation_utilisateur_seance` (`utilisateur_id`,`seance_id`),
  KEY `IDX_42C84955FB88E14F` (`utilisateur_id`),
  KEY `IDX_42C84955E3797A94` (`seance_id`),
  CONSTRAINT `FK_42C84955E3797A94` FOREIGN KEY (`seance_id`) REFERENCES `seance` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_42C84955FB88E14F` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1293 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation`
--

LOCK TABLES `reservation` WRITE;
/*!40000 ALTER TABLE `reservation` DISABLE KEYS */;
INSERT INTO `reservation` VALUES (1148,'2026-10-29 08:53:18','terminee',1,'FB-DD48A7EDA352',116,1276),(1149,'2026-10-29 08:53:18','terminee',1,'FB-609F7DE501FB',117,1276),(1150,'2026-10-29 08:53:18','terminee',1,'FB-AE1CF38745AF',117,1277),(1151,'2026-10-29 08:53:18','terminee',1,'FB-B85BF50FA9BE',118,1278),(1152,'2026-10-29 08:53:18','terminee',1,'FB-4D1F4F1FC13B',119,1279),(1153,'2026-10-29 08:53:18','terminee',1,'FB-A280C05E73EE',120,1279),(1154,'2026-10-29 08:53:18','terminee',1,'FB-C1A63CE63CF9',120,1280),(1155,'2026-10-29 08:53:18','terminee',1,'FB-7BCEAFB078A7',116,1281),(1156,'2026-10-29 08:53:18','terminee',1,'FB-634E88FDFC2B',117,1288),(1157,'2026-10-29 08:53:18','terminee',1,'FB-77A02432098C',118,1288),(1158,'2026-10-29 08:53:18','terminee',1,'FB-0A413BC25E76',118,1289),(1159,'2026-10-29 08:53:18','terminee',1,'FB-82762EA34AC5',119,1290),(1160,'2026-10-29 08:53:18','terminee',1,'FB-FAD485F07969',120,1291),(1161,'2026-10-29 08:53:18','terminee',1,'FB-305C104E3E6B',116,1291),(1162,'2026-10-29 08:53:18','terminee',1,'FB-66C766F1E2E2',116,1292),(1163,'2026-10-29 08:53:18','terminee',1,'FB-F4ADCC8135D1',117,1300),(1164,'2026-10-29 08:53:18','terminee',1,'FB-3353F8010AB7',118,1301),(1165,'2026-10-29 08:53:18','terminee',1,'FB-EF5F3DE73E0F',119,1301),(1166,'2026-10-29 08:53:18','terminee',1,'FB-9F109C257FC7',119,1302),(1167,'2026-10-29 08:53:18','terminee',1,'FB-F169E75D4441',120,1303),(1168,'2026-10-29 08:53:18','terminee',1,'FB-71011A5EF27B',116,1304),(1169,'2026-10-29 08:53:18','terminee',1,'FB-C2EEDE0E0FA1',117,1304),(1170,'2026-10-29 08:53:18','terminee',1,'FB-062D3499EFC5',117,1312),(1171,'2026-10-29 08:53:18','terminee',1,'FB-77522CFDB177',118,1313),(1172,'2026-10-29 08:53:18','terminee',1,'FB-A45F5CF3B4C0',119,1314),(1173,'2026-10-29 08:53:18','terminee',1,'FB-F536F4AE6DBD',120,1314),(1174,'2026-10-29 08:53:18','terminee',1,'FB-B239877B8E27',120,1315),(1175,'2026-10-29 08:53:18','terminee',1,'FB-373978AE9863',116,1317),(1176,'2026-10-29 08:53:18','terminee',1,'FB-3756EE342051',117,1324),(1177,'2026-10-29 08:53:18','terminee',1,'FB-E841F2635D65',118,1324),(1178,'2026-10-29 08:53:18','terminee',1,'FB-27341CC8BE40',118,1325),(1179,'2026-10-29 08:53:18','terminee',1,'FB-D35BBC1D629F',119,1326),(1180,'2026-10-29 08:53:18','terminee',1,'FB-B9D8415DAB87',120,1327),(1181,'2026-10-29 08:53:18','terminee',1,'FB-EB83F865F5CB',116,1327),(1182,'2026-10-29 08:53:18','terminee',1,'FB-99145C1FCB34',116,1336),(1183,'2026-10-29 08:53:18','terminee',1,'FB-D00D367813BC',117,1337),(1184,'2026-10-29 08:53:18','terminee',1,'FB-C111FBA020C8',118,1338),(1185,'2026-10-29 08:53:18','terminee',1,'FB-00CC9B0B1933',119,1338),(1186,'2026-10-29 08:53:18','terminee',1,'FB-9747A03B6063',119,1339),(1187,'2026-10-29 08:53:18','terminee',1,'FB-B8A18A650057',120,1340),(1188,'2026-10-29 08:53:18','terminee',1,'FB-2A196C433310',116,1348),(1189,'2026-10-29 08:53:18','terminee',1,'FB-C7B9CF89A882',117,1348),(1190,'2026-10-29 08:53:18','terminee',1,'FB-F0BFE8CC487A',117,1349),(1191,'2026-10-29 08:53:18','terminee',1,'FB-4BED1D1BC643',118,1350),(1192,'2026-10-29 08:53:18','terminee',1,'FB-DE19C47EC04A',119,1351),(1193,'2026-10-29 08:53:18','terminee',1,'FB-78D4EFA376F4',120,1351),(1194,'2026-10-29 08:53:18','terminee',1,'FB-37D3311EB08A',120,1352),(1195,'2026-10-29 08:53:18','terminee',1,'FB-B45EF3DB47FD',116,1353),(1196,'2026-10-29 08:53:18','terminee',1,'FB-84BFCA50976E',117,1360),(1197,'2026-10-29 08:53:18','terminee',1,'FB-9FFE94A6C777',118,1360),(1198,'2026-10-29 08:53:18','terminee',1,'FB-1E311F4D0629',118,1361),(1199,'2026-10-29 08:53:18','terminee',1,'FB-BEF1C8B19406',119,1362),(1200,'2026-10-29 08:53:18','terminee',1,'FB-6DDE15E9345E',120,1363),(1201,'2026-10-29 08:53:18','terminee',1,'FB-01361944EB19',116,1363),(1202,'2026-10-29 08:53:18','terminee',1,'FB-8D6A2DEFA2F2',116,1364),(1203,'2026-10-29 08:53:18','terminee',1,'FB-C7C1E7310252',117,1372),(1204,'2026-10-29 08:53:18','terminee',1,'FB-890D7A5DEE55',118,1373),(1205,'2026-10-29 08:53:18','terminee',1,'FB-F16638332CA7',119,1373),(1206,'2026-10-29 08:53:18','terminee',1,'FB-BC3FC5FEBA3B',119,1374),(1207,'2026-10-29 08:53:18','terminee',1,'FB-7CFC76FCDF3F',120,1375),(1208,'2026-10-29 08:53:18','terminee',1,'FB-B1CAE3884BF4',116,1384),(1209,'2026-10-29 08:53:18','terminee',1,'FB-95EE7E25302A',117,1384),(1210,'2026-10-29 08:53:18','terminee',1,'FB-41145C2CFF45',117,1385),(1211,'2026-10-29 08:53:18','terminee',1,'FB-1A9C749BC06E',118,1386),(1212,'2026-10-29 08:53:18','terminee',1,'FB-0DBDEED6C0D3',119,1387),(1213,'2026-10-29 08:53:18','terminee',1,'FB-33A43F628B45',120,1387),(1214,'2026-10-29 08:53:18','terminee',1,'FB-AD364EF0C513',120,1389),(1215,'2026-10-29 08:53:18','terminee',1,'FB-C03027AE7BF7',116,1396),(1216,'2026-10-29 08:53:18','terminee',1,'FB-FA7788C1849B',117,1397),(1217,'2026-10-29 08:53:18','terminee',1,'FB-A99E66416279',118,1397),(1218,'2026-10-29 08:53:18','terminee',1,'FB-E89E2F361F7A',118,1398),(1219,'2026-10-29 08:53:18','terminee',1,'FB-0F35E7EAD762',119,1399),(1220,'2026-10-29 08:53:18','terminee',1,'FB-DA4EE223BA01',120,1400),(1221,'2026-10-29 08:53:18','terminee',1,'FB-C6E96BB5ECE7',116,1400),(1222,'2026-10-29 08:53:18','terminee',1,'FB-65C292B1FEB0',116,1408),(1223,'2026-10-29 08:53:18','terminee',1,'FB-E753097D036B',117,1409),(1224,'2026-10-29 08:53:18','terminee',1,'FB-41138E1585F1',118,1410),(1225,'2026-10-29 08:53:18','terminee',1,'FB-7B6CAE188A6D',119,1410),(1226,'2026-10-29 08:53:18','terminee',1,'FB-69D40867757E',119,1411),(1227,'2026-10-29 08:53:18','terminee',1,'FB-63EBB27FD0B8',120,1412),(1228,'2026-10-29 08:53:18','terminee',1,'FB-ADD08442723D',116,1423),(1229,'2026-10-29 08:53:18','terminee',1,'FB-D780F4689461',117,1423),(1230,'2026-10-29 08:53:18','terminee',1,'FB-63FD1571AF67',117,1427),(1231,'2026-10-29 08:53:18','terminee',1,'FB-B674D59A895F',118,1431),(1232,'2026-10-29 08:53:18','confirmee',1,'FB-2F98B1347058',116,1282),(1233,'2026-10-29 08:53:18','annulee',1,'FB-12FBBB54B37C',118,1282),(1234,'2026-10-29 08:53:18','confirmee',1,'FB-90794CD4CF5C',118,1284),(1235,'2026-10-29 08:53:18','confirmee',1,'FB-A1F66D6F8CA5',120,1286),(1236,'2026-10-29 08:53:18','confirmee',1,'FB-32EFD6DEBFDE',117,1293),(1237,'2026-10-29 08:53:18','annulee',1,'FB-A75A9155A9D9',120,1294),(1238,'2026-10-29 08:53:18','confirmee',1,'FB-4E133B0A3237',119,1295),(1239,'2026-10-29 08:53:18','confirmee',1,'FB-0A874E6E457A',116,1297),(1240,'2026-10-29 08:53:18','confirmee',1,'FB-1E5863D11CE7',118,1299),(1241,'2026-10-29 08:53:18','confirmee',1,'FB-593FC65776E8',120,1306),(1242,'2026-10-29 08:53:18','annulee',1,'FB-30E10BC513AC',117,1306),(1243,'2026-10-29 08:53:18','confirmee',1,'FB-8E48B471A4F2',117,1308),(1244,'2026-10-29 08:53:18','confirmee',1,'FB-5FB9A6EE4D30',119,1310),(1245,'2026-10-29 08:53:18','confirmee',1,'FB-1657A3256ED9',116,1316),(1246,'2026-10-29 08:53:18','annulee',1,'FB-839B6A6210CE',119,1318),(1247,'2026-10-29 08:53:18','confirmee',1,'FB-A61355813195',118,1319),(1248,'2026-10-29 08:53:18','confirmee',1,'FB-E805F2D2DA37',120,1321),(1249,'2026-10-29 08:53:18','confirmee',1,'FB-C3005F3B82CD',117,1323),(1250,'2026-10-29 08:53:18','confirmee',1,'FB-A012F8E6D9C7',119,1329),(1251,'2026-10-29 08:53:18','annulee',1,'FB-5406CC2BD419',116,1329),(1252,'2026-10-29 08:53:18','confirmee',1,'FB-B3C68D2F5853',116,1331),(1253,'2026-10-29 08:53:18','confirmee',1,'FB-520E48031E06',118,1333),(1254,'2026-10-29 08:53:18','confirmee',1,'FB-9967841A0475',120,1335),(1255,'2026-10-29 08:53:18','annulee',1,'FB-9C57A5B791B6',118,1341),(1256,'2026-10-29 08:53:18','confirmee',1,'FB-038B9B8A4774',117,1342),(1257,'2026-10-29 08:53:18','confirmee',1,'FB-C617FDE967F9',119,1344),(1258,'2026-10-29 08:53:18','confirmee',1,'FB-DF481BD1FEDD',116,1346),(1259,'2026-10-29 08:53:18','confirmee',1,'FB-64919B13E65B',118,1354),(1260,'2026-10-29 08:53:18','annulee',1,'FB-581B09266393',120,1354),(1261,'2026-10-29 08:53:18','confirmee',1,'FB-727D33211DE5',120,1356),(1262,'2026-10-29 08:53:18','confirmee',1,'FB-833DBFDF9066',117,1358),(1263,'2026-10-29 08:53:18','confirmee',1,'FB-490D128C23AD',119,1365),(1264,'2026-10-29 08:53:18','annulee',1,'FB-AF51A15FD976',117,1366),(1265,'2026-10-29 08:53:18','confirmee',1,'FB-B09CD9138E16',116,1367),(1266,'2026-10-29 08:53:18','confirmee',1,'FB-10E49C155401',118,1369),(1267,'2026-10-29 08:53:18','confirmee',1,'FB-7CA8CBAC7D98',120,1371),(1268,'2026-10-29 08:53:18','confirmee',1,'FB-B90AC2EDBE58',117,1377),(1269,'2026-10-29 08:53:18','annulee',1,'FB-02C8F45C2D35',119,1377),(1270,'2026-10-29 08:53:18','confirmee',1,'FB-915009A91BF7',119,1379),(1271,'2026-10-29 08:53:18','confirmee',1,'FB-D66C04ECD21F',116,1381),(1272,'2026-10-29 08:53:18','confirmee',1,'FB-B48A9EC656E6',118,1383),(1273,'2026-10-29 08:53:18','annulee',1,'FB-8D8513DFD51B',116,1388),(1274,'2026-10-29 08:53:18','confirmee',1,'FB-05D35458464C',120,1390),(1275,'2026-10-29 08:53:18','confirmee',1,'FB-C81642548CA0',117,1392),(1276,'2026-10-29 08:53:18','confirmee',1,'FB-341C8F67C1D1',119,1394),(1277,'2026-10-29 08:53:18','confirmee',1,'FB-911C6BC43FC8',116,1401),(1278,'2026-10-29 08:53:18','annulee',1,'FB-F0B624380A34',118,1401),(1279,'2026-10-29 08:53:18','confirmee',1,'FB-E683CF7F07CA',118,1403),(1280,'2026-10-29 08:53:18','confirmee',1,'FB-BEA44D422037',120,1405),(1281,'2026-10-29 08:53:18','confirmee',1,'FB-03BA55E5FEB0',117,1407),(1282,'2026-10-29 08:53:18','annulee',1,'FB-C6D14898DDE0',120,1413),(1283,'2026-10-29 08:53:18','confirmee',1,'FB-505BCE995A9D',119,1414),(1284,'2026-10-29 08:53:18','confirmee',1,'FB-7E67837917F7',116,1416),(1285,'2026-10-29 08:53:18','confirmee',1,'FB-C01084A6A5F4',118,1418),(1286,'2026-10-29 08:53:18','confirmee',1,'FB-7422AAAF7A03',120,1420),(1287,'2026-10-29 08:53:18','annulee',1,'FB-9823AEEF3527',117,1420),(1288,'2026-10-29 08:53:18','confirmee',1,'FB-8AF998D0596D',117,1422),(1289,'2026-10-29 08:53:18','confirmee',1,'FB-553CCA048374',119,1425),(1290,'2026-10-29 08:53:18','confirmee',1,'FB-596B5E41E043',116,1428),(1291,'2026-10-29 08:53:18','annulee',1,'FB-B275D082742E',119,1429),(1292,'2026-10-29 08:53:18','confirmee',1,'FB-943DC942D620',118,1430);
/*!40000 ALTER TABLE `reservation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salle`
--

DROP TABLE IF EXISTS `salle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) NOT NULL,
  `description` longtext,
  `adresse` varchar(255) NOT NULL,
  `ville` varchar(100) NOT NULL,
  `code_postal` varchar(10) NOT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `capacite_totale` int NOT NULL,
  `gestionnaire_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_4E977E5C6885AC1B` (`gestionnaire_id`),
  CONSTRAINT `FK_4E977E5C6885AC1B` FOREIGN KEY (`gestionnaire_id`) REFERENCES `utilisateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salle`
--

LOCK TABLES `salle` WRITE;
/*!40000 ALTER TABLE `salle` DISABLE KEYS */;
INSERT INTO `salle` VALUES (39,'FitZone Lyon Part-Dieu','Salle moderne de 800 m² au cœur de Lyon : plateau musculation, studios de cours collectifs, sauna.','12 rue Servient','Lyon','69003',45.760000,4.857000,'0472000001','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',120,110),(40,'Yoga Loft Croix-Rousse','Studio chaleureux dédié au yoga, au pilates et à la méditation.','5 place de la Croix-Rousse','Lyon','69004',45.774000,4.832000,'0472000002','https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',25,110),(41,'Urban Fitness Bastille','Club 24h/24 avec coachs sur place, espace cross-training et piscine.','30 boulevard Richard-Lenoir','Paris','75011',48.856000,2.370000,'0143000003','https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800',200,111),(42,'Boxing Club République','Salle de boxe anglaise et pieds-poings, cours tous niveaux.','8 rue du Temple','Paris','75003',48.864000,2.355000,'0143000004','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',40,111);
/*!40000 ALTER TABLE `salle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seance`
--

DROP TABLE IF EXISTS `seance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `capacite` int NOT NULL,
  `prix` decimal(8,2) NOT NULL,
  `statut` varchar(20) NOT NULL,
  `lieu` varchar(255) DEFAULT NULL,
  `cours_id` int DEFAULT NULL,
  `coach_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_seance_date_debut` (`date_debut`),
  KEY `IDX_DF7DFD0E7ECF78B0` (`cours_id`),
  KEY `IDX_DF7DFD0E3C105691` (`coach_id`),
  CONSTRAINT `FK_DF7DFD0E3C105691` FOREIGN KEY (`coach_id`) REFERENCES `coach` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_DF7DFD0E7ECF78B0` FOREIGN KEY (`cours_id`) REFERENCES `cours` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_seance_cours_xor_coach` CHECK (((`cours_id` is null) <> (`coach_id` is null)))
) ENGINE=InnoDB AUTO_INCREMENT=1433 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seance`
--

LOCK TABLES `seance` WRITE;
/*!40000 ALTER TABLE `seance` DISABLE KEYS */;
INSERT INTO `seance` VALUES (1276,'2026-10-12 07:30:00','2026-10-12 08:30:00',15,12.00,'terminee',NULL,103,NULL),(1277,'2026-10-14 12:15:00','2026-10-14 13:15:00',15,12.00,'terminee',NULL,103,NULL),(1278,'2026-10-19 07:30:00','2026-10-19 08:30:00',15,12.00,'terminee',NULL,103,NULL),(1279,'2026-10-21 12:15:00','2026-10-21 13:15:00',15,12.00,'terminee',NULL,103,NULL),(1280,'2026-10-26 07:30:00','2026-10-26 08:30:00',15,12.00,'terminee',NULL,103,NULL),(1281,'2026-10-28 12:15:00','2026-10-28 13:15:00',15,12.00,'terminee',NULL,103,NULL),(1282,'2026-11-02 07:30:00','2026-11-02 08:30:00',15,12.00,'planifiee',NULL,103,NULL),(1283,'2026-11-04 12:15:00','2026-11-04 13:15:00',15,12.00,'planifiee',NULL,103,NULL),(1284,'2026-11-09 07:30:00','2026-11-09 08:30:00',15,12.00,'planifiee',NULL,103,NULL),(1285,'2026-11-11 12:15:00','2026-11-11 13:15:00',15,12.00,'planifiee',NULL,103,NULL),(1286,'2026-11-16 07:30:00','2026-11-16 08:30:00',15,12.00,'planifiee',NULL,103,NULL),(1287,'2026-11-18 12:15:00','2026-11-18 13:15:00',15,12.00,'planifiee',NULL,103,NULL),(1288,'2026-10-13 09:00:00','2026-10-13 10:00:00',12,15.00,'terminee',NULL,104,NULL),(1289,'2026-10-15 18:00:00','2026-10-15 19:00:00',12,15.00,'terminee',NULL,104,NULL),(1290,'2026-10-20 09:00:00','2026-10-20 10:00:00',12,15.00,'terminee',NULL,104,NULL),(1291,'2026-10-22 18:00:00','2026-10-22 19:00:00',12,15.00,'terminee',NULL,104,NULL),(1292,'2026-10-27 09:00:00','2026-10-27 10:00:00',12,15.00,'terminee',NULL,104,NULL),(1293,'2026-10-29 18:00:00','2026-10-29 19:00:00',12,15.00,'planifiee',NULL,104,NULL),(1294,'2026-11-03 09:00:00','2026-11-03 10:00:00',12,15.00,'planifiee',NULL,104,NULL),(1295,'2026-11-05 18:00:00','2026-11-05 19:00:00',12,15.00,'planifiee',NULL,104,NULL),(1296,'2026-11-10 09:00:00','2026-11-10 10:00:00',12,15.00,'planifiee',NULL,104,NULL),(1297,'2026-11-12 18:00:00','2026-11-12 19:00:00',12,15.00,'planifiee',NULL,104,NULL),(1298,'2026-11-17 09:00:00','2026-11-17 10:00:00',12,15.00,'planifiee',NULL,104,NULL),(1299,'2026-11-19 18:00:00','2026-11-19 19:00:00',12,15.00,'planifiee',NULL,104,NULL),(1300,'2026-10-14 12:15:00','2026-10-14 13:00:00',20,10.00,'terminee',NULL,105,NULL),(1301,'2026-10-16 19:30:00','2026-10-16 20:15:00',20,10.00,'terminee',NULL,105,NULL),(1302,'2026-10-21 12:15:00','2026-10-21 13:00:00',20,10.00,'terminee',NULL,105,NULL),(1303,'2026-10-23 19:30:00','2026-10-23 20:15:00',20,10.00,'terminee',NULL,105,NULL),(1304,'2026-10-28 12:15:00','2026-10-28 13:00:00',20,10.00,'terminee',NULL,105,NULL),(1305,'2026-10-30 19:30:00','2026-10-30 20:15:00',20,10.00,'planifiee',NULL,105,NULL),(1306,'2026-11-04 12:15:00','2026-11-04 13:00:00',20,10.00,'planifiee',NULL,105,NULL),(1307,'2026-11-06 19:30:00','2026-11-06 20:15:00',20,10.00,'planifiee',NULL,105,NULL),(1308,'2026-11-11 12:15:00','2026-11-11 13:00:00',20,10.00,'planifiee',NULL,105,NULL),(1309,'2026-11-13 19:30:00','2026-11-13 20:15:00',20,10.00,'planifiee',NULL,105,NULL),(1310,'2026-11-18 12:15:00','2026-11-18 13:00:00',20,10.00,'planifiee',NULL,105,NULL),(1311,'2026-11-20 19:30:00','2026-11-20 20:15:00',20,10.00,'planifiee',NULL,105,NULL),(1312,'2026-10-15 18:00:00','2026-10-15 19:00:00',25,9.00,'terminee',NULL,106,NULL),(1313,'2026-10-14 07:30:00','2026-10-14 08:30:00',25,9.00,'terminee',NULL,106,NULL),(1314,'2026-10-22 18:00:00','2026-10-22 19:00:00',25,9.00,'terminee',NULL,106,NULL),(1315,'2026-10-21 07:30:00','2026-10-21 08:30:00',25,9.00,'terminee',NULL,106,NULL),(1316,'2026-10-29 18:00:00','2026-10-29 19:00:00',25,9.00,'planifiee',NULL,106,NULL),(1317,'2026-10-28 07:30:00','2026-10-28 08:30:00',25,9.00,'terminee',NULL,106,NULL),(1318,'2026-11-05 18:00:00','2026-11-05 19:00:00',25,9.00,'planifiee',NULL,106,NULL),(1319,'2026-11-04 07:30:00','2026-11-04 08:30:00',25,9.00,'planifiee',NULL,106,NULL),(1320,'2026-11-12 18:00:00','2026-11-12 19:00:00',25,9.00,'planifiee',NULL,106,NULL),(1321,'2026-11-11 07:30:00','2026-11-11 08:30:00',25,9.00,'planifiee',NULL,106,NULL),(1322,'2026-11-19 18:00:00','2026-11-19 19:00:00',25,9.00,'planifiee',NULL,106,NULL),(1323,'2026-11-18 07:30:00','2026-11-18 08:30:00',25,9.00,'planifiee',NULL,106,NULL),(1324,'2026-10-16 19:30:00','2026-10-16 20:45:00',12,18.00,'terminee',NULL,107,NULL),(1325,'2026-10-15 09:00:00','2026-10-15 10:15:00',12,18.00,'terminee',NULL,107,NULL),(1326,'2026-10-23 19:30:00','2026-10-23 20:45:00',12,18.00,'terminee',NULL,107,NULL),(1327,'2026-10-22 09:00:00','2026-10-22 10:15:00',12,18.00,'terminee',NULL,107,NULL),(1328,'2026-10-30 19:30:00','2026-10-30 20:45:00',12,18.00,'planifiee',NULL,107,NULL),(1329,'2026-10-29 09:00:00','2026-10-29 10:15:00',12,18.00,'planifiee',NULL,107,NULL),(1330,'2026-11-06 19:30:00','2026-11-06 20:45:00',12,18.00,'planifiee',NULL,107,NULL),(1331,'2026-11-05 09:00:00','2026-11-05 10:15:00',12,18.00,'planifiee',NULL,107,NULL),(1332,'2026-11-13 19:30:00','2026-11-13 20:45:00',12,18.00,'planifiee',NULL,107,NULL),(1333,'2026-11-12 09:00:00','2026-11-12 10:15:00',12,18.00,'planifiee',NULL,107,NULL),(1334,'2026-11-20 19:30:00','2026-11-20 20:45:00',12,18.00,'planifiee',NULL,107,NULL),(1335,'2026-11-19 09:00:00','2026-11-19 10:15:00',12,18.00,'planifiee',NULL,107,NULL),(1336,'2026-10-12 07:30:00','2026-10-12 08:30:00',10,16.00,'terminee',NULL,108,NULL),(1337,'2026-10-16 12:15:00','2026-10-16 13:15:00',10,16.00,'terminee',NULL,108,NULL),(1338,'2026-10-19 07:30:00','2026-10-19 08:30:00',10,16.00,'terminee',NULL,108,NULL),(1339,'2026-10-23 12:15:00','2026-10-23 13:15:00',10,16.00,'terminee',NULL,108,NULL),(1340,'2026-10-26 07:30:00','2026-10-26 08:30:00',10,16.00,'terminee',NULL,108,NULL),(1341,'2026-10-30 12:15:00','2026-10-30 13:15:00',10,16.00,'planifiee',NULL,108,NULL),(1342,'2026-11-02 07:30:00','2026-11-02 08:30:00',10,16.00,'planifiee',NULL,108,NULL),(1343,'2026-11-06 12:15:00','2026-11-06 13:15:00',10,16.00,'planifiee',NULL,108,NULL),(1344,'2026-11-09 07:30:00','2026-11-09 08:30:00',10,16.00,'planifiee',NULL,108,NULL),(1345,'2026-11-13 12:15:00','2026-11-13 13:15:00',10,16.00,'planifiee',NULL,108,NULL),(1346,'2026-11-16 07:30:00','2026-11-16 08:30:00',10,16.00,'planifiee',NULL,108,NULL),(1347,'2026-11-20 12:15:00','2026-11-20 13:15:00',10,16.00,'planifiee',NULL,108,NULL),(1348,'2026-10-13 09:00:00','2026-10-13 10:00:00',12,15.00,'terminee',NULL,109,NULL),(1349,'2026-10-14 18:00:00','2026-10-14 19:00:00',12,15.00,'terminee',NULL,109,NULL),(1350,'2026-10-20 09:00:00','2026-10-20 10:00:00',12,15.00,'terminee',NULL,109,NULL),(1351,'2026-10-21 18:00:00','2026-10-21 19:00:00',12,15.00,'terminee',NULL,109,NULL),(1352,'2026-10-27 09:00:00','2026-10-27 10:00:00',12,15.00,'terminee',NULL,109,NULL),(1353,'2026-10-28 18:00:00','2026-10-28 19:00:00',12,15.00,'terminee',NULL,109,NULL),(1354,'2026-11-03 09:00:00','2026-11-03 10:00:00',12,15.00,'planifiee',NULL,109,NULL),(1355,'2026-11-04 18:00:00','2026-11-04 19:00:00',12,15.00,'planifiee',NULL,109,NULL),(1356,'2026-11-10 09:00:00','2026-11-10 10:00:00',12,15.00,'planifiee',NULL,109,NULL),(1357,'2026-11-11 18:00:00','2026-11-11 19:00:00',12,15.00,'planifiee',NULL,109,NULL),(1358,'2026-11-17 09:00:00','2026-11-17 10:00:00',12,15.00,'planifiee',NULL,109,NULL),(1359,'2026-11-18 18:00:00','2026-11-18 19:00:00',12,15.00,'planifiee',NULL,109,NULL),(1360,'2026-10-14 12:15:00','2026-10-14 13:45:00',8,20.00,'terminee',NULL,110,NULL),(1361,'2026-10-15 19:30:00','2026-10-15 21:00:00',8,20.00,'terminee',NULL,110,NULL),(1362,'2026-10-21 12:15:00','2026-10-21 13:45:00',8,20.00,'terminee',NULL,110,NULL),(1363,'2026-10-22 19:30:00','2026-10-22 21:00:00',8,20.00,'terminee',NULL,110,NULL),(1364,'2026-10-28 12:15:00','2026-10-28 13:45:00',8,20.00,'terminee',NULL,110,NULL),(1365,'2026-10-29 19:30:00','2026-10-29 21:00:00',8,20.00,'planifiee',NULL,110,NULL),(1366,'2026-11-04 12:15:00','2026-11-04 13:45:00',8,20.00,'planifiee',NULL,110,NULL),(1367,'2026-11-05 19:30:00','2026-11-05 21:00:00',8,20.00,'planifiee',NULL,110,NULL),(1368,'2026-11-11 12:15:00','2026-11-11 13:45:00',8,20.00,'planifiee',NULL,110,NULL),(1369,'2026-11-12 19:30:00','2026-11-12 21:00:00',8,20.00,'planifiee',NULL,110,NULL),(1370,'2026-11-18 12:15:00','2026-11-18 13:45:00',8,20.00,'planifiee',NULL,110,NULL),(1371,'2026-11-19 19:30:00','2026-11-19 21:00:00',8,20.00,'planifiee',NULL,110,NULL),(1372,'2026-10-15 18:00:00','2026-10-15 18:45:00',15,11.00,'terminee',NULL,111,NULL),(1373,'2026-10-16 07:30:00','2026-10-16 08:15:00',15,11.00,'terminee',NULL,111,NULL),(1374,'2026-10-22 18:00:00','2026-10-22 18:45:00',15,11.00,'terminee',NULL,111,NULL),(1375,'2026-10-23 07:30:00','2026-10-23 08:15:00',15,11.00,'terminee',NULL,111,NULL),(1376,'2026-10-29 18:00:00','2026-10-29 18:45:00',15,11.00,'planifiee',NULL,111,NULL),(1377,'2026-10-30 07:30:00','2026-10-30 08:15:00',15,11.00,'planifiee',NULL,111,NULL),(1378,'2026-11-05 18:00:00','2026-11-05 18:45:00',15,11.00,'planifiee',NULL,111,NULL),(1379,'2026-11-06 07:30:00','2026-11-06 08:15:00',15,11.00,'planifiee',NULL,111,NULL),(1380,'2026-11-12 18:00:00','2026-11-12 18:45:00',15,11.00,'planifiee',NULL,111,NULL),(1381,'2026-11-13 07:30:00','2026-11-13 08:15:00',15,11.00,'planifiee',NULL,111,NULL),(1382,'2026-11-19 18:00:00','2026-11-19 18:45:00',15,11.00,'planifiee',NULL,111,NULL),(1383,'2026-11-20 07:30:00','2026-11-20 08:15:00',15,11.00,'planifiee',NULL,111,NULL),(1384,'2026-10-16 19:30:00','2026-10-16 20:30:00',30,8.00,'terminee',NULL,112,NULL),(1385,'2026-10-14 09:00:00','2026-10-14 10:00:00',30,8.00,'terminee',NULL,112,NULL),(1386,'2026-10-23 19:30:00','2026-10-23 20:30:00',30,8.00,'terminee',NULL,112,NULL),(1387,'2026-10-21 09:00:00','2026-10-21 10:00:00',30,8.00,'terminee',NULL,112,NULL),(1388,'2026-10-30 19:30:00','2026-10-30 20:30:00',30,8.00,'planifiee',NULL,112,NULL),(1389,'2026-10-28 09:00:00','2026-10-28 10:00:00',30,8.00,'terminee',NULL,112,NULL),(1390,'2026-11-06 19:30:00','2026-11-06 20:30:00',30,8.00,'planifiee',NULL,112,NULL),(1391,'2026-11-04 09:00:00','2026-11-04 10:00:00',30,8.00,'planifiee',NULL,112,NULL),(1392,'2026-11-13 19:30:00','2026-11-13 20:30:00',30,8.00,'planifiee',NULL,112,NULL),(1393,'2026-11-11 09:00:00','2026-11-11 10:00:00',30,8.00,'planifiee',NULL,112,NULL),(1394,'2026-11-20 19:30:00','2026-11-20 20:30:00',30,8.00,'planifiee',NULL,112,NULL),(1395,'2026-11-18 09:00:00','2026-11-18 10:00:00',30,8.00,'planifiee',NULL,112,NULL),(1396,'2026-10-12 07:30:00','2026-10-12 08:30:00',16,14.00,'terminee',NULL,113,NULL),(1397,'2026-10-15 12:15:00','2026-10-15 13:15:00',16,14.00,'terminee',NULL,113,NULL),(1398,'2026-10-19 07:30:00','2026-10-19 08:30:00',16,14.00,'terminee',NULL,113,NULL),(1399,'2026-10-22 12:15:00','2026-10-22 13:15:00',16,14.00,'terminee',NULL,113,NULL),(1400,'2026-10-26 07:30:00','2026-10-26 08:30:00',16,14.00,'terminee',NULL,113,NULL),(1401,'2026-10-29 12:15:00','2026-10-29 13:15:00',16,14.00,'planifiee',NULL,113,NULL),(1402,'2026-11-02 07:30:00','2026-11-02 08:30:00',16,14.00,'planifiee',NULL,113,NULL),(1403,'2026-11-05 12:15:00','2026-11-05 13:15:00',16,14.00,'planifiee',NULL,113,NULL),(1404,'2026-11-09 07:30:00','2026-11-09 08:30:00',16,14.00,'planifiee',NULL,113,NULL),(1405,'2026-11-12 12:15:00','2026-11-12 13:15:00',16,14.00,'planifiee',NULL,113,NULL),(1406,'2026-11-16 07:30:00','2026-11-16 08:30:00',16,14.00,'planifiee',NULL,113,NULL),(1407,'2026-11-19 12:15:00','2026-11-19 13:15:00',16,14.00,'planifiee',NULL,113,NULL),(1408,'2026-10-13 09:00:00','2026-10-13 09:45:00',16,12.00,'terminee',NULL,114,NULL),(1409,'2026-10-16 18:00:00','2026-10-16 18:45:00',16,12.00,'terminee',NULL,114,NULL),(1410,'2026-10-20 09:00:00','2026-10-20 09:45:00',16,12.00,'terminee',NULL,114,NULL),(1411,'2026-10-23 18:00:00','2026-10-23 18:45:00',16,12.00,'terminee',NULL,114,NULL),(1412,'2026-10-27 09:00:00','2026-10-27 09:45:00',16,12.00,'terminee',NULL,114,NULL),(1413,'2026-10-30 18:00:00','2026-10-30 18:45:00',16,12.00,'planifiee',NULL,114,NULL),(1414,'2026-11-03 09:00:00','2026-11-03 09:45:00',16,12.00,'planifiee',NULL,114,NULL),(1415,'2026-11-06 18:00:00','2026-11-06 18:45:00',16,12.00,'planifiee',NULL,114,NULL),(1416,'2026-11-10 09:00:00','2026-11-10 09:45:00',16,12.00,'planifiee',NULL,114,NULL),(1417,'2026-11-13 18:00:00','2026-11-13 18:45:00',16,12.00,'planifiee',NULL,114,NULL),(1418,'2026-11-17 09:00:00','2026-11-17 09:45:00',16,12.00,'planifiee',NULL,114,NULL),(1419,'2026-11-20 18:00:00','2026-11-20 18:45:00',16,12.00,'planifiee',NULL,114,NULL),(1420,'2026-11-03 10:00:00','2026-11-03 11:00:00',1,45.00,'complete','Parc de la Tête d\'Or, Lyon',NULL,45),(1421,'2026-11-03 10:00:00','2026-11-03 11:00:00',1,45.00,'planifiee','Parc de la Tête d\'Or, Lyon',NULL,45),(1422,'2026-11-10 10:00:00','2026-11-10 11:00:00',1,45.00,'complete','Parc de la Tête d\'Or, Lyon',NULL,45),(1423,'2026-10-21 10:00:00','2026-10-21 11:00:00',1,45.00,'terminee','Parc, Lyon',NULL,45),(1424,'2026-11-04 10:00:00','2026-11-04 11:00:00',1,55.00,'planifiee','Parc de la Tête d\'Or, Lyon',NULL,46),(1425,'2026-11-04 10:00:00','2026-11-04 11:00:00',1,55.00,'complete','Parc de la Tête d\'Or, Lyon',NULL,46),(1426,'2026-11-11 10:00:00','2026-11-11 11:00:00',1,55.00,'planifiee','Parc de la Tête d\'Or, Lyon',NULL,46),(1427,'2026-10-21 10:00:00','2026-10-21 11:00:00',1,55.00,'terminee','Parc, Lyon',NULL,46),(1428,'2026-10-29 10:00:00','2026-10-29 11:00:00',1,40.00,'complete','Parc de la Tête d\'Or, Paris',NULL,47),(1429,'2026-11-05 10:00:00','2026-11-05 11:00:00',1,40.00,'planifiee','Parc de la Tête d\'Or, Paris',NULL,47),(1430,'2026-11-12 10:00:00','2026-11-12 11:00:00',1,40.00,'complete','Parc de la Tête d\'Or, Paris',NULL,47),(1431,'2026-10-21 10:00:00','2026-10-21 11:00:00',1,40.00,'terminee','Parc, Paris',NULL,47);
/*!40000 ALTER TABLE `seance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(180) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `roles` json NOT NULL,
  `est_verifie` tinyint NOT NULL,
  `est_actif` tinyint NOT NULL,
  `date_creation` datetime NOT NULL,
  `token_verification` varchar(64) DEFAULT NULL,
  `token_verification_expire` datetime DEFAULT NULL,
  `token_reset` varchar(64) DEFAULT NULL,
  `token_reset_expire` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_utilisateur_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateur`
--

LOCK TABLES `utilisateur` WRITE;
/*!40000 ALTER TABLE `utilisateur` DISABLE KEYS */;
INSERT INTO `utilisateur` VALUES (109,'admin@fitbook.fr','$2y$13$BDOCUAVFZ3b/GOmhKLhGg.NUbu1oAUU5e8zP6q7gz6njgXtCOCJi2','FitBook','Admin','0607128410',NULL,'[\"ROLE_ADMIN\"]',1,1,'2026-10-29 08:53:14',NULL,NULL,NULL,NULL),(110,'manager@fitbook.fr','$2y$13$icZZ2M8NylWmS0OMDRbb6.zejgLg2eZVHy2xuHA3Va3rpd/2OhUMi','Martin','Sophie','0676978712',NULL,'[\"ROLE_MANAGER\"]',1,1,'2026-10-29 08:53:14',NULL,NULL,NULL,NULL),(111,'manager2@fitbook.fr','$2y$13$D8Er.mkxrt.37q6yWeDidOh9jMrU2O65QR7W7N64eDz9tsE2XEXTC','Benali','Karim','0618557681',NULL,'[\"ROLE_MANAGER\"]',1,1,'2026-10-29 08:53:15',NULL,NULL,NULL,NULL),(112,'coach1@fitbook.fr','$2y$13$f4Y/nj9llrUTqqqKFiWJ9.z.w7t62UUvDXXw/PmMGBMwPs16f4w3W','Dubois','Léa','0658272352',NULL,'[\"ROLE_COACH\"]',1,1,'2026-10-29 08:53:15',NULL,NULL,NULL,NULL),(113,'coach2@fitbook.fr','$2y$13$Bx.WtevrcsZroagUliI0wOUaLgZaRHy5n8u3DOLIL9/2BtzEqgJaS','Moreau','Thomas','0656175248',NULL,'[\"ROLE_COACH\"]',1,1,'2026-10-29 08:53:15',NULL,NULL,NULL,NULL),(114,'coach3@fitbook.fr','$2y$13$PmoRmDqgvzemnoJKGLJ9a.2T70fbORlB5yp.xdit4Vmy4g.zhC1IG','Garcia','Inès','0601206271',NULL,'[\"ROLE_COACH\"]',1,1,'2026-10-29 08:53:16',NULL,NULL,NULL,NULL),(115,'coach4@fitbook.fr','$2y$13$gGw8iG0WlYLxfIETMpnLP.e9zodd6g3y1B8PieiYSlYqLLi4eILmC','Petit','Hugo','0666270320',NULL,'[\"ROLE_COACH\"]',1,1,'2026-10-29 08:53:16',NULL,NULL,NULL,NULL),(116,'user1@fitbook.fr','$2y$13$2f/QQFfJBSUXVmmefBW77uKuL.gw5nr0TXtczdSiwWToNziO/gQQK','Leroy','Emma','0682850084',NULL,'[\"ROLE_USER\"]',1,1,'2026-10-29 08:53:17',NULL,NULL,NULL,NULL),(117,'user2@fitbook.fr','$2y$13$yDY7I6s2rIjHIQKYlBq4huWDdaMg0wGBNgrGh3ENUFukjF0POwBOu','Roux','Lucas','0696810708',NULL,'[\"ROLE_USER\"]',1,1,'2026-10-29 08:53:17',NULL,NULL,NULL,NULL),(118,'user3@fitbook.fr','$2y$13$tv71qmlrJVYtggVzYm/Kv.LeM5LdzKrVs3yym564DYq/brBBnDsPi','Fournier','Chloé','0617908667',NULL,'[\"ROLE_USER\"]',1,1,'2026-10-29 08:53:17',NULL,NULL,NULL,NULL),(119,'user4@fitbook.fr','$2y$13$XdCOo4mntAha4afQoCMvueRsIpdNyDtR4/Sqttc1gbAOIkOmqvV1C','Girard','Nathan','0634032692',NULL,'[\"ROLE_USER\"]',1,1,'2026-10-29 08:53:18',NULL,NULL,NULL,NULL),(120,'user5@fitbook.fr','$2y$13$mpKIuFq7JXHrgc5UKRoIXu6mfE0T1bIk41PpFSrQ6nAYJHjbKsbIe','Lambert','Manon','0633065307',NULL,'[\"ROLE_USER\"]',1,1,'2026-10-29 08:53:18',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `utilisateur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'fitbook'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29  9:57:55
