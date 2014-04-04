# ************************************************************
# Sequel Pro SQL dump
# Version 4096
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: 127.0.0.1 (MySQL 5.1.35-log)
# Database: perber
# Generation Time: 2014-04-04 14:46:21 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table Images
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Images`;

CREATE TABLE `Images` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `imgKey` tinytext NOT NULL,
  `msgID` int(11) NOT NULL,
  `creation_ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table Messages
# ------------------------------------------------------------

DROP TABLE IF EXISTS `Messages`;

CREATE TABLE `Messages` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `music_title` text,
  `music_artist` text,
  `music_album` text,
  `music_cover` text,
  `music_location` text,
  `location` text,
  `retained` tinyint(1) NOT NULL DEFAULT '0',
  `creation_ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;



# Dump of table vote
# ------------------------------------------------------------

DROP TABLE IF EXISTS `vote`;

CREATE TABLE `vote` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `up` int(11) NOT NULL DEFAULT '0',
  `down` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

LOCK TABLES `vote` WRITE;
/*!40000 ALTER TABLE `vote` DISABLE KEYS */;

INSERT INTO `vote` (`id`, `up`, `down`)
VALUES
  (1,0,0);

/*!40000 ALTER TABLE `vote` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
