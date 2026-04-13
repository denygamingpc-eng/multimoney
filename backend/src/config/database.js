const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// String de conexão direta fornecida
const connectionString = "postgresql://neondb_owner:npg_YvdC9DPEK1sy@ep-polished-base-an4s0meo-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Necessário para conexões seguras em ambiente Cloud/Render
  },
  max: 20, // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Teste de conexão imediato
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Erro ao conectar ao PostgreSQL no Neon:', err.stack);
  }
  console.log('✅ Conectado ao PostgreSQL (Neon DB) com sucesso!');
  release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};