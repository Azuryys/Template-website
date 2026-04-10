// backend/scripts/db-manager.js
import { pool } from '../src/server/lib/db.js';

const command = process.argv[2];

async function manageDB() {
  try {
    switch (command) {
      case 'list':
        console.log('📋 Listando tabelas...');
        const tables = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);
        tables.rows.forEach(t => console.log(`   - ${t.table_name}`));
        break;
        
      case 'drop-recovery':
        console.log('🗑️ Removendo tabela recovery_codes...');
        await pool.query('DROP TABLE IF EXISTS recovery_codes');
        console.log('✅ Tabela recovery_codes removida!');
        break;
        
      case 'create-verification':
        console.log('📦 Criando tabela verification (Better Auth)...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS verification (
            id SERIAL PRIMARY KEY,
            identifier TEXT NOT NULL,
            value TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Tabela verification criada!');
        break;
        
      case 'check-better-auth':
        console.log('🔍 Verificando tabelas do Better Auth...');
        const baTables = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('user', 'account', 'session', 'verification')
        `);
        if (baTables.rows.length === 0) {
          console.log('⚠️ Nenhuma tabela do Better Auth encontrada!');
          console.log('💡 Corre: npx @better-auth@cli migrate');
        } else {
          baTables.rows.forEach(t => console.log(`   ✅ ${t.table_name}`));
        }
        break;
        
      case 'create-missing':
        console.log('📦 Criando tabelas em falta (sem alterar user)...');
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS account (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            provider_id TEXT NOT NULL,
            account_id TEXT NOT NULL,
            password TEXT,
            access_token TEXT,
            refresh_token TEXT,
            access_token_expires_at TIMESTAMP,
            refresh_token_expires_at TIMESTAMP,
            scope TEXT,
            id_token TEXT,
            session_state TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(provider_id, account_id)
          )
        `);
        console.log('   ✅ account');
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS session (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('   ✅ session');
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS verification (
            id SERIAL PRIMARY KEY,
            identifier TEXT NOT NULL,
            value TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('   ✅ verification');
        
        console.log('✅ Todas as tabelas criadas!');
        break;
        
      default:
        console.log(`
📘 Uso: node scripts/db-manager.js [comando]

Comandos disponíveis:
   list              - Lista todas as tabelas
   drop-recovery     - Remove tabela recovery_codes
   create-verification - Cria tabela verification (Better Auth)
   check-better-auth - Verifica tabelas do Better Auth
   create-missing    - Cria account, session e verification (sem alterar user)
        `);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

manageDB();