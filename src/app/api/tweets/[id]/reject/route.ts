import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

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

  const updated = await db.tweet.update({
    where: { id },
    data: { status: "rejected" },
  })

  return NextResponse.json({ tweet: updated })
}
