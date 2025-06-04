const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Burada 'user' dosyasını 'musteriler' olarak kullanıyoruz çünkü müşteri işlemleri orada
const musteriRoutes = require('./api/musteriler');
app.use('/api/musteriler', musteriRoutes);

app.listen(port, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${port}`);
});
