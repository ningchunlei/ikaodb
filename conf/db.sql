CREATE TABLE `timeline` (
      `id` bigint(20) NOT NULL AUTO_INCREMENT,
      `mid` char(40) NOT NULL,
      `uid` char(20) NOT NULL,
      `ctime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      'type' int
      PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `msgcounter` (
      `id` bigint(20) NOT NULL AUTO_INCREMENT,
      `mid` char(40) NOT NULL,
      'count' int default 0,
      PRIMARY KEY (`id`)
) ENGINE=InnoDB;

