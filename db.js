const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",        // your DB user
  host: "localhost",
  database: "EarthMap",
  password: "kathuraku91", // your DB password
  port: 5432,
});

module.exports = pool;