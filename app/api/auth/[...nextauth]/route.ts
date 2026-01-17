import NextAuth, { NextAuthOptions, Account, Session } from "next-auth"
import { JWT } from "next-auth/jwt"
import FacebookProvider from "next-auth/providers/facebook"

export const authOptions: NextAuthOptions = {
    providers: [
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID || "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
            // Pedimos todos los permisos necesarios para que Meta nos devuelva la estructura de IG
            authorization: {
                params: {
                    scope: "email,public_profile,instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement",
                    auth_type: "rerequest",
                    display: "popup"
                }
            }
        }),
    ],
    callbacks: {
        async jwt({ token, account }: { token: JWT, account: Account | null }) {
            // Guardamos el Access Token de Meta para usarlo en las llamadas a la API
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
        async session({ session, token }: { session: Session & { accessToken?: string }, token: JWT }) {
            // Pasamos el token a la sesión del cliente para poder usarlo
            session.accessToken = token.accessToken as string
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
