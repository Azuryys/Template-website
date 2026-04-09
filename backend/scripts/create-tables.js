import { pool } from '../src/server/lib/db.js';

/**
 * SCRIPT: create-tables.js
 * ========================
 * Cria as tabelas necessárias na base de dados
 * 
 * USO: node scripts/create-tables.js
 * 
 * Tabelas criadas:
 * - user: Armazena utilizadores registados
 * - recovery_codes: Armazena códigos de recuperação de senha
 */

async function createTables() {
  try {
    console.log('📋 Criando tabelas da base de dados...\n');

    // Tabela de utilizadores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela "user" criada');

    // Tabela de códigos de recuperação de senha
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recovery_codes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('✅ Tabela "recovery_codes" criada');

    console.log('\n✨ Todas as tabelas foram criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
  } finally {
    pool.end();
  }
}

createTables();