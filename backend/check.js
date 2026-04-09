import { pool } from './src/server/lib/db.js';

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user'
      ORDER BY ordinal_position;
    `);
    console.log('Colunas da tabela user:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    pool.end();
  }
}

checkTable();