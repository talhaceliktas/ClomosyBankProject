DELIMITER $$

CREATE PROCEDURE YeniMusteriEkle (
    IN p_TCKimlik DECIMAL(11, 0),
    IN p_Sifre DECIMAL(6, 0),
    IN p_Ad VARCHAR(25),
    IN p_Soyad VARCHAR(25)
)
BEGIN
    DECLARE v_MusteriID INT;
    DECLARE v_KartID1 INT;
    DECLARE v_KartID2 INT;
    DECLARE v_KartID3 INT;
    DECLARE v_KartID4 INT;

    -- 1. Müşteri ekleniyor
    INSERT INTO TableMusteriler (TCKimlik, Sifre, Ad, Soyad)
    VALUES (p_TCKimlik, p_Sifre, p_Ad, p_Soyad);

    -- 2. Eklenen MusteriID alınıyor
    SET v_MusteriID = LAST_INSERT_ID();

    -- 3. Kart ID'ler oluşturuluyor
    SET v_KartID1 = v_MusteriID * 10 + 1;
    SET v_KartID2 = v_MusteriID * 10 + 2;
    SET v_KartID3 = v_MusteriID * 10 + 3;
    SET v_KartID4 = v_MusteriID * 10 + 4;

    -- 4. Banka hesapları ekleniyor
    INSERT INTO TableBankaHesaplar (KartID, IBAN, Bakiye, MusteriID, Altin, Dolar, Sterlin, Euro)
    VALUES
    (v_KartID1, CONCAT('42354', v_KartID1), 5000, v_MusteriID, 0, 0, 0, 0),
    (v_KartID2, CONCAT('42354', v_KartID2), 5000, v_MusteriID, 0, 0, 0, 0);

    -- 5. Kredi hesapları ekleniyor
    INSERT INTO TableKrediHesaplar (MusteriID, KartID, BorcMik, KartLim, TCKimlik)
    VALUES
    (v_MusteriID, v_KartID3, 5000, 45000, p_TCKimlik),
    (v_MusteriID, v_KartID4, 5000, 45000, p_TCKimlik);

END$$

DELIMITER ;
