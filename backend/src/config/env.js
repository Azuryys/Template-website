/**
 * VARIÁVEIS DE AMBIENTE
 * Ficheiro: env.js
 * FUNÇÃO: Centralizar todas as configurações do projeto (lidas do .env)
 * ACESSO: São importadas em db.js e auth.js
 */

import dotenv from "dotenv"


dotenv.config();

export const ENV =  {
    // ========== SERVIDOR ==========
    // Porta onde o backend vai rodar (padrão: 3001)
    PORT: process.env.PORT,

    // ========== BASE DE DADOS ==========
    // Host: endereço do servidor PostgreSQL (localhost = máquina local)
    DB_HOST: process.env.DB_HOST,
    // Porta: onde o PostgreSQL está ouvindo (padrão: 5432)
    DB_PORT: process.env.DB_PORT,
    // Nome da base de dados (bannercreator neste projeto)
    DB_NAME: process.env.DB_NAME,
    // Utilizador PostgreSQL (postgres é o utilizador default)
    DB_USER: process.env.DB_USER,
    // Senha de acesso ao PostgreSQL
    DB_PASSWORD: process.env.DB_PASSWORD,

    // ========== AUTENTICAÇÃO ==========
    // Chave secreta para gerar tokens JWT (Better Auth)
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    // URL base do servidor (usado para callbacks/redirects de autenticação)
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,


    // ========== RESEND (ENVIO DE EMAILS) ==========
    RESEND_API_KEY: process.env.RESEND_API_KEY, // Chave de API do Resend
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL, // Email remetente para envios

};