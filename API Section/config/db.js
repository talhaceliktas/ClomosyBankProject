const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: parseInt(process.env.MYSQLPORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false },
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error("DB Bağlantı Hatası:", err);
    return;
  }
  console.log("MySQL Bağlantısı başarılı!");
  conn.release();
});

module.exports = pool;
