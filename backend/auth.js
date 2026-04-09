import { betterAuth } from "better-auth";
import { pool } from "./src/server/lib/db.js";
import { ENV } from "./src/config/env.js";


export const auth = betterAuth({
   database: pool,


    secret: ENV.BETTER_AUTH_SECRET,
    baseURL: ENV.BETTER_AUTH_URL,

     // Adicione os métodos de autenticação
    emailAndPassword: {
        enabled: true,
    },
});


export default auth;