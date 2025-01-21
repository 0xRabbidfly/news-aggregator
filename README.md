# AI-Powered News Aggregator

A modern web application that aggregates global news with AI-enhanced features, built with FastAPI and React.

### Tech Stack & Features
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Tailwind-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-green)
![AI](https://img.shields.io/badge/AI-NLP%20%7C%20Sentiment%20Analysis-purple)

## Features

### Core Functionality
- 📰 Real-time news aggregation from multiple sources
- 🔍 Category-based filtering (General, Business, Technology, etc.)
- 🔎 Full-text search capabilities
- 💾 Bookmark favorite articles (persisted in localStorage)
- 🌓 Dark/Light mode toggle

### View Modes
- 📑 **Card View**: Full-detail cards with images and complete information
- 📱 **Compact View**: Two-column grid with condensed article cards
- 📋 **List View**: Streamlined single-line items for quick scanning

### AI-Enhanced Features
- 🤖 **Smart Summaries**: AI-generated article summaries for quick comprehension
- 📊 **Sentiment Analysis**: Detects article tone (positive/negative/neutral) with polarity scores
- 🎯 **Content Classification**: Distinguishes between factual reporting and opinion/editorial pieces
- 📚 **Readability Scoring**: 
  - Flesch Reading Ease score calculation
  - Reading level categorization (easy/standard/advanced)
  - Average sentence length analysis
- ⚖️ **Bias Detection**:
  - Overall bias level assessment (low/medium/high)
  - Detection of emotional language
  - Identification of loaded words
  - Analysis of generalizations
- 💬 **Key Quotes**: Automatic extraction of important quotations
- 🏷️ **Smart Keywords**: Intelligent extraction of relevant topics and themes
- 📈 **Trending Topics**: Real-time analysis of popular themes across articles
- 📋 **Article Objectivity**: Measurement of content subjectivity and factual reporting

### User Experience
- 📱 Responsive design for all devices
- ⚡ Real-time updates
- 🎨 Modern, clean interface
- 🔄 Smooth transitions and animations
- 🏷️ Visual tags and indicators

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- NewsAPI key (get one at [https://newsapi.org](https://newsapi.org))

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd news-aggregator
\`\`\`

2. Set up the backend:
\`\`\`bash
cd backend
python -m venv venv
# On Windows:
.\\venv\\Scripts\\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
\`\`\`

3. Create a .env file in the backend directory:
\`\`\`env
NEWS_API_KEY=your_api_key_here
\`\`\`

4. Set up the frontend:
\`\`\`bash
cd ../frontend
npm install
\`\`\`

### Running the Application

You can run both the backend and frontend with a single command:
\`\`\`bash
# From the root directory:
.\\run.ps1  # On Windows
\`\`\`

Or run them separately:

Backend:
\`\`\`bash
cd backend
uvicorn app.main:app --reload
\`\`\`

Frontend:
\`\`\`bash
cd frontend
npm run dev
\`\`\`

The application will be available at:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## Usage

### View Modes
- **Card View**: Default view with full article details and images
- **Compact View**: Two-column grid layout for efficient space usage
- **List View**: Condensed list format for quick browsing
- Switch between views using the layout toggle in the top bar
- View preference is automatically saved

### Category Filtering
- Click on category buttons to filter news by topic
- Use the "All" category to view news from all categories
- Categories include: General, Business, Technology, Entertainment, Sports, Science, Health

### Search
- Use the search bar to find specific news articles
- Press Enter or click the search icon to execute the search
- Searches across titles and descriptions

### AI Features
- **Content Analysis**: Each article displays badges showing its content type (factual/opinion) and readability level
- **Bias Indicators**: 
  - Look for the bias badge showing low/medium/high bias levels
  - Expand to see detailed breakdown of bias factors
  - Higher scores indicate potential bias in the content
- **Smart Summaries**: 
  - AI-generated summaries appear below article titles
  - Provides key points in a concise format
  - Helps quick understanding of longer articles
- **Sentiment & Objectivity**:
  - Green badge indicates positive sentiment
  - Red badge indicates negative sentiment
  - Yellow badge indicates neutral sentiment
  - Objectivity score shows how factual vs subjective the content is
- **Key Quotes & Keywords**:
  - Important quotes are automatically extracted and highlighted
  - Relevant keywords are shown as hashtags
  - Click on trending topics to see related articles

### Bookmarks
- Click the bookmark icon to save articles
- Bookmarks persist across sessions
- Access bookmarked articles even when offline

### Dark Mode
- Toggle between light and dark themes
- Preference is saved automatically
- Optimized for both modes

## API Endpoints

- GET `/api/news` - Get news articles with optional category and search filters
- GET `/api/categories` - Get available news categories
- GET `/api/health` - Check API health status

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- News data provided by [NewsAPI](https://newsapi.org)
- NLP features powered by NLTK and TextBlob
- UI components from Tailwind CSS and Heroicons 