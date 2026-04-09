/**
 * CONFIGURAÇÃO DE AUTENTICAÇÃO
 * Ficheiro: auth.js
 * Biblioteca: Better Auth
 * FUNÇÃO: Gerenciar login, registo e autenticação
 * STATUS: Comentado em server.js por conflito com rotas customizadas
 */

import { betterAuth } from "better-auth";
import { pool } from "./src/server/lib/db.js";  // Conexão com PostgreSQL
import { ENV } from "./src/config/env.js";      // Variáveis de ambiente

/**
 * Instância do Better Auth
 * - database: Usa o pool de conexões do PostgreSQL
 * - secret: Chave secreta para tokens JWT
 * - baseURL: URL onde o backend está rodando
 * - emailAndPassword: Habilita login com email/senha
 */
export const auth = betterAuth({
   database: pool,  // Conexão compartilhada com PostgreSQL

   secret: ENV.BETTER_AUTH_SECRET,        // Chave secreta (do .env)
   baseURL: ENV.BETTER_AUTH_URL,          // http://localhost:3001

   // Métodos de autenticação disponíveis
   emailAndPassword: {
       enabled: true,  // Permite login/registo com email + senha
   },
});

export default auth;