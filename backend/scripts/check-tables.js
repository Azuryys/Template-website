import { pool } from '../src/server/lib/db.js';

/**
 * SCRIPT: check-tables.js
 * =======================
 * Verifica a estrutura das tabelas da base de dados
 * 
 * USO: node scripts/check-tables.js
 * 
 * Mostra:
 * - Colunas de cada tabela
 * - Tipos de dados
 * - Total de registos
 */

async function checkDatabase() {
  try {
    console.log('🔍 Verificando base de dados...\n');

    // Verifica tabela "user"
    console.log('📋 Tabela "user":');
    const userColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user'
      ORDER BY ordinal_position;
    `);
    userColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    const userCount = await pool.query('SELECT COUNT(*) FROM "user"');
    console.log(`  📊 Total de utilizadores: ${userCount.rows[0].count}\n`);

    // Verifica tabela "recovery_codes"
    console.log('📋 Tabela "recovery_codes":');
    const recoveryColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'recovery_codes'
      ORDER BY ordinal_position;
    `);
    recoveryColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    const recoveryCount = await pool.query('SELECT COUNT(*) FROM recovery_codes');
    console.log(`  📊 Total de códigos: ${recoveryCount.rows[0].count}\n`);

    // Verifica tabela "admin_reports"
    console.log('📋 Tabela "admin_reports":');
    const reportColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'admin_reports'
      ORDER BY ordinal_position;
    `);
    reportColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    const reportCount = await pool.query('SELECT COUNT(*) FROM admin_reports');
    console.log(`  📊 Total de reports: ${reportCount.rows[0].count}\n`);

    // Verifica tabela "app_logos"
    console.log('📋 Tabela "app_logos":');
    const logosColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'app_logos'
      ORDER BY ordinal_position;
    `);
    logosColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    const logosCount = await pool.query('SELECT COUNT(*) FROM app_logos');
    console.log(`  📊 Total de logos guardados: ${logosCount.rows[0].count}\n`);

    console.log('✨ Verificação completa!');
  } catch (error) {
    console.error('❌ Erro ao verificar base de dados:', error.message);
  } finally {
    pool.end();
  }
}

checkDatabase();