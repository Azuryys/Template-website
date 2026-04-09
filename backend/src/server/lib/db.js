/**
 * CONFIGURAÇÃO DE BASE DE DADOS
 * Ficheiro: db.js
 * FUNÇÃO: Gerenciar a conexão com PostgreSQL
 * DETALHE: Usa um Pool de conexões (mais eficiente que criar conexão sempre)
 */

import { Pool } from 'pg';
import { ENV } from '../../config/env.js';

/**
 * POOL é um objeto compartilhado por toda a aplicação
 * Reutiliza conexões para melhor desempenho
 * Credenciais vêm do ficheiro .env
 */
export const pool = new Pool({
  host: ENV.DB_HOST,           // localhost
  port: ENV.DB_PORT,           // 5432
  database: ENV.DB_NAME,       // bannercreator
  user: ENV.DB_USER,           // postgres
  password: ENV.DB_PASSWORD,   // Brasilgo@1
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