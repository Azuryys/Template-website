import { auth } from './auth.js';

async function test() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log('Uso: node test-login.js <email> <password>');
        process.exit(1);
    }

    try {
        const result = await auth.api.signInEmail({
            body: {
                email,
                password
            }
        });
        console.log('✅ Login OK:', result);
    } catch (e) {
        console.log('❌ Erro:', e.message);
    }
}
test();