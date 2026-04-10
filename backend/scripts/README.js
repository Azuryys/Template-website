/**
 * SCRIPTS DE BASE DE DADOS
 * ========================
 * 
 * Pasta contendo todos os scripts para inicializar e gerenciar a base de dados
 * 
 * 📌 ORDEM DE EXECUÇÃO (primeira vez):
 * 1. create-tables.js - Criar as tabelas
 * 2. seed-users.js - Inserir utilizadores de teste
 * 3. check-tables.js - Verificar se tudo foi criado
 */

// ============================================
// SCRIPT 1: create-tables.js
// ============================================
// Cria as tabelas necessárias na base de dados
// 
// USO:
//   npm run migrate
//   ou
//   node scripts/create-tables.js
//
// Cria:
// - "user" - Tabela de utilizadores registados
// - "recovery_codes" - Tabela de códigos de recuperação de senha

// ============================================
// SCRIPT 2: seed-users.js
// ============================================
// Insere utilizadores de teste na base de dados
//
// USO:
//   npm run seed
//   ou
//   node scripts/seed-users.js
//
// Insere:
// - admin@gmail.com
// - kunarata32@gmail.com
// - test@gmail.com

// ============================================
// SCRIPT 3: check-tables.js
// ============================================
// Verifica a estrutura das tabelas criadas
//
// USO:
//   npm run check-db
//   ou
//   node scripts/check-tables.js
//
// Mostra:
// - Estrutura (colunas e tipos)
// - Número de registos em cada tabela

// ============================================
// ADICIONAR AOS SCRIPTS DO package.json:
// ============================================
// {
//   "scripts": {
//     "migrate": "node scripts/create-tables.js",
//     "seed": "node scripts/seed-users.js",
//     "check-db": "node scripts/check-tables.js"
//   }
// }
