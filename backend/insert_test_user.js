import { pool } from './src/server/lib/db.js';

async function insertTestUser() {
  try {
    // Insere um utilizador teste para recuperação de senha
    await pool.query(
      'INSERT INTO "user" (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      ['admin@gmail.com']
    );
    console.log('✅ Utilizador admin@gmail.com inserido com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inserir utilizador:', error.message);
  } finally {
    pool.end();
  }
}

insertTestUser();
