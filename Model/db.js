const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'arevalo_pos',
  password: '1234',
  port: 5432,
});

pool.on('connect', (client) => {
  client.query('SET search_path TO sistema, public;');
});

module.exports = pool;