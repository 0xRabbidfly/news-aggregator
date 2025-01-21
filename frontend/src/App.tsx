import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  ArrowPathIcon, 
  BookmarkIcon, 
  MoonIcon, 
  SunIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  BeakerIcon,
  HashtagIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'

interface NewsItem {
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

interface NewsResponse {
  articles: NewsItem[]
  total: number
  category: string
  trending_topics?: Array<{
    topic: string
    count: number
  }>
}

function SentimentBadge({ sentiment }: { sentiment: NewsItem['sentiment'] }) {
  if (!sentiment) return null

  const getSentimentColor = (polarity: number) => {
    if (polarity > 0.3) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (polarity < -0.3) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }

  const getSentimentText = (polarity: number) => {
    if (polarity > 0.3) return 'Positive'
    if (polarity < -0.3) return 'Negative'
    return 'Neutral'
  }

  return (
    <div className="flex items-center space-x-2">
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(sentiment.polarity)}`}
        title={`Sentiment score: ${sentiment.polarity} (ranges from -1 to 1)`}
      >
        <ChartBarIcon className="h-3 w-3 mr-1" />
        {getSentimentText(sentiment.polarity)}
      </span>
      <span 
        className="text-xs text-gray-500 dark:text-gray-400"
        title="Objectivity score indicates how factual vs opinionated the content is"
      >
        Objectivity: {Math.round((1 - sentiment.subjectivity) * 100)}%
      </span>
    </div>
  )
}

function TrendingTopics({ topics }: { topics?: NewsResponse['trending_topics'] }) {
  if (!topics?.length) return null

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
        <HashtagIcon className="h-5 w-5 mr-2 text-indigo-500" />
        Trending Topics
      </h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
          >
            {topic.topic}
            <span className="ml-2 text-xs bg-indigo-200 dark:bg-indigo-800 px-2 py-0.5 rounded-full">
              {topic.count}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

type ViewMode = 'card' | 'compact' | 'list';

function ViewSwitcher({ currentView, onViewChange }: { currentView: ViewMode; onViewChange: (view: ViewMode) => void }) {
  return (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onViewChange('card')}
        className={`p-2 rounded ${currentView === 'card' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        title="Card View"
      >
        <ViewColumnsIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <button
        onClick={() => onViewChange('compact')}
        className={`p-2 rounded ${currentView === 'compact' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        title="Compact View"
      >
        <Squares2X2Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded ${currentView === 'list' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        title="List View"
      >
        <ListBulletIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  )
}

function CompactNewsCard({ item, darkMode, isBookmarked, onBookmark }: { 
  item: NewsItem; 
  darkMode: boolean; 
  isBookmarked: boolean;
  onBookmark: () => void;
}) {
  return (
    <div className={`${
      darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
    } p-4 rounded-lg shadow-sm transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-base font-medium ${
              darkMode ? 'text-white hover:text-indigo-400' : 'text-gray-900 hover:text-indigo-600'
            }`}
          >
            {item.title}
          </a>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {item.source}
            </span>
            {item.sentiment && (
              <SentimentBadge sentiment={item.sentiment} />
            )}
          </div>
        </div>
        <button
          onClick={onBookmark}
          className="ml-4 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400"
        >
          {isBookmarked ? (
            <BookmarkSolidIcon className="h-5 w-5 text-yellow-500" />
          ) : (
            <BookmarkIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}

function ListNewsItem({ item, darkMode, isBookmarked, onBookmark }: {
  item: NewsItem;
  darkMode: boolean;
  isBookmarked: boolean;
  onBookmark: () => void;
}) {
  return (
    <div className={`${
      darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
    } p-3 rounded-lg shadow-sm transition-all duration-300 flex items-center`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {item.source}
          </span>
          {item.sentiment && (
            <SentimentBadge sentiment={item.sentiment} />
          )}
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {new Date(item.timestamp).toLocaleString()}
          </span>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-base font-medium truncate block ${
            darkMode ? 'text-white hover:text-indigo-400' : 'text-gray-900 hover:text-indigo-600'
          }`}
        >
          {item.title}
        </a>
      </div>
      <button
        onClick={onBookmark}
        className="ml-4 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 flex-shrink-0"
      >
        {isBookmarked ? (
          <BookmarkSolidIcon className="h-5 w-5 text-yellow-500" />
        ) : (
          <BookmarkIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}

function ContentTypeBadge({ type }: { type?: string }) {
  if (!type) return null;

  const getTypeColor = () => {
    switch (type) {
      case 'opinion/editorial':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'factual':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeDescription = () => {
    switch (type) {
      case 'opinion/editorial':
        return 'This article appears to be an opinion piece or editorial content'
      case 'factual':
        return 'This article appears to be primarily factual reporting'
      default:
        return 'Content type could not be determined'
    }
  }

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor()}`}
      title={getTypeDescription()}
    >
      <BeakerIcon className="h-3 w-3 mr-1" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  )
}

function ReadabilityBadge({ readability }: { readability?: NewsItem['readability'] }) {
  if (!readability) return null;

  const getLevelColor = () => {
    switch (readability.reading_level) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'standard':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getReadabilityDescription = () => {
    return `Flesch Reading Ease Score: ${readability.score}
Average sentence length: ${readability.avg_sentence_length} words
Higher scores indicate easier reading`
  }

  return (
    <div className="flex items-center space-x-2">
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor()}`}
        title={getReadabilityDescription()}
      >
        <ChartBarIcon className="h-3 w-3 mr-1" />
        {readability.reading_level.charAt(0).toUpperCase() + readability.reading_level.slice(1)}
      </span>
      <span 
        className="text-xs text-gray-500 dark:text-gray-400"
        title="Flesch Reading Ease Score (0-100)"
      >
        Score: {readability.score}
      </span>
    </div>
  )
}

function BiasAnalysis({ bias }: { bias?: NewsItem['bias_analysis'] }) {
  if (!bias) return null;

  const getBiasColor = () => {
    switch (bias.bias_level) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getBiasDescription = () => {
    return `Overall bias score: ${bias.bias_score}
Analyzed for emotional language, loaded words, and generalizations
Lower scores indicate more neutral language`
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center space-x-2">
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBiasColor()}`}
          title={getBiasDescription()}
        >
          <ChartBarIcon className="h-3 w-3 mr-1" />
          Bias: {bias.bias_level.charAt(0).toUpperCase() + bias.bias_level.slice(1)}
        </span>
        <span 
          className="text-xs text-gray-500 dark:text-gray-400"
          title="Bias score (higher numbers indicate stronger bias)"
        >
          Score: {bias.bias_score}
        </span>
      </div>
      {Object.entries(bias.bias_factors).map(([factor, score]) => (
        score > 0 && (
          <div 
            key={factor} 
            className="text-xs text-gray-500 dark:text-gray-400"
            title={`Number of ${factor.replace('_', ' ')} instances detected in the text`}
          >
            {factor.replace('_', ' ').charAt(0).toUpperCase() + factor.slice(1)}: {score}
          </div>
        )
      ))}
    </div>
  )
}

function KeyQuotes({ quotes }: { quotes?: string[] }) {
  if (!quotes?.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <div 
        className="flex items-center text-sm text-gray-500 dark:text-gray-400"
        title="Important quotes automatically extracted from the article"
      >
        <HashtagIcon className="h-4 w-4 mr-1" />
        Key Quotes
      </div>
      {quotes.map((quote, idx) => (
        <blockquote 
          key={idx} 
          className="text-sm italic border-l-4 border-gray-300 dark:border-gray-600 pl-3 text-gray-600 dark:text-gray-300"
          title="Direct quote from the article"
        >
          {quote}
        </blockquote>
      ))}
    </div>
  )
}

function App() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [bookmarks, setBookmarks] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('bookmarks')
    return saved ? JSON.parse(saved) : []
  })
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('viewMode')
    return (saved as ViewMode) || 'card'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Add debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        setCurrentPage(1) // Reset to first page on new search
        setNews([]) // Clear existing results
        fetchNews()
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode)
  }, [viewMode])

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await axios.get('http://localhost:8000/api/categories');
      console.log('Categories received:', response.data);
      setCategories(['all', ...response.data.categories]);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      // Set default categories as fallback
      setCategories(['all', 'general', 'business', 'technology', 'entertainment', 'sports', 'science', 'health']);
    }
  }

  const fetchNews = async (loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const response = await axios.get<NewsResponse>('http://localhost:8000/api/news', {
        params: {
          category: selectedCategory,
          search: searchQuery || undefined,
          page: loadMore ? currentPage + 1 : 1
        }
      })
      
      if (loadMore) {
        setNews(prev => [...prev, ...response.data.articles])
        setCurrentPage(prev => prev + 1)
      } else {
        setNews(response.data.articles)
        setCurrentPage(1)
      }
      
      // Check if there are more results
      setHasMore(response.data.articles.length === 50)
    } catch (err) {
      setError('Failed to fetch news. Please try again later.')
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when category changes
    setNews([]) // Clear existing results
    console.log('Selected category changed:', selectedCategory);
    fetchNews()
  }, [selectedCategory])

  const toggleBookmark = (item: NewsItem) => {
    setBookmarks(prev => {
      const isBookmarked = prev.some(bookmark => bookmark.url === item.url)
      if (isBookmarked) {
        return prev.filter(bookmark => bookmark.url !== item.url)
      } else {
        return [...prev, item]
      }
    })
  }

  const isBookmarked = (url: string) => bookmarks.some(bookmark => bookmark.url === url)

  const handleLoadMore = () => {
    fetchNews(true)
  }

  const handleRefresh = () => {
    fetchNews()
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Global News
            </h1>
            <div className="flex items-center space-x-4">
              <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
              <button
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  showBookmarksOnly ? 'bg-yellow-100 dark:bg-yellow-900' : ''
                }`}
                title={showBookmarksOnly ? 'Show all articles' : 'Show bookmarks only'}
              >
                {showBookmarksOnly ? (
                  <BookmarkSolidIcon className="h-6 w-6 text-yellow-500" />
                ) : (
                  <BookmarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchNews()}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                />
                <MagnifyingGlassIcon 
                  className="h-5 w-5 absolute right-3 top-2.5 text-gray-400 cursor-pointer"
                />
              </div>
            </div>
            
            {/* Category Filters */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Trending Topics */}
          <TrendingTopics topics={news.length > 0 ? (news as any).trending_topics : undefined} />

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900 p-4 mb-6">
              <div className="text-sm text-red-700 dark:text-red-200">{error}</div>
            </div>
          )}

          {/* News Items */}
          <div className={`space-y-4 ${viewMode === 'compact' ? 'sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0' : ''}`}>
            {loading && !isLoadingMore ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                <div className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading news...</div>
              </div>
            ) : (
              <>
                {(showBookmarksOnly ? bookmarks : news).map((item, index) => {
                  if (viewMode === 'compact') {
                    return (
                      <CompactNewsCard
                        key={index}
                        item={item}
                        darkMode={darkMode}
                        isBookmarked={isBookmarked(item.url)}
                        onBookmark={() => toggleBookmark(item)}
                      />
                    )
                  } else if (viewMode === 'list') {
                    return (
                      <ListNewsItem
                        key={index}
                        item={item}
                        darkMode={darkMode}
                        isBookmarked={isBookmarked(item.url)}
                        onBookmark={() => toggleBookmark(item)}
                      />
                    )
                  } else {
                    return (
                      <div
                        key={index}
                        className={`${
                          darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                        } overflow-hidden shadow rounded-lg transition-all duration-300`}
                      >
                        <div className="px-4 py-5 sm:p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {item.source}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {item.category}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => toggleBookmark(item)}
                                className="text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400"
                              >
                                {isBookmarked(item.url) ? (
                                  <BookmarkSolidIcon className="h-5 w-5 text-yellow-500" />
                                ) : (
                                  <BookmarkIcon className="h-5 w-5" />
                                )}
                              </button>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(item.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Sentiment Analysis */}
                          {item.sentiment && (
                            <div className="mt-2">
                              <SentimentBadge sentiment={item.sentiment} />
                            </div>
                          )}

                          {item.urlToImage && (
                            <img
                              src={item.urlToImage}
                              alt={item.title}
                              className="mt-4 w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          )}

                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block"
                          >
                            <h3 className={`text-xl font-semibold ${
                              darkMode ? 'text-white hover:text-indigo-400' : 'text-gray-900 hover:text-indigo-600'
                            }`}>
                              {item.title}
                            </h3>
                          </a>

                          {/* Add new AI analysis components in the card view */}
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center space-x-2">
                              <ContentTypeBadge type={item.content_type} />
                              <ReadabilityBadge readability={item.readability} />
                            </div>
                            <BiasAnalysis bias={item.bias_analysis} />
                          </div>

                          {/* AI Summary */}
                          {item.ai_summary && (
                            <div className="mt-2 space-y-2">
                              <div 
                                className="flex items-center text-sm text-gray-500 dark:text-gray-400"
                                title="AI-generated summary of the key points in the article"
                              >
                                <BeakerIcon className="h-4 w-4 mr-1" />
                                AI Summary
                              </div>
                              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                                {item.ai_summary}
                              </p>
                            </div>
                          )}

                          {/* Key Quotes */}
                          <KeyQuotes quotes={item.key_quotes} />

                          {/* Keywords */}
                          {item.keywords && item.keywords.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.keywords.map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                  title="Key topic or theme identified in the article"
                                >
                                  #{keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                })}
                
                {!showBookmarksOnly && hasMore && (
                  <div className="text-center py-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Loading more...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
