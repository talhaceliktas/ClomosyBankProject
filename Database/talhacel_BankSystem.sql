-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 04, 2025 at 08:57 PM
-- Server version: 10.11.11-MariaDB-cll-lve
-- PHP Version: 8.3.15

-- --------------------------------------------------------

--
-- Table structure for table `TableBankaHesaplar`
--

CREATE TABLE `TableBankaHesaplar` (
  `MusteriID` int(11) DEFAULT NULL,
  `KartID` int(11) NOT NULL,
  `IBAN` varchar(50) DEFAULT NULL,
  `Bakiye` float DEFAULT 10000,
  `Altin` decimal(18,2) DEFAULT NULL,
  `Dolar` decimal(18,2) DEFAULT NULL,
  `Sterlin` decimal(18,2) DEFAULT NULL,
  `Euro` decimal(18,2) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- --------------------------------------------------------

--
-- Table structure for table `TableKrediHesaplar`
--

CREATE TABLE `TableKrediHesaplar` (
  `MusteriID` int(11) DEFAULT NULL,
  `KartID` int(11) NOT NULL,
  `BorcMik` float DEFAULT 0,
  `KartLim` float DEFAULT 50000,
  `TCKimlik` varchar(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


-- --------------------------------------------------------

--
-- Table structure for table `TableKurFiyatlari`
--

CREATE TABLE `TableKurFiyatlari` (
  `KurID` int(11) NOT NULL,
  `KurKodu` varchar(10) NOT NULL,
  `KurIsmi` varchar(50) DEFAULT NULL,
  `TLDegeri` decimal(18,4) NOT NULL,
  `GuncellemeTarihi` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `TableKurFiyatlari`
--

INSERT INTO `TableKurFiyatlari` (`KurID`, `KurKodu`, `KurIsmi`, `TLDegeri`, `GuncellemeTarihi`) VALUES
(4, 'GBP', 'sterlin', 48.1000, '2025-05-24 19:16:09'),
(3, 'EUR', 'euro', 41.8000, '2025-05-24 19:16:09'),
(2, 'USD', 'amerikan_dolari', 38.2500, '2025-05-24 19:16:09'),
(1, 'XAU', 'gram_altin', 2540.7500, '2025-05-24 19:16:09');

-- --------------------------------------------------------

--
-- Table structure for table `TableMusteriler`
--

CREATE TABLE `TableMusteriler` (
  `MusteriID` int(11) NOT NULL,
  `TCKimlik` decimal(11,0) DEFAULT NULL,
  `Sifre` decimal(6,0) DEFAULT NULL,
  `Ad` varchar(25) DEFAULT NULL,
  `Soyad` varchar(25) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `TableMusteriler`
--


--
-- Indexes for table `TableBankaHesaplar`
--
ALTER TABLE `TableBankaHesaplar`
  ADD PRIMARY KEY (`KartID`),
  ADD KEY `idx_musteri_banka` (`MusteriID`);

--
-- Indexes for table `TableKrediHesaplar`
--
ALTER TABLE `TableKrediHesaplar`
  ADD PRIMARY KEY (`KartID`),
  ADD KEY `fk_kredi_musteri` (`TCKimlik`),
  ADD KEY `idx_musteri_kredi` (`MusteriID`);

--
-- Indexes for table `TableKurFiyatlari`
--
ALTER TABLE `TableKurFiyatlari`
  ADD PRIMARY KEY (`KurID`);

--
-- Indexes for table `TableMusteriler`
--
ALTER TABLE `TableMusteriler`
  ADD PRIMARY KEY (`MusteriID`),
  ADD UNIQUE KEY `TCKimlik` (`TCKimlik`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `TableKurFiyatlari`
--
ALTER TABLE `TableKurFiyatlari`
  MODIFY `KurID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `TableMusteriler`
--
ALTER TABLE `TableMusteriler`
  MODIFY `MusteriID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;
