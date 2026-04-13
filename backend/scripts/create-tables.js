import { pool } from '../src/server/lib/db.js';

async function createTables() {
  try {
    console.log('📋 Criando tabelas do better-auth...\n');

    // Tabela user (completa)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        name TEXT,
        image TEXT,
        password TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela "user" criada');

    // Ajusta colunas para bases já existentes
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS name TEXT;`);
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS image TEXT;`);
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password TEXT;`);
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`);
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';`);
    await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS usertype TEXT DEFAULT 'user';`);
    console.log('✅ Colunas da tabela "user" verificadas');

    // Tabela session
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela "session" criada');

    await pool.query(`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS ip_address TEXT;`);
    await pool.query(`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS user_agent TEXT;`);
    console.log('✅ Colunas da tabela "session" verificadas');

    // Tabela account (OAuth)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at TIMESTAMP,
        refresh_token_expires_at TIMESTAMP,
        scope TEXT,
        password TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela "account" criada');

    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS user_id TEXT;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS account_id TEXT;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS provider_id TEXT;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS access_token TEXT;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS refresh_token TEXT;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS id_token TEXT;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS scope TEXT;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS password TEXT;`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`);
    await pool.query(`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);
    console.log('✅ Colunas da tabela "account" verificadas');

    // Tabela verification
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela "verification" criada');

    await pool.query(`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`);
    await pool.query(`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`);
    console.log('✅ Colunas da tabela "verification" verificadas');

    console.log('\n✨ Tabelas criadas! Podes criar users agora.');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    pool.end();
  }
}

createTables();