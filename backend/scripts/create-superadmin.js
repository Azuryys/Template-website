import { auth } from '../auth.js';
import { pool } from '../src/server/lib/db.js';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Super Admin';

  if (!email) {
    console.error('Uso: node scripts/create-superadmin.js <email> [password] [name]');
    process.exit(1);
  }

  try {
    const existing = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);

    if (existing.rowCount === 0) {
      if (!password || password.length < 6) {
        console.error('Para criar novo superadmin, informe uma password com pelo menos 6 caracteres.');
        process.exit(1);
      }

      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          role: 'superadmin',
          usertype: 'superadmin',
        },
      });

      console.log(`✅ Superadmin criado: ${email}`);
    }

    await pool.query(
      `UPDATE "user"
       SET role = 'superadmin', usertype = 'superadmin', updated_at = CURRENT_TIMESTAMP
       WHERE email = $1`,
      [email]
    );

    console.log(`✅ Superadmin promovido/confirmado: ${email}`);
  } catch (error) {
    console.error('❌ Erro ao criar/promover superadmin:', error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
