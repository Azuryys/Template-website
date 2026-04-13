import { auth } from '../auth.js';

async function testSignup() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Test User';

  if (!email || !password) {
    console.error('Uso: node scripts/test-signup.js <email> <password> [name]');
    process.exit(1);
  }

  try {
    // Usa o API do Better Auth diretamente
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name
      }
    });
    
    console.log('✅ User criado:', result);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSignup();