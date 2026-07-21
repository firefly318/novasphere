const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // Set to true if using Azure SQL
    trustServerCertificate: true, // Crucial for local SQL Server with self-signed certificates
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server Database: ' + process.env.DB_DATABASE);
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed: ', err.message);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise
};
