/**
 * BACKEND - Servidor principal da aplicação
 * Porta: 3001
 * Responsável por: Autenticação, recuperação de senha, upload de avatar e rotas da API
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config';
import { auth } from '../../auth.js';
import { pool } from './lib/db.js';  // ← importa Pool do db.js (conexão com PostgreSQL)
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { hashPassword } from 'better-auth/crypto';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir, readdir, unlink } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const LOGO_LIBRARY_CONFIG = [
  { category: 'logo', folder: 'Logo' },
  { category: 'audio', folder: 'Logo_Audio' },
];
const BAUER_IMAGES_ROOT = join(__dirname, '..', '..', '..', 'frontend', 'public', 'BauerImages');
const TEMPLATES_ROOT = join(__dirname, '..', '..', '..', 'frontend', 'public', 'Templates');
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const templateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function toSafeFileBaseName(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();

  return normalized || `logo_${Date.now()}`;
}

function normalizeImageExtension(file) {
  const byMime = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };

  if (byMime[file.mimetype]) {
    return byMime[file.mimetype];
  }

  const original = String(file.originalname || '');
  const ext = original.includes('.') ? original.split('.').pop().toLowerCase() : '';
  if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }

  return null;
}

// Le os ficheiros das pastas de logos do frontend para montar a biblioteca.
async function readLogoLibrary() {
  const logos = [];

  for (const config of LOGO_LIBRARY_CONFIG) {
    const folderPath = join(__dirname, '..', '..', '..', 'frontend', 'public', 'BauerImages', config.folder);

    try {
      const fileNames = await readdir(folderPath);
      const imageFileNames = fileNames.filter((fileName) => /\.(png|jpe?g|webp|svg)$/i.test(fileName));

      imageFileNames.forEach((fileName) => {
        const cleanName = fileName
          .replace(/\.[^.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .trim();

        logos.push({
          id: `${config.category}-${fileName}`,
          name: cleanName,
          fileName,
          filePath: `/BauerImages/${config.folder}/${fileName}`,
          category: config.category,
        });
      });
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.error(`Erro ao ler pasta de logos ${folderPath}:`, error);
      }
    }
  }

  return logos;
}

function getLogoFolderFromCategory(category) {
  const config = LOGO_LIBRARY_CONFIG.find((item) => item.category === category);
  return config?.folder || null;
}

function normalizeTemplateFileExtension(file) {
  const byMime = {
    'image/svg+xml': 'svg',
    'application/json': 'json',
    'text/plain': 'txt',
  };

  if (byMime[file.mimetype]) {
    return byMime[file.mimetype];
  }

  const original = String(file.originalname || '');
  const ext = original.includes('.') ? original.split('.').pop().toLowerCase() : '';
  if (['json', 'svg', 'txt'].includes(ext)) {
    return ext;
  }

  return null;
}

function mapTemplateRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    width: row.width,
    height: row.height,
    templateType: row.template_type,
    sourceTemplateId: row.source_template_id,
    filePath: row.file_path,
    canvasData: row.canvas_data,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// Garante que as tabelas e colunas obrigatorias existem na base de dados.
async function ensureAuthSchema() {
  await pool.query(`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS ip_address TEXT`);
  await pool.query(`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS user_agent TEXT`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS name TEXT`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS usertype TEXT DEFAULT 'user'`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recovery_codes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_reports (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      target_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      reporter_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      target_name TEXT,
      target_email TEXT,
      target_role TEXT,
      reporter_name TEXT,
      reporter_email TEXT,
      description TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_logos (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (category, file_path)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_templates (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      width INTEGER,
      height INTEGER,
      template_type TEXT NOT NULL DEFAULT 'canvas',
      source_template_id TEXT,
      file_path TEXT,
      canvas_data JSONB,
      created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

await ensureAuthSchema();

// Middleware CORS - permite requisições do frontend (localhost:3000)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// ============================================
// SERVIR AVATARES ESTATICAMENTE
// ============================================
const avatarsDir = join(__dirname, '..', '..', 'public', 'avatars');
await mkdir(avatarsDir, { recursive: true });
app.use('/avatars', express.static(avatarsDir));
await mkdir(TEMPLATES_ROOT, { recursive: true });
app.use('/Templates', express.static(TEMPLATES_ROOT));

// Middleware para parsear JSON nos requests (depois do handler do Better Auth)
app.use(express.json());

// Valida sessao e permissao admin para proteger rotas administrativas.
async function requireAdminSession(req, res) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return null;
  }

  const role = session.user.role || session.user.usertype;
  const isAdmin = role === 'admin' || role === 'superadmin';
  if (!isAdmin) {
    res.status(403).json({ error: 'Sem permissão de administrador' });
    return null;
  }

  return session;
}

// Rota de health-check - verifica se o backend está rodando
app.get('/', (req, res) => {
  res.send('Backend rodando');
  
});

// Rota de ver utilizadores para o painel admin.
app.get('/api/admin/users', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const actorRole = session.user.role || session.user.usertype || 'user';
    const actorIsSuperAdmin = actorRole === 'superadmin';

    const result = await pool.query(
      `SELECT id, name, role, usertype, created_at
       FROM "user"
       ORDER BY created_at DESC NULLS LAST, email ASC`
    );

    const users = result.rows.map((row) => {
      const role = row.role || row.usertype || 'user';
      return {
        id: row.id,
        name: row.name || 'Sem nome',
        email: row.email,
        role,
        isAdmin: role === 'admin' || role === 'superadmin',
        isSuperAdmin: role === 'superadmin',
        usertype: row.usertype,
        createdAt: row.created_at,
      };
    });

    const visibleUsers = actorIsSuperAdmin
      ? users
      : users.filter((listedUser) => !listedUser.isSuperAdmin);

    res.json({ users: visibleUsers });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para o superadmin ver reports enviados por admins.
app.get('/api/admin/reports', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const actorRole = session.user.role || session.user.usertype || 'user';
    if (actorRole !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas superadmin pode ver os reports' });
    }

    const result = await pool.query(
      `SELECT id, target_user_id, reporter_user_id, target_name, target_email, target_role, reporter_name, reporter_email, description, created_at
       FROM admin_reports
       ORDER BY created_at DESC`
    );

    const reports = result.rows.map((row) => ({
      id: row.id,
      targetUserId: row.target_user_id,
      reporterUserId: row.reporter_user_id,
      targetName: row.target_name || 'Sem nome',
      targetEmail: row.target_email || '-',
      targetRole: row.target_role || 'user',
      reporterName: row.reporter_name || 'Sem nome',
      reporterEmail: row.reporter_email || '-',
      description: row.description,
      createdAt: row.created_at,
    }));

    res.json({ reports });
  } catch (error) {
    console.error('Erro ao listar reports:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Devolve a biblioteca de logos existente nas pastas da app.
app.get('/api/logos/library', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const logos = await readLogoLibrary();
    res.json({ logos });
  } catch (error) {
    console.error('Erro ao carregar biblioteca de logos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Devolve os templates estáticos disponíveis para começar um novo layout.
app.get('/api/templates/library', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const result = await pool.query(
      `SELECT id, name, description, width, height, template_type, source_template_id, file_path, canvas_data, created_by, created_at
       FROM app_templates
       WHERE file_path IS NOT NULL
       ORDER BY created_at DESC`
    );

    const templates = result.rows.map(mapTemplateRow);

    res.json({ templates });
  } catch (error) {
    console.error('Erro ao carregar biblioteca de templates:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Lista templates guardados na base de dados.
app.get('/api/templates', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const { sourceTemplateId } = req.query;
    const queryParams = [];
    let whereClause = '';

    if (typeof sourceTemplateId === 'string' && sourceTemplateId.trim()) {
      queryParams.push(sourceTemplateId.trim());
      whereClause = 'WHERE source_template_id = $1';
    }

    const result = await pool.query(
      `SELECT id, name, description, width, height, template_type, source_template_id, file_path, canvas_data, created_by, created_at
       FROM app_templates
       ${whereClause}
       ORDER BY created_at DESC`,
      queryParams
    );

    res.json({ templates: result.rows.map(mapTemplateRow) });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Guarda um template criado no editor na base de dados.
app.post('/api/templates', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const {
      name,
      description,
      width,
      height,
      canvasData,
      sourceTemplateId,
      templateType,
      filePath,
    } = req.body || {};

    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedDescription = typeof description === 'string' ? description.trim() : '';
    const normalizedSourceTemplateId = typeof sourceTemplateId === 'string' ? sourceTemplateId.trim() : null;
    const normalizedTemplateType = typeof templateType === 'string' ? templateType.trim() : 'canvas';
    const normalizedFilePath = typeof filePath === 'string' && filePath.trim() ? filePath.trim() : null;
    const parsedWidth = Number.isFinite(Number(width)) ? Number(width) : null;
    const parsedHeight = Number.isFinite(Number(height)) ? Number(height) : null;
    let normalizedCanvasData = canvasData;

    if (typeof canvasData === 'string') {
      try {
        normalizedCanvasData = JSON.parse(canvasData);
      } catch (parseError) {
        return res.status(400).json({ error: 'Canvas data inválido' });
      }
    }

    if (!normalizedName) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!normalizedCanvasData && !normalizedFilePath) {
      return res.status(400).json({ error: 'Dados do template são obrigatórios' });
    }

    const result = await pool.query(
      `INSERT INTO app_templates (
        name,
        description,
        width,
        height,
        template_type,
        source_template_id,
        file_path,
        canvas_data,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, description, width, height, template_type, source_template_id, file_path, canvas_data, created_by, created_at`,
      [
        normalizedName,
        normalizedDescription,
        parsedWidth,
        parsedHeight,
        normalizedTemplateType,
        normalizedSourceTemplateId,
        normalizedFilePath,
        normalizedCanvasData || null,
        session.user.id,
      ]
    );

    res.status(201).json({ template: mapTemplateRow(result.rows[0]) });
  } catch (error) {
    console.error('Erro ao guardar template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remove template guardado da base de dados.
app.delete('/api/templates/:id', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const templateId = req.params.id;
    if (!templateId) {
      return res.status(400).json({ error: 'ID do template é obrigatório' });
    }

    const result = await pool.query(
      `DELETE FROM app_templates
       WHERE id = $1
       RETURNING id, file_path`,
      [templateId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    const deleted = result.rows[0];
    if (deleted.file_path && deleted.file_path.startsWith('/Templates/')) {
      const safeFileName = basename(deleted.file_path);
      const diskPath = join(TEMPLATES_ROOT, safeFileName);
      try {
        await unlink(diskPath);
      } catch (fileError) {
        if (fileError?.code !== 'ENOENT') {
          console.error('Erro ao remover ficheiro de template:', fileError);
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao apagar template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de template em ficheiro para a biblioteca.
app.post('/api/templates/upload', (req, res) => {
  templateUpload.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      const message = uploadError.code === 'LIMIT_FILE_SIZE'
        ? 'Ficheiro demasiado grande (máx 10MB)'
        : 'Erro ao processar upload';
      return res.status(400).json({ error: message });
    }

    try {
      const session = await requireAdminSession(req, res);
      if (!session) return;

      const normalizedName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const normalizedDescription = typeof req.body?.description === 'string' ? req.body.description.trim() : '';

      if (!normalizedName) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Ficheiro é obrigatório' });
      }

      const extension = normalizeTemplateFileExtension(req.file);
      if (!extension) {
        return res.status(400).json({ error: 'Formato inválido. Use JSON, SVG ou TXT' });
      }

      const safeBase = toSafeFileBaseName(normalizedName);
      const fileName = `${safeBase}_${Date.now()}.${extension}`;
      const filePathOnDisk = join(TEMPLATES_ROOT, fileName);

      await writeFile(filePathOnDisk, req.file.buffer);

      const publicPath = `/Templates/${fileName}`;
      const result = await pool.query(
        `INSERT INTO app_templates (
          name,
          description,
          template_type,
          file_path,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, width, height, template_type, source_template_id, file_path, canvas_data, created_by, created_at`,
        [normalizedName, normalizedDescription, 'file', publicPath, session.user.id]
      );

      res.status(201).json({ template: mapTemplateRow(result.rows[0]) });
    } catch (error) {
      console.error('Erro no upload de template:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
});

// Faz upload de um novo ficheiro para a biblioteca de logos no frontend/public.
app.post('/api/logos/upload', (req, res) => {
  logoUpload.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      const message = uploadError.code === 'LIMIT_FILE_SIZE'
        ? 'Ficheiro demasiado grande (máx 5MB)'
        : 'Erro ao processar upload';
      return res.status(400).json({ error: message });
    }

    try {
      const session = await requireAdminSession(req, res);
      if (!session) return;

      const normalizedName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const normalizedCategory = typeof req.body?.category === 'string' ? req.body.category.trim().toLowerCase() : '';
      const targetFolder = getLogoFolderFromCategory(normalizedCategory);

      if (!normalizedName) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      if (!targetFolder) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Ficheiro é obrigatório' });
      }

      const extension = normalizeImageExtension(req.file);
      if (!extension) {
        return res.status(400).json({ error: 'Formato inválido. Use PNG, JPG, WEBP ou SVG' });
      }

      const safeBase = toSafeFileBaseName(normalizedName);
      const fileName = `${safeBase}_${Date.now()}.${extension}`;
      const folderPath = join(BAUER_IMAGES_ROOT, targetFolder);
      const filePathOnDisk = join(folderPath, fileName);

      await mkdir(folderPath, { recursive: true });
      await writeFile(filePathOnDisk, req.file.buffer);

      const publicPath = `/BauerImages/${targetFolder}/${fileName}`;
      res.status(201).json({
        message: 'Upload concluído',
        logo: {
          id: `${normalizedCategory}-${fileName}`,
          name: normalizedName,
          fileName,
          filePath: publicPath,
          category: normalizedCategory,
        },
      });
    } catch (error) {
      console.error('Erro no upload de logo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
});

// Lista logos que ja foram guardados na base de dados.
app.get('/api/logos', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const result = await pool.query(
      `SELECT id, name, category, file_path, created_by, created_at
       FROM app_logos
       ORDER BY created_at DESC`
    );

    const logos = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      filePath: row.file_path,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));

    res.json({ logos });
  } catch (error) {
    console.error('Erro ao listar logos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cria ou atualiza um logo na base de dados usando ficheiro ja existente.
app.post('/api/logos', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const { name, category, filePath } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedCategory = typeof category === 'string' ? category.trim().toLowerCase() : '';
    const normalizedPath = typeof filePath === 'string' ? filePath.trim() : '';

    if (!normalizedName) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (!['logo', 'audio'].includes(normalizedCategory)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }

    if (!normalizedPath.startsWith('/BauerImages/')) {
      return res.status(400).json({ error: 'Caminho do logo inválido' });
    }

    const library = await readLogoLibrary();
    const fileExistsInLibrary = library.some(
      (item) => item.category === normalizedCategory && item.filePath === normalizedPath
    );

    if (!fileExistsInLibrary) {
      return res.status(400).json({ error: 'Logo não encontrado nas pastas da app' });
    }

    const result = await pool.query(
      `INSERT INTO app_logos (name, category, file_path, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (category, file_path)
       DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, category, file_path, created_by, created_at`,
      [normalizedName, normalizedCategory, normalizedPath, session.user.id]
    );

    const row = result.rows[0];
    res.status(201).json({
      logo: {
        id: row.id,
        name: row.name,
        category: row.category,
        filePath: row.file_path,
        createdBy: row.created_by,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Erro ao criar logo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remove logo guardado da base de dados.
app.delete('/api/logos/:id', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const logoId = req.params.id;
    if (!logoId) {
      return res.status(400).json({ error: 'ID do logo é obrigatório' });
    }

    const result = await pool.query(
      `DELETE FROM app_logos
       WHERE id = $1
       RETURNING id`,
      [logoId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Logo não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao apagar logo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cria um report de admin para analise do superadmin.
app.post('/api/admin/reports', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const actorRole = session.user.role || session.user.usertype || 'user';
    const actorIsSuperAdmin = actorRole === 'superadmin';

    const { targetUserId, description } = req.body;
    const trimmedDescription = typeof description === 'string' ? description.trim() : '';

    if (!targetUserId) {
      return res.status(400).json({ error: 'ID do utilizador é obrigatório' });
    }

    if (trimmedDescription.length < 5) {
      return res.status(400).json({ error: 'Descrição do report é obrigatória' });
    }

    if (targetUserId === session.user.id) {
      return res.status(400).json({ error: 'Não pode reportar a sua própria conta' });
    }

    const targetUserResult = await pool.query(
      'SELECT id, name, email, role, usertype FROM "user" WHERE id = $1',
      [targetUserId]
    );

    if (targetUserResult.rowCount === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const targetUser = targetUserResult.rows[0];
    const targetRole = targetUser.role || targetUser.usertype || 'user';
    const targetIsAdmin = targetRole === 'admin' || targetRole === 'superadmin';

    if (actorIsSuperAdmin && targetRole === 'superadmin') {
      return res.status(403).json({ error: 'Superadmin não pode reportar outro superadmin' });
    }

    if (!targetIsAdmin) {
      return res.status(403).json({ error: 'Só é possível reportar contas de admin' });
    }

    const reporterName = session.user.name || session.user.email || 'Sem nome';
    const reporterEmail = session.user.email || '-';

    const result = await pool.query(
      `INSERT INTO admin_reports (
        target_user_id,
        reporter_user_id,
        target_name,
        target_email,
        target_role,
        reporter_name,
        reporter_email,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at`,
      [
        targetUser.id,
        session.user.id,
        targetUser.name || 'Sem nome',
        targetUser.email,
        targetRole,
        reporterName,
        reporterEmail,
        trimmedDescription,
      ]
    );

    res.status(201).json({
      success: true,
      report: {
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error('Erro ao criar report:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Apaga utilizador selecionado no painel admin.
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const targetUserId = req.params.id;
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID do utilizador é obrigatório' });
    }

    if (targetUserId === session.user.id) {
      return res.status(400).json({ error: 'Não pode apagar a própria conta' });
    }

    const actorRole = session.user.role || session.user.usertype || 'user';
    const actorIsSuperAdmin = actorRole === 'superadmin';

    const targetUserResult = await pool.query(
      'SELECT id, role, usertype FROM "user" WHERE id = $1',
      [targetUserId]
    );

    if (targetUserResult.rowCount === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const targetUser = targetUserResult.rows[0];
    const targetRole = targetUser.role || targetUser.usertype || 'user';
    const targetIsAdmin = targetRole === 'admin' || targetRole === 'superadmin';

    if (targetIsAdmin && !actorIsSuperAdmin) {
      return res.status(403).json({ error: 'Apenas superadmin pode apagar contas admin' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM "session" WHERE user_id = $1', [targetUserId]);
      await client.query('DELETE FROM "account" WHERE user_id = $1', [targetUserId]);

      const result = await client.query('DELETE FROM "user" WHERE id = $1 RETURNING id', [targetUserId]);
      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Utilizador não encontrado' });
      }

      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

    res.json({ success: true, message: 'Conta apagada com sucesso' });
  } catch (error) {
    console.error('Erro ao apagar utilizador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cria um novo utilizador pela area de administracao.
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const { name, email, password, role } = req.body;
    const normalizedRole = role || 'user';

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    if (!['user', 'admin', 'superadmin'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    const actorRole = session.user.role || session.user.usertype || 'user';
    if (normalizedRole === 'superadmin' && actorRole !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas superadmin pode criar super admin' });
    }

    const existingUser = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: 'Email já está registado' });
    }

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split('@')[0],
        role: normalizedRole,
        usertype: normalizedRole,
      },
    });

    res.status(201).json({
      message: 'Utilizador criado com sucesso',
      user: {
        id: result?.user?.id,
        email: result?.user?.email || email,
        role: normalizedRole,
      },
    });
  } catch (error) {
    console.error('Erro ao criar utilizador por admin:', error);
    const message = error?.message || 'Falha ao criar utilizador';
    res.status(500).json({ error: message });
  }
});

// ============================================
// ROTAS CUSTOM - UPLOAD DE AVATAR
// ============================================

/**
 * POST /api/user/avatar
 * FUNÇÃO: Fazer upload de foto de perfil
 * RECEBE: { image: string (base64) }
 * RETORNA: { success: true, avatarUrl: string } ou erro
 * AUTENTICAÇÃO: Requer sessão válida do Better Auth
 */
app.post('/api/user/avatar', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    // Verificar autenticação com Better Auth
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    // Validar base64
    if (!image.startsWith('data:image')) {
      return res.status(400).json({ error: 'Formato inválido. Use JPG, PNG ou WebP' });
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

    // Verificar tamanho (aproximado ~2MB)
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Imagem demasiado grande (máx 2MB)' });
    }

    // Guardar ficheiro
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = join(avatarsDir, fileName);
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filePath, buffer);

    // URL completa do backend
    const avatarUrl = `http://localhost:${process.env.PORT || 5000}/avatars/${fileName}`;

    // Atualizar na base de dados (tabela user do Better Auth)
    await pool.query(
      'UPDATE "user" SET image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, session.user.id]
    );

    console.log(`✅ Avatar atualizado: ${session.user.email} → ${fileName}`);

    res.json({ 
      success: true, 
      avatarUrl 
    });

  } catch (error) {
    console.error('Erro no upload de avatar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================
// ROTAS CUSTOM - RECUPERAÇÃO DE SENHA
// Todas as rotas usam o mesmo pool de conexão do PostgreSQL
// ============================================

/**
 * POST /api/password/recover
 * FUNÇÃO: Gera um código de recuperação de senha
 * RECEBE: { email: string }
 * RETORNA: { message: 'Código enviado' } ou erro
 * PROCESSO:
 *   1. Valida o email (deve conter @)
 *   2. Verifica se o email existe na tabela 'user'
 *   3. Gera um código aleatório de 6 dígitos
 *   4. Salva o código na tabela 'recovery_codes' com validade de 1 hora
 *   5. Loga o email e código no console (para debug)
 */
app.post('/api/password/recover', async (req, res) => {
  try {
    const { email } = req.body;

    // Validação: email é obrigatório e deve ser válido
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    // Verificação: email deve existir na tabela user (usuário registado)
    const userResult = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Email não existe' });
    }

    // Gera um código aleatório de 6 dígitos (100000-999999)
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Salva o código na base de dados com expiração de 1 hora
    await pool.query(
      `INSERT INTO recovery_codes (email, code, used, expires_at)
       VALUES ($1, $2, FALSE, NOW() + INTERVAL '1 hour')`,
      [email, recoveryCode]
    );

    // Log para debug - mostra o email e código gerado no console
    console.log(`📧 EMAIL: ${email} | 🔑 CÓDIGO: ${recoveryCode}`);

    // Resposta de sucesso
    res.json({ message: 'Código enviado' });

  } catch (error) {
    // Tratamento de erros não esperados
    console.error('Erro no recover:', error);
    res.status(500).json({ error: 'Falha ao processar' });
  }
});

/**
 * POST /api/password/verify-code
 * FUNÇÃO: Verifica se o código de recuperação é válido
 * RECEBE: { email: string, code: string }
 * RETORNA: { valid: true, codeId: number } ou erro
 * PROCESSO:
 *   1. Procura o código na tabela recovery_codes
 *   2. Verifica se NÃO foi usado (used = FALSE)
 *   3. Verifica se NÃO expirou (expires_at > NOW())
 *   4. Se válido, retorna o ID do código para usar no reset
 */
app.post('/api/password/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    // Procura o código na base de dados com múltiplas validações
    const result = await pool.query(
      `SELECT * FROM recovery_codes 
       WHERE email = $1             -- email correto
       AND code = $2                -- código correto
       AND used = FALSE             -- código ainda não foi usado
       AND expires_at > NOW()       -- código ainda não expirou`,
      [email, code]
    );

    // Se não encontrou nenhum resultado, código é inválido/expirado
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    // Resposta de sucesso com o ID do código para usar no próximo passo
    res.json({ 
      valid: true, 
      codeId: result.rows[0].id   // ID necessário para o passo de reset
    });

  } catch (error) {
    console.error('Erro no verify:', error);
    res.status(500).json({ error: 'Erro na verificação' });
  }
});

/**
 * POST /api/password/reset
 * FUNÇÃO: Marca o código como usado após a alteração de senha
 * RECEBE: { codeId: number }
 * RETORNA: { message: 'Senha alterada com sucesso' } ou erro
 * PROCESSO:
 *   1. Marca o código como usado (used = TRUE)
 *   2. Impede que o mesmo código seja reutilizado
 *   3. Completa o fluxo de recuperação de senha
 */
app.post('/api/password/reset', async (req, res) => {
  try {
    const { email, codeId, newPassword } = req.body;

    if (!email || !codeId || !newPassword) {
      return res.status(400).json({ error: 'Dados incompletos para reset' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const codeResult = await pool.query(
      `SELECT id FROM recovery_codes
       WHERE id = $1
       AND email = $2
       AND used = FALSE
       AND expires_at > NOW()`,
      [codeId, email]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    const userResult = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Utilizador não encontrado' });
    }

    const userId = userResult.rows[0].id;
    const hashedPassword = await hashPassword(newPassword);

    await pool.query('BEGIN');
    await pool.query(
      'UPDATE "account" SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [hashedPassword, userId]
    );
    await pool.query(
      'UPDATE "user" SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );
    await pool.query('UPDATE recovery_codes SET used = TRUE WHERE id = $1', [codeId]);
    await pool.query('COMMIT');

    // Log de sucesso
    console.log(`✅ Código marcado como usado: ${codeId}`);
    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Erro no rollback:', rollbackError);
    }
    console.error('Erro no reset:', error);
    res.status(500).json({ error: 'Falha ao alterar senha' });
  }
});


// ============================================
// EMAIL ROUTES - Temporary Image Upload
// ============================================

// Store temporary images in memory with expiry
const tempImages = new Map();
const TEMP_IMAGE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * POST /api/email/upload-image
 * Upload base64 image temporarily for email compose
 * Returns: { imageId, imageUrl, expiresIn }
 */
app.post('/api/email/upload-image', express.json({ limit: '5mb' }), (req, res) => {
  try {
    const { imageBase64, fileName } = req.body;

    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    // Generate unique image ID
    const imageId = uuidv4();

    // Extract MIME type and remove data URI prefix
    const mimeMatch = imageBase64.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Data = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');

    // Store in memory
    tempImages.set(imageId, {
      data: base64Data,
      mimeType,
      fileName: fileName || `image-${Date.now()}.png`,
      createdAt: Date.now(),
    });

    // Auto-delete after expiry
    setTimeout(() => {
      tempImages.delete(imageId);
    }, TEMP_IMAGE_EXPIRY_MS);

    const imageUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/email/temp-image/${imageId}`;

    res.json({
      success: true,
      imageId,
      imageUrl,
      expiresIn: TEMP_IMAGE_EXPIRY_MS / 1000, // seconds
    });
  } catch (error) {
    console.error('Error uploading temporary image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * GET /api/email/temp-image/:imageId
 * Retrieve temporary image, auto-delete after serving
 */
app.get('/api/email/temp-image/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    const imageData = tempImages.get(imageId);

    if (!imageData) {
      return res.status(404).json({ error: 'Image not found or expired' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData.data, 'base64');

    // Set response headers
    res.setHeader('Content-Type', imageData.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${imageData.fileName}"`);
    res.setHeader('Cache-Control', 'private, max-age=1800'); // 30 min cache

    // Send image
    res.send(buffer);

  } catch (error) {
    console.error('Error serving temporary image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Better Auth - handler para rotas de autenticação
app.all("/api/auth/*", toNodeHandler(auth));

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const PORT = process.env.PORT || 5000;  // Porta 3001 (vem do .env)
const server = app.listen(PORT, () => {
  console.log("   Backend iniciado com sucesso"); 
  console.log(`🚀 Backend: http://localhost:${PORT}`);
  console.log(`📁 Avatars: ${avatarsDir}`);
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`⚠️ Porta ${PORT} já está em uso. Já existe um backend em execução.`);
    console.error('➡️ Fecha a instância antiga ou usa outra porta no ficheiro .env (PORT=...).');
    process.exit(1);
  }

  console.error('Erro ao iniciar o servidor:', error);
  process.exit(1);
});