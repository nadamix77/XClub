"use client"

import { useState, useCallback, useEffect, type FormEvent } from "react"
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Twitter,
  Send,
  Shield,
  Check,
  X,
  Clock,
  AlertTriangle,
  History,
  LogOut,
  Key,
} from "lucide-react"

const WEEKLY_LIMIT = 3

type Tweet = {
  id: string
  content: string
  twitterHandle: string
  twitterName: string
  twitterAvatar: string
  status: string
  flagReason: string | null
  tweetId: string | null
  createdAt: string
}

function App() {
  return (
    <SessionProvider>
      <Main />
    </SessionProvider>
  )
}

function Main() {
  const { data: session } = useSession()
  const [adminMode, setAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [adminAuthed, setAdminAuthed] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Twitter className="w-6 h-6 text-sky-500" />
            <h1 className="text-xl font-bold">TweetGate</h1>
          </div>
          <div className="flex items-center gap-2">
            {session?.user && !adminMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAdminMode(true)}
                className="text-muted-foreground"
              >
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </Button>
            )}
            {adminMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdminMode(false)
                  setAdminAuthed(false)
                }}
              >
                Back to Submit
              </Button>
            )}
            {session?.user && !adminMode && (
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {adminMode ? (
          <AdminPanel
            password={adminPassword}
            setPassword={setAdminPassword}
            authed={adminAuthed}
            setAuthed={setAdminAuthed}
          />
        ) : session?.user ? (
          <SubmitForm />
        ) : (
          <LoginPrompt />
        )}
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        TweetGate — Community Twitter Posting
      </footer>
    </div>
  )
}

function LoginPrompt() {
  const hasTwitterAuth = !!process.env.NEXT_PUBLIC_TWITTER_AUTH

  if (!hasTwitterAuth) {
    return (
      <Card className="text-center">
        <CardContent className="pt-8 pb-8">
          <Twitter className="w-12 h-12 text-sky-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">TweetGate</h2>
          <p className="text-muted-foreground mb-4">
            Twitter OAuth is not configured yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Add <code className="bg-muted px-1 rounded">TWITTER_CLIENT_ID</code> and{" "}
            <code className="bg-muted px-1 rounded">TWITTER_CLIENT_SECRET</code>{" "}
            to your <code className="bg-muted px-1 rounded">.env</code> file to enable login.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="text-center">
      <CardContent className="pt-8 pb-8">
        <Twitter className="w-12 h-12 text-sky-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Submit a Tweet</h2>
        <p className="text-muted-foreground mb-6">
          Sign in with your Twitter account to submit tweets. Clean tweets post
          instantly, suspicious ones need admin approval.
        </p>
        <Button onClick={() => signIn("twitter")} size="lg" className="gap-2">
          <Twitter className="w-5 h-5" />
          Sign in with Twitter
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          {WEEKLY_LIMIT} tweets per week per account
        </p>
      </CardContent>
    </Card>
  )
}

function SubmitForm() {
  const { data: session } = useSession()
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    autoPosted: boolean
    flagReasons?: string[]
    error?: string
  } | null>(null)
  const [weekCount, setWeekCount] = useState<number | null>(null)

  const remaining = weekCount !== null ? WEEKLY_LIMIT - weekCount : WEEKLY_LIMIT

  useEffect(() => {
    fetch("/api/tweets/count")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setWeekCount(data.count)
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!content.trim() || remaining <= 0) return
    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, autoPosted: false, error: data.error })
      } else {
        setResult({
          success: true,
          autoPosted: data.autoPosted,
          flagReasons: data.flagReasons,
        })
        setContent("")
        setWeekCount((c) => (c !== null ? c + 1 : 1))
      }
    } catch {
      setResult({
        success: false,
        autoPosted: false,
        error: "Network error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const user = session?.user
  const avatarUrl = (user as Record<string, unknown>)?.twitterAvatar as string || user?.image

  return (
    <div className="space-y-6">
      {/* User info */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full"
          />
        ) : null}
        <div>
          <p className="font-medium">
            @{((user as Record<string, unknown>)?.twitterHandle as string) || user?.name || ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {remaining > 0
              ? `${remaining}/${WEEKLY_LIMIT} tweets remaining this week`
              : "No tweets remaining this week"}
          </p>
        </div>
      </div>

      {/* Tweet form */}
      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            rows={4}
            className="resize-none text-lg"
            disabled={remaining <= 0}
          />
          <div className="flex items-center justify-between mt-3">
            <span
              className={`text-sm ${
                content.length > 260 ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              {content.length}/280
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting || remaining <= 0}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Tweet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result message */}
      {result && (
        <Card
          className={
            result.success
              ? result.autoPosted
                ? "border-green-500/50"
                : "border-yellow-500/50"
              : "border-red-500/50"
          }
        >
          <CardContent className="pt-6">
            {result.success ? (
              result.autoPosted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span>Your tweet has been posted!</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-yellow-600">
                  <AlertTriangle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      Your tweet is pending admin review
                    </p>
                    {result.flagReasons && result.flagReasons.length > 0 && (
                      <p className="text-sm mt-1">
                        Flagged: {result.flagReasons.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <X className="w-5 h-5" />
                <span>{result.error || "Something went wrong"}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AdminPanel({
  password,
  setPassword,
  authed,
  setAuthed,
}: {
  password: string
  setPassword: (p: string) => void
  authed: boolean
  setAuthed: (a: boolean) => void
}) {
  const [pending, setPending] = useState<Tweet[]>([])
  const [history, setHistory] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const fetchPending = useCallback(async () => {
    if (!authed) return
    setLoading(true)
    try {
      const res = await fetch("/api/tweets/pending", {
        headers: { "x-admin-password": password },
      })
      if (res.ok) {
        const data = await res.json()
        setPending(data.tweets)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [authed, password])

  const fetchHistory = useCallback(async () => {
    if (!authed) return
    try {
      const res = await fetch("/api/tweets/history", {
        headers: { "x-admin-password": password },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.tweets)
      }
    } catch {
      // ignore
    }
  }, [authed, password])

  const handleLogin = async () => {
    const res = await fetch("/api/tweets/pending", {
      headers: { "x-admin-password": password },
    })
    if (res.ok) {
      setAuthed(true)
      const data = await res.json()
      setPending(data.tweets)
    }
  }

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/tweets/${id}/approve`, {
      method: "POST",
      headers: { "x-admin-password": password },
    })
    if (res.ok) {
      setPending((p) => p.filter((t) => t.id !== id))
    }
  }

  const handleReject = async (id: string) => {
    const res = await fetch(`/api/tweets/${id}/reject`, {
      method: "POST",
      headers: { "x-admin-password": password },
    })
    if (res.ok) {
      setPending((p) => p.filter((t) => t.id !== id))
    }
  }

  if (!authed) {
    return (
      <Card className="max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              handleLogin()
            }}
          >
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3"
            />
            <Button type="submit" className="w-full">
              Enter
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pending Review ({pending.length})
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory) fetchHistory()
            }}
          >
            <History className="w-4 h-4 mr-1" />
            {showHistory ? "Hide" : "Show"} History
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPending}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : pending.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending tweets
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((tweet) => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              onApprove={() => handleApprove(tweet.id)}
              onReject={() => handleReject(tweet.id)}
            />
          ))}
        </div>
      )}

      {showHistory && (
        <>
          <Separator />
          <h3 className="text-lg font-semibold">History</h3>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No history yet
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((tweet) => (
                <div
                  key={tweet.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <img
                    src={tweet.twitterAvatar}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">
                        @{tweet.twitterHandle}
                      </span>
                      : {tweet.content}
                    </p>
                  </div>
                  <StatusBadge status={tweet.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TweetCard({
  tweet,
  onApprove,
  onReject,
}: {
  tweet: Tweet
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <img
            src={tweet.twitterAvatar}
            alt=""
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">@{tweet.twitterHandle}</span>
              <span className="text-sm text-muted-foreground">
                {tweet.twitterName}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{tweet.content}</p>
            {tweet.flagReason && (
              <div className="mt-2 flex items-start gap-1 text-sm text-yellow-600">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{tweet.flagReason}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={onApprove} className="gap-1">
                <Check className="w-4 h-4" />
                Approve & Post
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onReject}
                className="gap-1"
              >
                <X className="w-4 h-4" />
                Reject
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(tweet.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    posted: { label: "Posted", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
    failed: { label: "Failed", variant: "destructive" },
    pending: { label: "Pending", variant: "secondary" },
  }
  const info = map[status] || { label: status, variant: "outline" as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

export default App
