-- Clomosy Bank System - Railway Import
-- Tablo olusturma, veri ve indexler tek dosyada

-- --------------------------------------------------------
-- TableBankaHesaplar
-- --------------------------------------------------------
CREATE TABLE `TableBankaHesaplar` (
  `MusteriID` int(11) DEFAULT NULL,
  `KartID` int(11) NOT NULL,
  `IBAN` varchar(50) DEFAULT NULL,
  `Bakiye` float DEFAULT 10000,
  `Altin` decimal(18,2) DEFAULT NULL,
  `Dolar` decimal(18,2) DEFAULT NULL,
  `Sterlin` decimal(18,2) DEFAULT NULL,
  `Euro` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`KartID`),
  KEY `idx_musteri_banka` (`MusteriID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- TableKrediHesaplar
-- --------------------------------------------------------
CREATE TABLE `TableKrediHesaplar` (
  `MusteriID` int(11) DEFAULT NULL,
  `KartID` int(11) NOT NULL,
  `BorcMik` float DEFAULT 0,
  `KartLim` float DEFAULT 50000,
  `TCKimlik` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`KartID`),
  KEY `idx_musteri_kredi` (`MusteriID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- TableKurFiyatlari
-- --------------------------------------------------------
CREATE TABLE `TableKurFiyatlari` (
  `KurID` int(11) NOT NULL AUTO_INCREMENT,
  `KurKodu` varchar(10) NOT NULL,
  `KurIsmi` varchar(50) DEFAULT NULL,
  `TLDegeri` decimal(18,4) NOT NULL,
  `GuncellemeTarihi` datetime NOT NULL,
  PRIMARY KEY (`KurID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `TableKurFiyatlari` (`KurID`, `KurKodu`, `KurIsmi`, `TLDegeri`, `GuncellemeTarihi`) VALUES
(1, 'XAU', 'gram_altin', 2540.7500, '2025-05-24 19:16:09'),
(2, 'USD', 'amerikan_dolari', 38.2500, '2025-05-24 19:16:09'),
(3, 'EUR', 'euro', 41.8000, '2025-05-24 19:16:09'),
(4, 'GBP', 'sterlin', 48.1000, '2025-05-24 19:16:09');

-- --------------------------------------------------------
-- TableMusteriler
-- --------------------------------------------------------
CREATE TABLE `TableMusteriler` (
  `MusteriID` int(11) NOT NULL AUTO_INCREMENT,
  `TCKimlik` decimal(11,0) DEFAULT NULL,
  `Sifre` decimal(6,0) DEFAULT NULL,
  `Ad` varchar(25) DEFAULT NULL,
  `Soyad` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`MusteriID`),
  UNIQUE KEY `TCKimlik` (`TCKimlik`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Foreign Keys (InnoDB gerektiriyor)
-- --------------------------------------------------------
ALTER TABLE `TableBankaHesaplar`
  ADD CONSTRAINT `fk_banka_musteri`
  FOREIGN KEY (`MusteriID`) REFERENCES `TableMusteriler` (`MusteriID`)
  ON DELETE CASCADE;

ALTER TABLE `TableKrediHesaplar`
  ADD CONSTRAINT `fk_kredi_musteri`
  FOREIGN KEY (`MusteriID`) REFERENCES `TableMusteriler` (`MusteriID`)
  ON DELETE CASCADE;
