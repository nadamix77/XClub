import NextAuth, { type NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET
      ? [
          TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const p = profile as Record<string, unknown>
        const d = (p.data ?? {}) as Record<string, unknown>
        token.twitterUserId = String(d.id ?? p.id ?? "")
        token.twitterHandle = String(d.username ?? p.screen_name ?? "")
        token.twitterName = String(d.name ?? token.name ?? "")
        token.twitterAvatar = String(d.profile_image_url ?? p.profile_image_url_https ?? token.picture ?? "")
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.twitterUserId = token.twitterUserId as string
        session.user.twitterHandle = token.twitterHandle as string
        session.user.twitterName = token.twitterName as string
        session.user.twitterAvatar = token.twitterAvatar as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
