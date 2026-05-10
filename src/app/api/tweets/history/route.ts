import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password")
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tweets = await db.tweet.findMany({
    where: { status: { in: ["posted", "rejected", "failed"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json({ tweets })
}
