/**
 * CONFIGURAÇÃO DE AUTENTICAÇÃO - Better Auth + Resend
 */

import { betterAuth } from "better-auth";
import { Resend } from "resend";
import { pool } from "./src/server/lib/db.js";
import { ENV } from "./src/config/env.js";
import { ResetPassword } from "./src/emails/ResetPassword.js";

// Resend config
const resend = new Resend(ENV.RESEND_API_KEY);
const FROM_EMAIL = ENV.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const auth = betterAuth({
    database: pool,
    secret: ENV.BETTER_AUTH_SECRET,
    baseURL: ENV.BETTER_AUTH_URL,

    emailAndPassword: {
        enabled: true,

        // ✅ Better Auth gere o token, tu apenas envias o email
        sendResetPassword: async ({ user, url }) => {
           
            const name = user.name || user.email.split("@")[0];
            
            await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: "Recuperação de Password",
                html: ResetPassword({ name, url }), // 'url' tem token JWT do Better Auth
            });
            
            console.log(`R  eset enviado para ${user.email}`);
        },
    },
});

export default auth;