import { pool } from '../src/server/lib/db.js';

/**
 * SCRIPT: seed-users.js
 * =====================
 * Insere utilizadores de teste na base de dados
 * 
 * USO: node scripts/seed-users.js
 */

async function seedUsers() {
  try {
    // Lista de utilizadores de teste para inserir
    const testUsers = [
      'admin@gmail.com',
      'kunarata32@gmail.com',
      'test@gmail.com'
    ];

    console.log('🌱 Iniciando seed de utilizadores...\n');

    for (const email of testUsers) {
      await pool.query(
        'INSERT INTO "user" (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [email]
      );
      console.log(`✅ ${email}`);
    }

    console.log('\n✨ Seed de utilizadores completado!');
  } catch (error) {
    console.error('❌ Erro ao inserir utilizadores:', error.message);
  } finally {
    pool.end();
  }
}

seedUsers();
