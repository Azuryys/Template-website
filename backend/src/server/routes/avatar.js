// backend/src/server/routes/avatar.js
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function uploadAvatar(req, res) {
  try {
    // Verificar autenticação (middleware better-auth já deve ter user)
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Para multipart/form-data, precisas de middleware como multer
    // Mas aqui assumo que vais receber base64 ou usar multer
    
    // Exemplo com base64 (mais simples para começar):
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    // Validar base64
    if (!image.startsWith('data:image')) {
      return res.status(400).json({ error: 'Formato inválido' });
    }

    // Extrair tipo e dados
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Base64 inválido' });
    }

    const [, ext, base64Data] = matches;
    const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
    
    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({ error: 'Tipo não suportado (use JPG, PNG, WebP)' });
    }

    // Verificar tamanho (aproximado)
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) { // 2MB
      return res.status(400).json({ error: 'Imagem demasiado grande (máx 2MB)' });
    }

    // Criar pasta avatars
    const avatarsDir = join(process.cwd(), '..', '..', '..', 'public', 'avatars');
    await mkdir(avatarsDir, { recursive: true });

    // Nome único
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = join(avatarsDir, fileName);

    // Guardar ficheiro
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filePath, buffer);

    // URL pública (assumindo que public está servido estaticamente)
    const avatarUrl = `/avatars/${fileName}`;

    // Atualizar na base de dados
    const { pool } = await import('../../lib/db.js');
    await pool.query(
      'UPDATE "user" SET image = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, req.user.id]
    );

    res.json({ 
      success: true, 
      avatarUrl 
    });

  } catch (error) {
    console.error('Erro upload avatar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}