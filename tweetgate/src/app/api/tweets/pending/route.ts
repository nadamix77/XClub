import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password")
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tweets = await db.tweet.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ tweets })
}
