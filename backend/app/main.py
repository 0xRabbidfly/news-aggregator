from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timedelta
import logging
import os
from dotenv import load_dotenv
import json
from textblob import TextBlob
import nltk
from nltk.tokenize import sent_tokenize
from collections import Counter

# Download required NLTK data
required_nltk_packages = [
    'punkt',
    'brown',
    'averaged_perceptron_tagger',
    'conll2000',
    'movie_reviews'
]

for package in required_nltk_packages:
    try:
        nltk.data.find(f'tokenizers/{package}')
    except LookupError:
        nltk.download(package)

# Initialize TextBlob's corpora
import subprocess
import sys
try:
    subprocess.check_call([sys.executable, '-m', 'textblob.download_corpora'])
except:
    logger.warning("Failed to download TextBlob corpora. Some features might not work properly.")

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="News Aggregator API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# You can get a free API key from https://newsapi.org/
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "YOUR_API_KEY_HERE")
NEWS_API_URL = "https://newsapi.org/v2/top-headlines"

# Available categories
CATEGORIES = [
    "general",
    "business",
    "technology",
    "entertainment",
    "sports",
    "science",
    "health"
]

class TopicCount(BaseModel):
    topic: str
    count: int

class NewsItem(BaseModel):
    title: str
    url: str
    source: str
    timestamp: str
    summary: str = ""
    category: str = "general"
    urlToImage: Optional[str] = None
    sentiment: Optional[Dict[str, float]] = None
    ai_summary: Optional[str] = None
    keywords: Optional[List[str]] = None
    content_type: Optional[str] = None
    readability: Optional[Dict[str, Any]] = None
    bias_analysis: Optional[Dict[str, Any]] = None
    key_quotes: Optional[List[str]] = None

class NewsResponse(BaseModel):
    articles: List[NewsItem]
    total: int
    category: str
    trending_topics: Optional[List[TopicCount]] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

def analyze_sentiment(text: str) -> Dict[str, float]:
    """Analyze sentiment of text using TextBlob."""
    try:
        analysis = TextBlob(text)
        return {
            "polarity": round(analysis.sentiment.polarity, 2),
            "subjectivity": round(analysis.sentiment.subjectivity, 2)
        }
    except Exception as e:
        logger.warning(f"Sentiment analysis failed: {str(e)}")
        return {
            "polarity": 0.0,
            "subjectivity": 0.5  # Neutral fallback values
        }

def analyze_content_type(text: str) -> str:
    """Classify content as opinion/editorial vs factual reporting."""
    try:
        # Use TextBlob's subjectivity as a proxy for content type
        analysis = TextBlob(text)
        if analysis.sentiment.subjectivity > 0.6:
            return "opinion/editorial"
        else:
            return "factual"
    except Exception as e:
        logger.warning(f"Content type analysis failed: {str(e)}")
        return "unknown"

def calculate_readability_score(text: str) -> Dict[str, Any]:
    """Calculate text readability metrics."""
    try:
        # Handle empty or very short text
        if not text or len(text.strip()) < 10:
            return {
                "score": 60.0,
                "reading_level": "standard",
                "avg_sentence_length": 20.0
            }

        sentences = sent_tokenize(text)
        if not sentences:  # If no sentences were found
            return {
                "score": 60.0,
                "reading_level": "standard",
                "avg_sentence_length": 20.0
            }

        words = [word for word in text.split() if word.strip()]  # Filter out empty strings
        if not words:  # If no words were found
            return {
                "score": 60.0,
                "reading_level": "standard",
                "avg_sentence_length": 20.0
            }

        # Calculate syllables more safely
        def count_syllables(word: str) -> int:
            try:
                return len(TextBlob(word).words[0].split('-'))
            except:
                return 1  # Fallback to 1 syllable if analysis fails

        syllable_count = sum(count_syllables(word) for word in words)
        
        # Calculate metrics
        words_per_sentence = len(words) / len(sentences)
        syllables_per_word = syllable_count / len(words)
        flesch_score = 206.835 - 1.015 * words_per_sentence - 84.6 * syllables_per_word
        
        # Ensure score is within reasonable bounds
        flesch_score = max(0, min(100, flesch_score))
        
        reading_level = "advanced"
        if flesch_score > 80:
            reading_level = "easy"
        elif flesch_score > 60:
            reading_level = "standard"
            
        return {
            "score": round(flesch_score, 1),
            "reading_level": reading_level,
            "avg_sentence_length": round(words_per_sentence, 1)
        }
    except Exception as e:
        logger.warning(f"Readability analysis failed: {str(e)}")
        return {
            "score": 60.0,
            "reading_level": "standard",
            "avg_sentence_length": 20.0
        }

def detect_bias(text: str) -> Dict[str, Any]:
    """Detect potential bias in the article."""
    try:
        analysis = TextBlob(text)
        words = text.lower().split()
        
        # Look for bias indicators
        bias_indicators = {
            'emotional': ['must', 'never', 'always', 'clearly', 'obviously'],
            'loaded_words': ['radical', 'extremist', 'fanatic', 'fundamental'],
            'generalizations': ['all', 'every', 'none', 'never', 'always']
        }
        
        bias_scores = {
            category: sum(1 for word in words if word in indicators) 
            for category, indicators in bias_indicators.items()
        }
        
        # Calculate overall bias score
        total_bias = sum(bias_scores.values()) + analysis.sentiment.subjectivity * 5
        bias_level = "low"
        if total_bias > 10:
            bias_level = "high"
        elif total_bias > 5:
            bias_level = "medium"
            
        return {
            "bias_level": bias_level,
            "bias_score": round(total_bias, 1),
            "bias_factors": bias_scores
        }
    except Exception as e:
        logger.warning(f"Bias detection failed: {str(e)}")
        return {
            "bias_level": "unknown",
            "bias_score": 0.0,
            "bias_factors": {}
        }

def extract_key_quotes(text: str, max_quotes: int = 2) -> List[str]:
    """Extract important quotes from the article."""
    try:
        sentences = sent_tokenize(text)
        quotes = []
        
        for sentence in sentences:
            # Look for quotation marks
            if ('"' in sentence or '"' in sentence or '"' in sentence) and len(quotes) < max_quotes:
                # Clean up the quote
                quote = sentence.strip()
                quotes.append(quote)
                
        return quotes
    except Exception as e:
        logger.warning(f"Quote extraction failed: {str(e)}")
        return []

def extract_keywords(text: str, n: int = 5) -> List[str]:
    """Extract key phrases from text."""
    try:
        # Try TextBlob's noun phrase extraction first
        words = TextBlob(text).noun_phrases
        if words:
            return [word for word, _ in Counter(words).most_common(n)]
    except Exception as e:
        logger.warning(f"TextBlob noun phrase extraction failed: {str(e)}")
    
    # Fallback to simple word frequency
    # Remove common English stop words
    stop_words = {
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
        'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
        'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
        'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
        'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
        'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
        'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
        'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
        'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
        'give', 'day', 'most', 'us'
    }
    
    # Split text into words, convert to lowercase, and remove stop words
    words = [
        word.lower() for word in text.split()
        if word.lower() not in stop_words
        and len(word) > 3  # Skip very short words
        and word.isalnum()  # Only keep alphanumeric words
    ]
    
    # Count word frequencies and return top N
    return [word for word, _ in Counter(words).most_common(n)]

def generate_ai_summary(text: str, max_sentences: int = 3) -> str:
    """Generate a concise summary using basic NLP."""
    try:
        # Split text into sentences
        sentences = sent_tokenize(text)
        
        if len(sentences) <= max_sentences:
            return text
            
        # Score sentences based on position and length
        scored_sentences = []
        for i, sentence in enumerate(sentences):
            score = 0
            # Favor earlier sentences
            score += 1.0 / (i + 1)
            # Favor medium-length sentences
            length = len(sentence.split())
            if 10 <= length <= 25:
                score += 0.3
            
            scored_sentences.append((score, sentence))
            
        # Select top sentences while maintaining order
        selected = sorted(sorted(scored_sentences, key=lambda x: x[0], reverse=True)[:max_sentences],
                        key=lambda x: sentences.index(x[1]))
        
        return " ".join(sentence for _, sentence in selected)
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        return text

async def fetch_news(category: str = "general", search: Optional[str] = None, page: int = 1) -> NewsResponse:
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            logger.info(f"Starting news fetching for category: {category}")
            params = {
                "apiKey": NEWS_API_KEY,
                "language": "en",
                "pageSize": 50,
                "page": page,
                "category": category if category != "all" else None,
                "q": search
            }
            
            # Remove None values from params
            params = {k: v for k, v in params.items() if v is not None}
            
            response = await client.get(NEWS_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Got response from NewsAPI: {len(data.get('articles', []))} articles")
            
            # Collect all text for trending topics analysis
            all_text = ""
            news_items = []
            
            for article in data.get("articles", []):
                try:
                    # Skip articles with missing required fields
                    if not article.get("title") or not article.get("url"):
                        logger.warning("Skipping article with missing required fields")
                        continue

                    # Safely get text for analysis
                    title = article.get("title", "").strip()
                    description = article.get("description", "").strip()
                    full_text = f"{title} {description}".strip()
                    
                    # Skip articles with insufficient text
                    if len(full_text) < 10:
                        logger.warning("Skipping article with insufficient text")
                        continue

                    all_text += f" {full_text}"
                    
                    # Analyze sentiment and generate AI summary with proper fallbacks
                    sentiment = analyze_sentiment(full_text)
                    ai_summary = generate_ai_summary(description or title)
                    keywords = extract_keywords(full_text)
                    
                    # New AI analysis features with proper error handling
                    content_type = analyze_content_type(full_text)
                    readability = calculate_readability_score(full_text)
                    bias_analysis = detect_bias(full_text)
                    key_quotes = extract_key_quotes(description or title)
                    
                    # Create news item with proper defaults
                    news_items.append(
                        NewsItem(
                            title=title,
                            url=article["url"],
                            source=article.get("source", {}).get("name", "Unknown Source"),
                            timestamp=article.get("publishedAt", datetime.now().isoformat()),
                            summary=description or "",
                            category=category,
                            urlToImage=article.get("urlToImage"),
                            sentiment=sentiment,
                            ai_summary=ai_summary,
                            keywords=keywords,
                            content_type=content_type,
                            readability=readability,
                            bias_analysis=bias_analysis,
                            key_quotes=key_quotes
                        )
                    )
                    logger.info(f"Added article: {title}")
                except Exception as e:
                    logger.error(f"Error processing article: {str(e)}")
                    continue
            
            # Handle case where no articles were successfully processed
            if not news_items:
                logger.warning("No articles were successfully processed")
                return NewsResponse(
                    articles=[],
                    total=0,
                    category=category,
                    trending_topics=[]
                )

            # Analyze trending topics
            trending_topics = extract_keywords(all_text, n=10)
            trending_with_count = [
                TopicCount(topic=topic, count=all_text.lower().count(topic.lower()))
                for topic in trending_topics
            ]
            
            return NewsResponse(
                articles=news_items,
                total=data.get("totalResults", len(news_items)),
                category=category,
                trending_topics=trending_with_count
            )
            
        except Exception as e:
            logger.error(f"Error fetching news: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news", response_model=NewsResponse)
async def get_news(
    category: str = Query("general", enum=CATEGORIES + ["all"]),
    search: Optional[str] = None,
    page: int = Query(1, ge=1)
):
    """
    Fetch news items with optional category and search filters
    """
    return await fetch_news(category, search, page)

@app.get("/api/categories")
async def get_categories():
    """
    Get available news categories
    """
    return {"categories": CATEGORIES}

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 