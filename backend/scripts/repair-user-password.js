import { hashPassword } from 'better-auth/crypto';
import { pool } from '../src/server/lib/db.js';

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Uso: node scripts/repair-user-password.js <email> <nova_password>');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('A nova password deve ter pelo menos 6 caracteres.');
    process.exit(1);
  }

  try {
    const userResult = await pool.query('SELECT id, email FROM "user" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      console.error(`Utilizador não encontrado: ${email}`);
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    const betterAuthHash = await hashPassword(newPassword);

    await pool.query('BEGIN');

    await pool.query(
      `UPDATE "account"
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND provider_id = 'credential'`,
      [betterAuthHash, userId]
    );

    await pool.query(
      `UPDATE "user"
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [betterAuthHash, userId]
    );

    await pool.query('COMMIT');
    console.log(`✅ Password reparada para ${email}`);
  } catch (error) {
    try {
      await pool.query('ROLLBACK');
    } catch {}

    console.error('❌ Erro ao reparar password:', error.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
