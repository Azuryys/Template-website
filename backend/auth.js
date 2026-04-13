import { betterAuth } from "better-auth";
import { Resend } from "resend";
import { pool } from "./src/server/lib/db.js";
import { ENV } from "./src/config/env.js";
import { ResetPassword } from "./src/emails/ResetPassword.js";

const resend = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;
const FROM_EMAIL = ENV.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const auth = betterAuth({
    // ✅ FORMA CORRETA - passa o pool direto
    database: pool,
    
    secret: ENV.BETTER_AUTH_SECRET,
    baseURL: ENV.BETTER_AUTH_URL || "http://localhost:3001",
    trustedOrigins: [ENV.FRONTEND_URL || "http://localhost:3000"],

    user: {
        fields: {
            emailVerified: "email_verified",
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user"
            },
            usertype: {
                type: "string",
                defaultValue: "user"
            }
        }
    },

    session: {
        fields: {
            userId: "user_id",
            expiresAt: "expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at",
            ipAddress: "ip_address",
            userAgent: "user_agent",
        },
    },

    account: {
        fields: {
            userId: "user_id",
            accountId: "account_id",
            providerId: "provider_id",
            accessToken: "access_token",
            refreshToken: "refresh_token",
            idToken: "id_token",
            accessTokenExpiresAt: "access_token_expires_at",
            refreshTokenExpiresAt: "refresh_token_expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },

    verification: {
        fields: {
            expiresAt: "expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },

    emailAndPassword: {
        enabled: true,
        onSignIn: async (user) => {
            console.log('✅ Login tentativa:', user.email);
        },
        onSignUp: async (user) => {
            console.log('✅ Registo:', user.email);
        },
        sendResetPassword: async ({ user, url }) => {
            const name = user.name || user.email.split("@")[0];

            if (!resend) {
                console.warn(`Resend API key ausente. Reset password não enviado para ${user.email}`);
                return;
            }

            await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: "Recuperação de Password",
                html: ResetPassword({ name, url }),
            });
            
            console.log(`Reset enviado para ${user.email}`);
        },
    },

    twoFactor: {
        enabled: true,
    },
});

export default auth;