import NextAuth, { type NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.twitterUserId = profile.data?.id || profile.id
        token.twitterHandle = profile.data?.username || (profile as Record<string, unknown>).screen_name as string || ""
        token.twitterName = profile.data?.name || token.name || ""
        token.twitterAvatar = profile.data?.profile_image_url || (profile as Record<string, unknown>).profile_image_url_https as string || token.picture || ""
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
