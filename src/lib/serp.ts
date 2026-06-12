export interface SerpResult {
  position: number | null
  url: string | null
  title: string | null
}

interface SerpApiOrganicResult {
  position: number
  link: string
  title: string
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[]
  error?: string
}

export async function checkKeyword({
  term,
  location,
  propertyUrl,
}: {
  term: string
  location: string
  propertyUrl: string
}): Promise<SerpResult> {
  const params = new URLSearchParams({
    q: term,
    location,
    hl: "en",
    gl: "us",
    api_key: process.env.SERP_API_KEY!,
    num: "100",
    output: "json",
    no_cache: "false",
  })

  const res = await fetch(`https://serpapi.com/search?${params}`, {
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`SerpAPI HTTP ${res.status}`)
  }

  const data: SerpApiResponse = await res.json()

  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`)
  }

  const organic = data.organic_results ?? []

  // Normalize the property URL for matching (strip protocol + trailing slash)
  const normalizedProperty = propertyUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase()

  const match = organic.find((r) => {
    const normalized = r.link
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .toLowerCase()
    return normalized.startsWith(normalizedProperty)
  })

  if (!match) {
    return { position: null, url: null, title: null }
  }

  return {
    position: match.position,
    url: match.link,
    title: match.title,
  }
}

export function computeNextCheckAt(frequency: string): Date {
  const intervalMs: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
  }
  return new Date(Date.now() + (intervalMs[frequency] ?? intervalMs["24h"]))
}
