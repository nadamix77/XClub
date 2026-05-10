import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const WEEKLY_LIMIT = parseInt(process.env.WEEKLY_LIMIT || "3")

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 })
  }

  const twitterUserId = (session.user as Record<string, unknown>).twitterUserId as string

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const count = await db.tweet.count({
    where: {
      twitterUserId,
      createdAt: { gte: oneWeekAgo },
    },
  })

  return NextResponse.json({ count, limit: WEEKLY_LIMIT })
}
