import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { filterContent } from "@/lib/filter"
import { postTweet } from "@/lib/twitter"

const WEEKLY_LIMIT = parseInt(process.env.WEEKLY_LIMIT || "3")

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 })
  }

  const { content } = await req.json()
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Tweet content is required" }, { status: 400 })
  }

  if (content.length > 280) {
    return NextResponse.json({ error: "Tweet exceeds 280 characters" }, { status: 400 })
  }

  const twitterUserId = (session.user as Record<string, unknown>).twitterUserId as string
  const twitterHandle = (session.user as Record<string, unknown>).twitterHandle as string
  const twitterName = (session.user as Record<string, unknown>).twitterName as string
  const twitterAvatar = (session.user as Record<string, unknown>).twitterAvatar as string

  // Rate limit: check submissions this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const weekCount = await db.tweet.count({
    where: {
      twitterUserId,
      createdAt: { gte: oneWeekAgo },
    },
  })

  if (weekCount >= WEEKLY_LIMIT) {
    return NextResponse.json(
      { error: `Weekly limit reached (${WEEKLY_LIMIT}/${WEEKLY_LIMIT})` },
      { status: 429 }
    )
  }

  // Filter content
  const filterResult = filterContent(content)

  if (filterResult.isClean) {
    // Auto-post
    try {
      const tweetId = await postTweet(content)
      const tweet = await db.tweet.create({
        data: {
          content,
          twitterUserId,
          twitterHandle,
          twitterName,
          twitterAvatar,
          status: "posted",
          tweetId,
        },
      })
      return NextResponse.json({ tweet, autoPosted: true })
    } catch {
      // Posting failed — save as pending instead of losing it
      const tweet = await db.tweet.create({
        data: {
          content,
          twitterUserId,
          twitterHandle,
          twitterName,
          twitterAvatar,
          status: "pending",
          flagReason: "Auto-post failed, needs manual approval",
        },
      })
      return NextResponse.json({ tweet, autoPosted: false })
    }
  }

  // Suspicious — hold for review
  const tweet = await db.tweet.create({
    data: {
      content,
      twitterUserId,
      twitterHandle,
      twitterName,
      twitterAvatar,
      status: "pending",
      flagReason: filterResult.reasons.join("; "),
    },
  })

  return NextResponse.json({ tweet, autoPosted: false, flagReasons: filterResult.reasons })
}
