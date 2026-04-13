import { auth } from '../auth.js';

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
      { email: 'admin@example.com', name: 'Admin', password: 'Admin123456!' },
      { email: 'user1@example.com', name: 'User One', password: 'User123456!' },
      { email: 'user2@example.com', name: 'User Two', password: 'User123456!' },
    ];

    console.log('🌱 Iniciando seed de utilizadores...\n');

    for (const user of testUsers) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: user.email,
            password: user.password,
            name: user.name,
          },
        });
        console.log(`✅ ${user.email}`);
      } catch (error) {
        const message = error?.message || '';
        if (message.toLowerCase().includes('already exists')) {
          console.log(`ℹ️ ${user.email} já existe`);
        } else {
          console.log(`❌ ${user.email}: ${message}`);
        }
      }
    }

    console.log('\n✨ Seed de utilizadores completado!');
  } catch (error) {
    console.error('❌ Erro ao inserir utilizadores:', error.message);
  }
}

seedUsers();
