import { Pool } from 'pg';
import { ENV } from '../../config/env.js';

// Cria UMA conexão para todo o projeto
export const pool = new Pool({
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  database: ENV.DB_NAME,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
});

// Função helper para criar base de dados (se não existir)
export async function createDatabase() {
  const adminPool = new Pool({
    host: ENV.DB_HOST,
    port: ENV.DB_PORT,
    database: 'postgres',  // base default
    user: ENV.DB_USER,
    password: ENV.DB_PASSWORD,
  });

  try {
    await adminPool.query(`CREATE DATABASE ${ENV.DB_NAME}`);
    console.log(`✅ Base de dados "${ENV.DB_NAME}" criada!`);
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(`ℹ️ Base de dados "${ENV.DB_NAME}" já existe`);
    } else {
      console.log('❌ Erro:', err.message);
    }
  }

  await adminPool.end();
}

// Função para aplicar schema do Better Auth
export async function applySchema() {
  const fs = await import('fs');
  const sql = fs.readFileSync('./better-auth-schema.sql', 'utf8');
  await pool.query(sql);
  console.log('✅ Schema aplicado!');
}