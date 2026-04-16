import { betterAuth } from "better-auth";
import { pool } from "./src/server/lib/db.js";
import { ENV } from "./src/config/env.js";
import { ResetPassword } from "./src/emails/ResetPassword.js";
import { sendPasswordResetEmail } from "./src/lib/sendgrid.js";

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

            try {
                await sendPasswordResetEmail({
                    to: user.email,
                    name,
                    url,
                    htmlTemplate: ResetPassword({ name, url }),
                });
                
                console.log(`✅ Reset enviado para ${user.email}`);
            } catch (error) {
                console.error(`❌ Erro ao enviar reset password para ${user.email}:`, error);
                throw error;
            }
        },
    },

    twoFactor: {
        enabled: true,
    },
});

export default auth;