import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bannercreator',
  user: 'postgres',
  password: 'sua_senha',
});

export async function POST(request) {
  const { email } = await request.json();
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  await pool.query(
    `INSERT INTO recovery_codes (email, code, expires_at) 
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [email, code]
  );
  
  console.log(`📧 Código para ${email}: ${code}`);
  
  return Response.json({ message: 'Código enviado' });
}