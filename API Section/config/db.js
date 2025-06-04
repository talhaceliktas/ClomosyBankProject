const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

connection.connect(err => {
  if (err) {
    console.error('DB Bağlantı Hatası:', err);
    return;
  }
  console.log('MySQL Bağlantısı başarılı!');
});

module.exports = connection;
