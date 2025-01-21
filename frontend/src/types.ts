export interface NewsItem {
  title: string
  url: string
  source: string
  timestamp: string
  summary: string
  category: string
  urlToImage?: string
  sentiment?: {
    polarity: number
    subjectivity: number
  }
  ai_summary?: string
  keywords?: string[]
  content_type?: string
  readability?: {
    score: number
    reading_level: string
    avg_sentence_length: number
  }
  bias_analysis?: {
    bias_level: string
    bias_score: number
    bias_factors: {
      emotional: number
      loaded_words: number
      generalizations: number
    }
  }
  key_quotes?: string[]
}

export interface NewsResponse {
  articles: NewsItem[]
  total: number
  category: string
  trending_topics?: Array<{
    topic: string
    count: number
  }>
} 