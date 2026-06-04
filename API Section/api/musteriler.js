const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Kontrol login
router.post("/kontrol-login", (req, res) => {
  const { tcKimlik, sifre } = req.body;

  if (!tcKimlik || !sifre) {
    return res.status(400).json({ exists: "TC Kimlik ve şifre gerekli" });
  }

  const sql = "SELECT * FROM TableMusteriler WHERE TCKimlik = ? AND Sifre = ?";
  db.query(sql, [tcKimlik, sifre], (err, results) => {
    if (err) return res.status(500).json({ exists: "Veritabanı hatası" });

    if (results.length > 0) {
      res.json({ exists: true, message: "Müşteri bulundu", user: results[0] });
    } else {
      res.status(404).json({ exists: "TC veya şifre hatalı" });
    }
  });
});

router.post("/yeni-kayit", async (req, res) => {
  const { tcKimlik, sifre, ad, soyad } = req.body;

  if (!tcKimlik || !sifre || !ad || !soyad) {
    return res.status(400).json({ message: "Tüm alanlar gereklidir" });
  }

  const pool = db.promise();

  try {
    const [kontrolRows] = await pool.query(
      "SELECT MusteriID FROM TableMusteriler WHERE TCKimlik = ?",
      [tcKimlik],
    );
    if (kontrolRows.length > 0) {
      return res
        .status(409)
        .json({ message: "Bu TC Kimlik numarası zaten kayıtlı" });
    }

    const [insertResult] = await pool.query(
      "INSERT INTO TableMusteriler (TCKimlik, Sifre, Ad, Soyad) VALUES (?, ?, ?, ?)",
      [tcKimlik, sifre, ad, soyad],
    );

    const musteriID = insertResult.insertId;
    const k1 = musteriID * 10 + 1;
    const k2 = musteriID * 10 + 2;
    const k3 = musteriID * 10 + 3;
    const k4 = musteriID * 10 + 4;

    await pool.query(
      "INSERT INTO TableBankaHesaplar (KartID, IBAN, Bakiye, MusteriID, Altin, Dolar, Sterlin, Euro) VALUES (?, ?, 5000, ?, 0, 0, 0, 0), (?, ?, 5000, ?, 0, 0, 0, 0)",
      [k1, "42354" + k1, musteriID, k2, "42354" + k2, musteriID],
    );

    await pool.query(
      "INSERT INTO TableKrediHesaplar (MusteriID, KartID, BorcMik, KartLim, TCKimlik) VALUES (?, ?, 5000, 45000, ?), (?, ?, 5000, 45000, ?)",
      [musteriID, k3, tcKimlik, musteriID, k4, tcKimlik],
    );

    res.json({ message: "Kaydınız başarıyla tamamlandı!" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Kayıt sırasında hata oluştu", detail: err.message });
  }
});

// Hesap bilgilerini getir
router.post("/hesap-bilgileri", (req, res) => {
  const { tcKimlik } = req.body;

  if (!tcKimlik) {
    return res.status(400).json({ message: "TC Kimlik gerekli" });
  }

  const sql = `
        SELECT 
          m.Ad AS isim,
          m.Soyad AS soyIsim,
        
          b1.KartID AS hesapNo1,
          b1.IBAN AS iban1,
          b1.Bakiye AS kullanilabilirBakiyeTutar1,
          b1.Dolar AS dolarMik1,
          b1.Euro AS euroMik1,
          b1.Sterlin AS SterlinMik1,
          b1.Altin AS altinMik1,
        
          b2.KartID AS hesapNo2,
          b2.IBAN AS iban2,
          b2.Bakiye AS kullanilabilirBakiyeTutar2,
          b2.Dolar AS dolarMik2,
          b2.Euro AS euroMik2,
          b2.Sterlin AS SterlinMik2,
          b2.Altin AS altinMik2
        
        FROM TableMusteriler m
        
        LEFT JOIN (
          SELECT * FROM TableBankaHesaplar
          WHERE KartID % 2 = 1 -- 1. hesap (veya başka mantık)
        ) AS b1 ON b1.MusteriID = m.MusteriID
        
        LEFT JOIN (
          SELECT * FROM TableBankaHesaplar
          WHERE KartID % 2 = 0 -- 2. hesap (veya başka mantık)
        ) AS b2 ON b2.MusteriID = m.MusteriID
        
        WHERE m.TCKimlik = ?
        LIMIT 1;
  `;

  db.query(sql, [tcKimlik], (err, results) => {
    if (err) {
      console.error("SQL Hatası:", err);
      return res.status(500).json({ error: "Veritabanı hatası", detail: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Müşteri bulunamadı" });
    }

    console.log("Hesap bilgisi sonucu:", results[0]);

    res.json(results[0]); // Tek satır dönecektir
  });
});

router.post("/kredi-bilgileri", (req, res) => {
  const { tcKimlik } = req.body;

  if (!tcKimlik) {
    return res.status(400).json({ message: "TC Kimlik gerekli" });
  }

  const sql = `
    SELECT 
      m.Ad AS isim,
      m.Soyad AS soyIsim,

      k1.KartID AS kartID1,
      k1.BorcMik AS borcMik1,
      k1.KartLim AS kartLim1,
      
      k2.KartID AS kartID2,
      k2.BorcMik AS borcMik2,
      k2.KartLim AS kartLim2

    FROM TableMusteriler m
    LEFT JOIN (
      SELECT * FROM TableKrediHesaplar WHERE KartID % 2 = 1
    ) AS k1 ON k1.TCKimlik = m.TCKimlik
    LEFT JOIN (
      SELECT * FROM TableKrediHesaplar WHERE KartID % 2 = 0
    ) AS k2 ON k2.TCKimlik = m.TCKimlik
    WHERE m.TCKimlik = ?
    LIMIT 1
  `;

  db.query(sql, [tcKimlik], (err, results) => {
    if (err) {
      console.error("SQL Hatası:", err);
      return res.status(500).json({ error: "Veritabanı hatası", detail: err });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "Kredi hesap bilgisi bulunamadı" });
    }

    res.json(results[0]); // Ad, Soyad ve kart bilgileri tek JSON olarak döner
  });
});

router.post("/kullanici-iban-bakiye", (req, res) => {
  const { tcKimlik } = req.body;

  if (!tcKimlik) {
    return res.status(400).json({ message: "TC Kimlik gerekli" });
  }

  const sql = `
    SELECT 
      b1.IBAN AS iban1,
      b1.Bakiye AS bakiye1,

      b2.IBAN AS iban2,
      b2.Bakiye AS bakiye2

    FROM TableMusteriler m
    LEFT JOIN (
      SELECT * FROM TableBankaHesaplar WHERE KartID % 2 = 1
    ) AS b1 ON b1.MusteriID = m.MusteriID

    LEFT JOIN (
      SELECT * FROM TableBankaHesaplar WHERE KartID % 2 = 0
    ) AS b2 ON b2.MusteriID = m.MusteriID

    WHERE m.TCKimlik = ?
    LIMIT 1
  `;

  db.query(sql, [tcKimlik], (err, results) => {
    if (err) {
      console.error("SQL Hatası:", err);
      return res
        .status(500)
        .json({ message: "Veritabanı hatası", detail: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Müşteri bulunamadı" });
    }

    res.json(results[0]); // Tek JSON nesnesi
  });
});

router.post("/iban-transfer", (req, res) => {
  const { gonderenIBAN, aliciIBAN, miktar } = req.body;

  if (!gonderenIBAN || !aliciIBAN || !miktar) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur" });
  }

  // Gönderen IBAN kontrol ve bakiye sorgusu
  const gonderenSQL = `SELECT Bakiye, KartID FROM TableBankaHesaplar WHERE IBAN = ?`;

  db.query(gonderenSQL, [gonderenIBAN], (err, gonderenRes) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Veritabanı hatası", detail: err });

    if (gonderenRes.length === 0)
      return res.status(404).json({ message: "Gönderen IBAN bulunamadı" });

    const gonderen = gonderenRes[0];

    if (gonderen.Bakiye < miktar) {
      return res.status(400).json({ message: "Yetersiz bakiye" });
    }

    // Alıcı IBAN kontrolü
    const aliciSQL = `SELECT KartID FROM TableBankaHesaplar WHERE IBAN = ?`;

    db.query(aliciSQL, [aliciIBAN], (err2, aliciRes) => {
      if (err2)
        return res
          .status(500)
          .json({ message: "Veritabanı hatası", detail: err2 });

      if (aliciRes.length === 0)
        return res.status(404).json({ message: "Alıcı IBAN geçersiz" });

      const aliciKartID = aliciRes[0].KartID;

      // Güncellemeler
      const gonderenGuncelle = `UPDATE TableBankaHesaplar SET Bakiye = Bakiye - ? WHERE KartID = ?`;
      const aliciGuncelle = `UPDATE TableBankaHesaplar SET Bakiye = Bakiye + ? WHERE KartID = ?`;

      db.query(gonderenGuncelle, [miktar, gonderen.KartID], (err3) => {
        if (err3)
          return res
            .status(500)
            .json({ message: "Gönderen güncellenemedi", detail: err3 });

        db.query(aliciGuncelle, [miktar, aliciKartID], (err4) => {
          if (err4)
            return res
              .status(500)
              .json({ message: "Alıcı güncellenemedi", detail: err4 });

          return res.json({ message: "IBAN transferi başarılı!" });
        });
      });
    });
  });
});

router.post("/kredi-ve-banka-ozeti", (req, res) => {
  const { tcKimlik } = req.body;

  if (!tcKimlik) {
    return res.status(400).json({ message: "TC Kimlik gerekli" });
  }

  const sql = `
    SELECT 
      k1.BorcMik AS borc1,
      k2.BorcMik AS borc2,

      b1.IBAN AS iban1,
      b1.Bakiye AS bakiye1,

      b2.IBAN AS iban2,
      b2.Bakiye AS bakiye2

    FROM TableMusteriler m

    LEFT JOIN (
      SELECT * FROM TableKrediHesaplar WHERE KartID % 2 = 1
    ) AS k1 ON k1.MusteriID = m.MusteriID

    LEFT JOIN (
      SELECT * FROM TableKrediHesaplar WHERE KartID % 2 = 0
    ) AS k2 ON k2.MusteriID = m.MusteriID

    LEFT JOIN (
      SELECT * FROM TableBankaHesaplar WHERE KartID % 2 = 1
    ) AS b1 ON b1.MusteriID = m.MusteriID

    LEFT JOIN (
      SELECT * FROM TableBankaHesaplar WHERE KartID % 2 = 0
    ) AS b2 ON b2.MusteriID = m.MusteriID

    WHERE m.TCKimlik = ?
    LIMIT 1
  `;

  db.query(sql, [tcKimlik], (err, results) => {
    if (err) {
      console.error("SQL Hatası:", err);
      return res
        .status(500)
        .json({ message: "Veritabanı hatası", detail: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Müşteri bulunamadı" });
    }

    res.json(results[0]);
  });
});

router.post("/kredi-karti-borc-odeme", (req, res) => {
  const { tcKimlik, krediKartiSecimi, bankaKartiSecimi, odemeTutari } =
    req.body;

  if (!tcKimlik || !krediKartiSecimi || !bankaKartiSecimi || !odemeTutari) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur" });
  }

  // Parse string to int
  const krediSec = parseInt(krediKartiSecimi, 10);
  const bankaSec = parseInt(bankaKartiSecimi, 10);
  const odeme = parseInt(odemeTutari, 10);

  if (isNaN(krediSec) || isNaN(bankaSec) || isNaN(odeme) || odeme <= 0) {
    return res
      .status(400)
      .json({ message: "Geçersiz kart seçimi veya ödeme tutarı" });
  }

  // MusteriID'yi bul
  const musteriSql = `SELECT MusteriID FROM TableMusteriler WHERE TCKimlik = ? LIMIT 1`;

  db.query(musteriSql, [tcKimlik], (err, musteriSonuc) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Müşteri sorgu hatası", detail: err });
    if (musteriSonuc.length === 0)
      return res.status(404).json({ message: "Müşteri bulunamadı" });

    const musteriID = musteriSonuc[0].MusteriID;

    // krediKartiSecimi: 1 → 3, 2 → 4
    const krediKartSonRakam = krediSec === 1 ? 3 : 4;

    const krediKartID = musteriID * 10 + krediKartSonRakam;
    const bankaKartID = musteriID * 10 + bankaSec;

    const krediSql = `
      SELECT BorcMik, KartLim FROM TableKrediHesaplar 
      WHERE MusteriID = ? AND KartID = ? LIMIT 1;
    `;
    const bankaSql = `
      SELECT Bakiye FROM TableBankaHesaplar 
      WHERE MusteriID = ? AND KartID = ? LIMIT 1;
    `;

    db.query(krediSql, [musteriID, krediKartID], (err1, krediSonuc) => {
      if (err1)
        return res
          .status(500)
          .json({ message: "Kredi kartı sorgu hatası", detail: err1 });
      if (krediSonuc.length === 0)
        return res.status(404).json({ message: "Kredi kartı bulunamadı" });

      db.query(bankaSql, [musteriID, bankaKartID], (err2, bankaSonuc) => {
        if (err2)
          return res
            .status(500)
            .json({ message: "Banka kartı sorgu hatası", detail: err2 });
        if (bankaSonuc.length === 0)
          return res.status(404).json({ message: "Banka kartı bulunamadı" });

        const krediKartBorcu = krediSonuc[0].BorcMik;
        const bankaBakiye = bankaSonuc[0].Bakiye;

        if (bankaBakiye < odeme) {
          return res.status(400).json({ message: "Yetersiz bakiye" });
        }
        if (krediKartBorcu <= 0) {
          return res
            .status(400)
            .json({ message: "Bu kartın borcu bulunmamaktadır" });
        }

        const guncelOdeme = Math.min(odeme, krediKartBorcu);

        // Borç azalt ve limit arttır
        const updateKrediSQL = `
          UPDATE TableKrediHesaplar 
          SET BorcMik = BorcMik - ?, KartLim = KartLim + ?
          WHERE MusteriID = ? AND KartID = ?;
        `;

        db.query(
          updateKrediSQL,
          [guncelOdeme, guncelOdeme, musteriID, krediKartID],
          (err3) => {
            if (err3)
              return res
                .status(500)
                .json({ message: "Kredi güncelleme hatası", detail: err3 });

            const updateBankaSQL = `
            UPDATE TableBankaHesaplar 
            SET Bakiye = Bakiye - ?
            WHERE MusteriID = ? AND KartID = ?;
          `;

            db.query(
              updateBankaSQL,
              [guncelOdeme, musteriID, bankaKartID],
              (err4) => {
                if (err4)
                  return res
                    .status(500)
                    .json({ message: "Banka güncelleme hatası", detail: err4 });

                return res.json({
                  message: `Borç başarıyla ödendi. Ödenen tutar: ${guncelOdeme}TL`,
                });
              },
            );
          },
        );
      });
    });
  });
});

router.post("/kredi-ve-banka-limiti-ve-bakiye", (req, res) => {
  const { tcKimlik } = req.body;

  if (!tcKimlik) {
    return res.status(400).json({ message: "TC Kimlik gerekli" });
  }

  const sql = `
    SELECT 
      k1.KartLim AS krediKartLimit1,
      k2.KartLim AS krediKartLimit2,

      b1.IBAN AS bankaIban1,
      b1.Bakiye AS bankaBakiye1,

      b2.IBAN AS bankaIban2,
      b2.Bakiye AS bankaBakiye2

    FROM TableMusteriler m

    LEFT JOIN (
      SELECT * FROM TableKrediHesaplar WHERE KartID % 2 = 1
    ) AS k1 ON k1.MusteriID = m.MusteriID

    LEFT JOIN (
      SELECT * FROM TableKrediHesaplar WHERE KartID % 2 = 0
    ) AS k2 ON k2.MusteriID = m.MusteriID

    LEFT JOIN (
      SELECT * FROM TableBankaHesaplar WHERE KartID % 2 = 1
    ) AS b1 ON b1.MusteriID = m.MusteriID

    LEFT JOIN (
      SELECT * FROM TableBankaHesaplar WHERE KartID % 2 = 0
    ) AS b2 ON b2.MusteriID = m.MusteriID

    WHERE m.TCKimlik = ?
    LIMIT 1;
  `;

  db.query(sql, [tcKimlik], (err, results) => {
    if (err) {
      console.error("SQL Hatası:", err);
      return res
        .status(500)
        .json({ message: "Veritabanı hatası", detail: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Müşteri bulunamadı" });
    }

    res.json(results[0]);
  });
});

router.post("/kredi-cek", (req, res) => {
  const { tcKimlik, krediKartiSecimi, bankaKartiSecimi, cekilecekTutar } =
    req.body;

  if (!tcKimlik || !krediKartiSecimi || !bankaKartiSecimi || !cekilecekTutar) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur" });
  }

  const tutar = parseFloat(cekilecekTutar);
  if (isNaN(tutar) || tutar <= 0) {
    return res
      .status(400)
      .json({ message: "Geçerli bir çekilecek tutar giriniz" });
  }

  const krediKartIndex = krediKartiSecimi === "1" ? 1 : 0;
  const bankaKartIndex = bankaKartiSecimi === "1" ? 1 : 0;

  const faizOrani = 0.05;
  const toplamBorçArtışı = tutar * (1 + faizOrani);

  const sql = `
    SELECT 
      kh.KartID, kh.BorcMik, kh.KartLim,
      bh.KartID AS bankaKartID, bh.Bakiye
    FROM TableMusteriler m
    LEFT JOIN TableKrediHesaplar kh ON kh.MusteriID = m.MusteriID AND (kh.KartID % 2) = ?
    LEFT JOIN TableBankaHesaplar bh ON bh.MusteriID = m.MusteriID AND (bh.KartID % 2) = ?
    WHERE m.TCKimlik = ?
    LIMIT 1;
  `;

  db.query(sql, [krediKartIndex, bankaKartIndex, tcKimlik], (err, results) => {
    if (err) {
      console.error("SQL Hatası:", err);
      return res
        .status(500)
        .json({ message: "Veritabanı hatası", detail: err });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "Müşteri veya kart bilgileri bulunamadı" });
    }

    const krediKart = results[0];
    const kullanilabilirLimit = krediKart.KartLim - krediKart.BorcMik;

    if (kullanilabilirLimit < tutar) {
      return res
        .status(400)
        .json({
          message: `Yetersiz limit. Kullanılabilir limit: ${kullanilabilirLimit}`,
        });
    }

    // Kredi kartı borcunu ve kart limitini güncelle
    const updateKrediSQL = `
      UPDATE TableKrediHesaplar
      SET BorcMik = BorcMik + ?, KartLim = KartLim - ?
      WHERE KartID = ?;
    `;

    db.query(
      updateKrediSQL,
      [toplamBorçArtışı, tutar, krediKart.KartID],
      (err1) => {
        if (err1) {
          console.error("Kredi kartı güncelleme hatası:", err1);
          return res
            .status(500)
            .json({ message: "Kredi kartı güncelleme hatası", detail: err1 });
        }

        // Banka hesabına tutarı yükle
        const updateBankaSQL = `
        UPDATE TableBankaHesaplar
        SET Bakiye = Bakiye + ?
        WHERE KartID = ?;
      `;

        db.query(updateBankaSQL, [tutar, krediKart.bankaKartID], (err2) => {
          if (err2) {
            console.error("Banka hesabı güncelleme hatası:", err2);
            return res
              .status(500)
              .json({
                message: "Banka hesabı güncelleme hatası",
                detail: err2,
              });
          }

          return res.json({
            message: `Kredi çekme işlemi başarılı. Çekilen tutar: ${tutar}TL, toplam borcunuz: ${krediKart.BorcMik + toplamBorçArtışı}TL, kalan kart limiti: ${krediKart.KartLim - tutar}TL`,
          });
        });
      },
    );
  });
});

router.post("/tum-varliklar", async (req, res) => {
  const { tcKimlik } = req.body;

  if (!tcKimlik) {
    return res.status(400).json({ message: "TC Kimlik gerekli" });
  }

  const sql = `
    SELECT 
      b.KartID,
      b.IBAN,
      b.Bakiye AS tl,
      b.Altin,
      b.Dolar,
      b.Euro,
      b.Sterlin
    FROM TableBankaHesaplar b
    INNER JOIN TableMusteriler m ON b.MusteriID = m.MusteriID
    WHERE m.TCKimlik = ?
    ORDER BY b.KartID ASC
  `;

  db.query(sql, [tcKimlik], (err, results) => {
    if (err) {
      console.error("SQL Hatası:", err);
      return res.status(500).json({ message: "Veritabanı hatası" });
    }

    if (results.length !== 2) {
      return res.status(404).json({ message: "2 banka hesabı bulunamadı" });
    }

    const [hesap1, hesap2] = results;

    const veri = {
      hesap1ID: hesap1.KartID,
      iban1: hesap1.IBAN,
      tlbakiye1: hesap1.tl,
      altinGram1: hesap1.Altin,
      dolarUSD1: hesap1.Dolar,
      euroEUR1: hesap1.Euro,
      sterlinGBP1: hesap1.Sterlin,

      hesap2ID: hesap2.KartID,
      iban2: hesap2.IBAN,
      tlbakiye2: hesap2.tl,
      altinGram2: hesap2.Altin,
      dolarUSD2: hesap2.Dolar,
      euroEUR2: hesap2.Euro,
      sterlinGBP2: hesap2.Sterlin,
    };

    res.json(veri);
  });
});

router.post("/satin-al", (req, res) => {
  const { TCKimlik, kart, yatirilanTL, alinanTip } = req.body;

  // Validasyon
  if (
    !TCKimlik ||
    !kart || // kart string "1" veya "2" bekleniyor
    !["1", "2", "3", "4"].includes(alinanTip.toString()) ||
    isNaN(yatirilanTL) ||
    Number(yatirilanTL) <= 0
  ) {
    return res.status(400).json({ message: "Geçersiz veya eksik parametre" });
  }

  const alinanTipInt = parseInt(alinanTip);
  const kurIsimleri = {
    1: "gram_altin",
    2: "amerikan_dolari",
    3: "euro",
    4: "sterlin",
  };

  const kolonIsimleri = {
    1: "Altin",
    2: "Dolar",
    3: "Euro",
    4: "Sterlin",
  };

  const displayNames = {
    gram_altin: "Gram Altın",
    amerikan_dolari: "Amerikan Doları",
    euro: "Euro",
    sterlin: "Sterlin",
  };

  const alinacakKurIsmi = kurIsimleri[alinanTipInt];
  const kolonAdi = kolonIsimleri[alinanTipInt];
  const miktarTL = Number(yatirilanTL);

  // 1. MusteriID bul
  const musteriSorgu = `SELECT MusteriID FROM TableMusteriler WHERE TCKimlik = ? LIMIT 1`;
  db.query(musteriSorgu, [TCKimlik], (err, musteriSonuc) => {
    if (err)
      return res.status(500).json({ message: "Müşteri sorgu hatası", err });
    if (musteriSonuc.length === 0)
      return res.status(404).json({ message: "Müşteri bulunamadı" });

    const MusteriID = musteriSonuc[0].MusteriID;

    // KartID oluştur (MusteriID + kart string)
    const KartID = parseInt("" + MusteriID + kart); // Örn: 24 + "1" = 241

    // 2. Hesap sorgusu
    const hesapSorgu = `
      SELECT KartID, Bakiye, ${kolonAdi}
      FROM TableBankaHesaplar
      WHERE MusteriID = ? AND KartID = ?
      LIMIT 1
    `;
    db.query(hesapSorgu, [MusteriID, KartID], (err2, hesapSonuc) => {
      if (err2)
        return res.status(500).json({ message: "Hesap sorgu hatası", err2 });
      if (hesapSonuc.length === 0)
        return res.status(404).json({ message: "Hesap bulunamadı" });

      const hesap = hesapSonuc[0];

      if (hesap.Bakiye < miktarTL) {
        return res.status(400).json({ message: "Yetersiz TL bakiyesi" });
      }

      // 3. Kur fiyatı çek
      const kurSorgu = `
        SELECT TLDegeri FROM TableKurFiyatlari 
        WHERE KurIsmi = ? 
        ORDER BY GuncellemeTarihi DESC 
        LIMIT 1
      `;
      db.query(kurSorgu, [alinacakKurIsmi], (err3, kurSonuc) => {
        if (err3)
          return res
            .status(500)
            .json({ message: "Kur fiyatı sorgu hatası", err3 });
        if (kurSonuc.length === 0)
          return res.status(404).json({ message: "Kur fiyatı bulunamadı" });

        const kurFiyati = kurSonuc[0].TLDegeri;
        const alinacakMiktar = miktarTL / kurFiyati;

        // 4. Hesabı güncelle
        const guncelle = `
          UPDATE TableBankaHesaplar
          SET Bakiye = Bakiye - ?,
              ${kolonAdi} = ${kolonAdi} + ?
          WHERE KartID = ?
        `;
        db.query(guncelle, [miktarTL, alinacakMiktar, KartID], (err4) => {
          if (err4)
            return res
              .status(500)
              .json({ message: "Hesap güncelleme hatası", err4 });

          return res.json({
            message: `${displayNames[alinacakKurIsmi]} başarıyla satın alındı, miktar: ${alinacakMiktar.toFixed(4)}.`,
            alinanKur: alinacakKurIsmi,
            miktar: alinacakMiktar.toFixed(4),
            kalanTL: (hesap.Bakiye - miktarTL).toFixed(2),
          });
        });
      });
    });
  });
});

router.post("/sat", (req, res) => {
  const { TCKimlik, kart, satilanMiktar, satilanTip } = req.body;

  if (
    !TCKimlik ||
    !kart || // kart string "1" veya "2" bekleniyor
    !["1", "2", "3", "4"].includes(satilanTip.toString()) ||
    isNaN(satilanMiktar) ||
    Number(satilanMiktar) <= 0
  ) {
    return res.status(400).json({ message: "Geçersiz veya eksik parametre" });
  }

  const satilanTipInt = parseInt(satilanTip);
  const kurIsimleri = {
    1: "gram_altin",
    2: "amerikan_dolari",
    3: "euro",
    4: "sterlin",
  };

  const kolonIsimleri = {
    1: "Altin",
    2: "Dolar",
    3: "Euro",
    4: "Sterlin",
  };

  // Kullanıcıya gösterilecek okunabilir isimler:
  const displayNames = {
    gram_altin: "Gram Altın",
    amerikan_dolari: "Amerikan Doları",
    euro: "Euro",
    sterlin: "Sterlin",
  };

  const satilanKurIsmi = kurIsimleri[satilanTipInt];
  const kolonAdi = kolonIsimleri[satilanTipInt];
  const miktar = Number(satilanMiktar);

  // 1. MusteriID bul
  const musteriSorgu = `SELECT MusteriID FROM TableMusteriler WHERE TCKimlik = ? LIMIT 1`;
  db.query(musteriSorgu, [TCKimlik], (err, musteriSonuc) => {
    if (err)
      return res.status(500).json({ message: "Müşteri sorgu hatası", err });
    if (musteriSonuc.length === 0)
      return res.status(404).json({ message: "Müşteri bulunamadı" });

    const MusteriID = musteriSonuc[0].MusteriID;
    const KartID = parseInt("" + MusteriID + kart);

    // 2. Hesap sorgu - ilgili kur miktarını kontrol et
    const hesapSorgu = `
      SELECT KartID, Bakiye, ${kolonAdi}
      FROM TableBankaHesaplar
      WHERE MusteriID = ? AND KartID = ?
      LIMIT 1
    `;
    db.query(hesapSorgu, [MusteriID, KartID], (err2, hesapSonuc) => {
      if (err2)
        return res.status(500).json({ message: "Hesap sorgu hatası", err2 });
      if (hesapSonuc.length === 0)
        return res.status(404).json({ message: "Hesap bulunamadı" });

      const hesap = hesapSonuc[0];

      if (hesap[kolonAdi] < miktar) {
        return res
          .status(400)
          .json({
            message: `Yetersiz ${displayNames[satilanKurIsmi]} bakiyesi`,
          });
      }

      // 3. Kur fiyatı al
      const kurSorgu = `
        SELECT TLDegeri FROM TableKurFiyatlari 
        WHERE KurIsmi = ? 
        ORDER BY GuncellemeTarihi DESC 
        LIMIT 1
      `;
      db.query(kurSorgu, [satilanKurIsmi], (err3, kurSonuc) => {
        if (err3)
          return res
            .status(500)
            .json({ message: "Kur fiyatı sorgu hatası", err3 });
        if (kurSonuc.length === 0)
          return res.status(404).json({ message: "Kur fiyatı bulunamadı" });

        const kurFiyati = kurSonuc[0].TLDegeri;
        const kazanilanTL = miktar * kurFiyati;

        // 4. Hesap güncelle
        const guncelle = `
          UPDATE TableBankaHesaplar
          SET Bakiye = Bakiye + ?,
              ${kolonAdi} = ${kolonAdi} - ?
          WHERE KartID = ?
        `;
        db.query(guncelle, [kazanilanTL, miktar, KartID], (err4) => {
          if (err4)
            return res
              .status(500)
              .json({ message: "Hesap güncelleme hatası", err4 });

          return res.json({
            message: `${displayNames[satilanKurIsmi]} başarıyla satıldı. Kazanılan TL: ${kazanilanTL.toFixed(2)} TL.`,
            satilanKur: displayNames[satilanKurIsmi],
            satilanMiktar: miktar.toFixed(4),
            kazanilanTL: kazanilanTL.toFixed(2),
            yeniBakiye: (hesap.Bakiye + kazanilanTL).toFixed(2),
            kalanKur: (hesap[kolonAdi] - miktar).toFixed(4),
          });
        });
      });
    });
  });
});

module.exports = router;
