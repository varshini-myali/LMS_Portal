// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'lms_db',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  timezone:           'Z',
  decimalNumbers:     true,
});

pool.getConnection()
  .then(conn => { conn.release(); console.log('✅  MySQL connected'); })
  .catch(err => { console.error('❌  MySQL connection failed:', err.message); process.exit(1); });

module.exports = pool;
