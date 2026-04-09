import { pool } from './src/server/lib/db.js';

async function insertUser() {
  try {
    await pool.query(
      'INSERT INTO "user" (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      ['kunarata32@gmail.com']
    );
    console.log('✅ Utilizador kunarata32@gmail.com inserido!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    pool.end();
  }
}

insertUser();
