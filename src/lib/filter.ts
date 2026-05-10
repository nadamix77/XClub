interface FilterResult {
  isClean: boolean
  reasons: string[]
}

const PROFANITY_LIST = [
  "fuck", "shit", "asshole", "bitch", "bastard", "damn",
  "crap", "dick", "piss", "slut", "whore", "cunt",
  "idiot", "moron", "stupid", "dumb",
]

const FLAGGED_KEYWORDS = (process.env.FLAGGED_KEYWORDS || "")
  .split(",")
  .map(k => k.trim().toLowerCase())
  .filter(Boolean)

export function filterContent(content: string): FilterResult {
  const reasons: string[] = []
  const lower = content.toLowerCase()

  // URLs
  if (/https?:\/\/[^\s]+/i.test(content)) {
    reasons.push("Contains URL")
  }

  // @mentions
  const mentions = content.match(/@\w+/g)
  if (mentions && mentions.length > 2) {
    reasons.push(`Excessive @mentions (${mentions.length})`)
  }

  // Profanity
  const foundProfanity = PROFANITY_LIST.filter(w => lower.includes(w))
  if (foundProfanity.length > 0) {
    reasons.push(`Profanity: "${foundProfanity[0]}"`)
  }

  // Custom flagged keywords
  const foundKeywords = FLAGGED_KEYWORDS.filter(k => lower.includes(k))
  if (foundKeywords.length > 0) {
    reasons.push(`Flagged keyword: "${foundKeywords[0]}"`)
  }

  // Excessive caps (>50% of letters are uppercase)
  const letters = content.replace(/[^a-zA-Z]/g, "")
  if (letters.length > 5) {
    const upperCount = letters.replace(/[a-z]/g, "").length
    if (upperCount / letters.length > 0.5) {
      reasons.push("Excessive capitalization")
    }
  }

  // Excessive punctuation
  if (/(?:[!?]){4,}/.test(content)) {
    reasons.push("Excessive punctuation")
  }

  // Repeated characters (spam pattern)
  if (/(.)\1{4,}/.test(content)) {
    reasons.push("Repeated characters (spam pattern)")
  }

  // Hashtag spam (>5 hashtags)
  const hashtags = content.match(/#\w+/g)
  if (hashtags && hashtags.length > 5) {
    reasons.push(`Hashtag spam (${hashtags.length} hashtags)`)
  }

  return {
    isClean: reasons.length === 0,
    reasons,
  }
}
