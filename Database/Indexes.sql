-- İndeksler
ALTER TABLE TableKrediHesaplar
ADD INDEX idx_musteri_kredi (MusteriID);

ALTER TABLE TableBankaHesaplar
ADD INDEX idx_musteri_banka (MusteriID);

-- Foreign Key'ler
ALTER TABLE TableKrediHesaplar
ADD CONSTRAINT fk_kredi_musteri
FOREIGN KEY (MusteriID)
REFERENCES TableMusteriler(MusteriID)
ON DELETE CASCADE;

ALTER TABLE TableBankaHesaplar
ADD CONSTRAINT fk_banka_musteri
FOREIGN KEY (MusteriID)
REFERENCES TableMusteriler(MusteriID)
ON DELETE CASCADE;
