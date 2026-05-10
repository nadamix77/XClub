import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { postTweet } from "@/lib/twitter"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const password = req.headers.get("x-admin-password")
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const tweet = await db.tweet.findUnique({ where: { id } })

  if (!tweet || tweet.status !== "pending") {
    return NextResponse.json({ error: "Tweet not found or not pending" }, { status: 404 })
  }

  try {
    const tweetId = await postTweet(tweet.content)
    const updated = await db.tweet.update({
      where: { id },
      data: { status: "posted", tweetId },
    })
    return NextResponse.json({ tweet: updated })
  } catch (err) {
    const updated = await db.tweet.update({
      where: { id },
      data: { status: "failed" },
    })
    return NextResponse.json(
      { error: "Failed to post tweet", tweet: updated },
      { status: 500 }
    )
  }
}
