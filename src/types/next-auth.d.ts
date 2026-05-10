import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      twitterUserId: string
      twitterHandle: string
      twitterName: string
      twitterAvatar: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    twitterUserId?: string
    twitterHandle?: string
    twitterName?: string
    twitterAvatar?: string
  }
}
