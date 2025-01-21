from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
from typing import List
from pydantic import BaseModel
import httpx
import asyncio

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewsItem(BaseModel):
    title: str
    url: str
    source: str
    summary: str = ""

@app.get("/")
async def root():
    return {"message": "News Aggregator API"}

@app.get("/news", response_model=List[NewsItem])
async def get_news():
    try:
        # Using Reuters as an example source
        url = "https://www.reuters.com/world/"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            news_items = []
            articles = soup.find_all('article', limit=10)
            
            for article in articles:
                headline = article.find('h3')
                if headline and headline.text.strip():
                    link = article.find('a')
                    url = f"https://www.reuters.com{link['href']}" if link else ""
                    summary = article.find('p')
                    summary_text = summary.text.strip() if summary else ""
                    
                    news_items.append(NewsItem(
                        title=headline.text.strip(),
                        url=url,
                        source="Reuters",
                        summary=summary_text
                    ))
            
            return news_items[:10]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 