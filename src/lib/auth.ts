import NextAuth, { type NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"
import CredentialsProvider from "next-auth/providers/credentials"

const hasTwitterAuth = !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET)

const providers: NextAuthOptions["providers"] = []

if (hasTwitterAuth) {
  providers.push(
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    })
  )
} else {
  providers.push(
    CredentialsProvider({
      id: "demo",
      name: "Demo",
      credentials: {
        handle: { label: "Handle", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.handle) return null
        const handle = credentials.handle.replace("@", "")
        return {
          id: `demo_${handle}`,
          name: handle,
          image: "",
        }
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Twitter OAuth
      if (account?.provider === "twitter" && profile) {
        token.twitterUserId = profile.data?.id || profile.id
        token.twitterHandle = profile.data?.username || (profile as Record<string, unknown>).screen_name as string || ""
        token.twitterName = profile.data?.name || token.name || ""
        token.twitterAvatar = profile.data?.profile_image_url || (profile as Record<string, unknown>).profile_image_url_https as string || token.picture || ""
      }
      // Demo credentials
      if (account?.provider === "credentials" && user) {
        token.twitterUserId = `demo_${user.name}`
        token.twitterHandle = user.name || "demo_user"
        token.twitterName = user.name || "Demo User"
        token.twitterAvatar = ""
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
