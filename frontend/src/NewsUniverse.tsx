import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { NewsItem } from './types'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface NewsUniverseProps {
  articles: NewsItem[]
  darkMode: boolean
  onArticleClick: (article: NewsItem) => void
  onClose: () => void
}

export function NewsUniverse({ articles, darkMode, onArticleClick, onClose }: NewsUniverseProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !articles.length) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove()

    // Setup dimensions using window size
    const width = window.innerWidth
    const height = window.innerHeight - 100 // Account for header

    // Create SVG and add a group for zooming
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('class', 'zoom-group')

    // Create force simulation with adjusted forces for better clustering
    const simulation = d3.forceSimulation()
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(-50)) // Reduced repulsion
      .force('collide', d3.forceCollide().radius(d => (d as any).radius + 5).strength(1)) // Less spacing, stronger collision
      // Add category-based clustering
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))

    // Process data
    const nodes = articles.map(article => ({
      ...article,
      radius: getRadius(article),
      color: getSentimentColor(article),
      group: article.category
    }))

    // Create group elements
    const bubbles = g.selectAll('.article')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'article')
      .attr('transform', d => `translate(${width/2},${height/2})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onArticleClick(d))

    // Add circles with hover effect
    bubbles.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', darkMode ? '#374151' : '#E5E7EB')
      .attr('stroke-width', 2)
      .attr('fill-opacity', 0.9)
      .style('transition', 'fill-opacity 0.2s')
      .on('mouseover', function() {
        d3.select(this)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 3)
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('fill-opacity', 0.9)
          .attr('stroke-width', 2)
      })

    // Add wrapped text labels
    bubbles.each(function(d: any) {
      const bubble = d3.select(this)
      const radius = d.radius
      const words = d.title.split(/\s+/)
      let line = []
      const lineHeight = 18 // Increased line height
      const maxLines = Math.floor(radius / lineHeight)
      const y = -((maxLines * lineHeight) / 2)

      const text = bubble.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', y)
        .attr('fill', darkMode ? '#F3F4F6' : '#1F2937')
        .style('font-size', '16px') // Increased font size
        .style('font-weight', '600') // Bolder text
        .style('pointer-events', 'none')

      let tspan = text.append('tspan')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '1.2em')

      let lineCount = 0
      for (let i = 0; i < words.length; i++) {
        line.push(words[i])
        tspan.text(line.join(' '))

        if (tspan.node()!.getComputedTextLength() > radius * 1.5) { // Adjusted width for better fit
          line.pop()
          if (line.length) {
            tspan.text(line.join(' '))
            lineCount++
          }
          if (lineCount >= maxLines - 1) {
            tspan.text(tspan.text() + '...')
            break
          }
          line = [words[i]]
          tspan = text.append('tspan')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(words[i])
        }
      }

      // Add source text below title
      text.append('tspan')
        .attr('x', 0)
        .attr('dy', '2em')
        .style('font-size', '14px') // Increased source text size
        .style('font-weight', '500') // Medium weight for source
        .style('fill', darkMode ? '#9CA3AF' : '#6B7280')
        .text(d.source)
    })

    // Update positions on simulation tick
    simulation.nodes(nodes as any).on('tick', () => {
      bubbles.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    // Initialize zoom and prevent default wheel behavior
    svg.call(zoom)
      .on('wheel.zoom', (event) => {
        event.preventDefault()
        const delta = event.deltaY
        const currentTransform = d3.zoomTransform(svg.node()!)
        const newScale = delta > 0 
          ? currentTransform.k * 0.95 
          : currentTransform.k * 1.05
        
        zoom.scaleTo(svg, Math.max(0.2, Math.min(4, newScale)))
      })

    // Set initial zoom transform
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.6) // Start more zoomed out
      .translate(-width / 2, -height / 2))

    // Handle window resize
    const handleResize = () => {
      svg
        .attr('width', window.innerWidth)
        .attr('height', window.innerHeight - 100)
      simulation
        .force('center', d3.forceCenter(window.innerWidth / 2, (window.innerHeight - 100) / 2))
        .restart()
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      simulation.stop()
      window.removeEventListener('resize', handleResize)
    }
  }, [articles, darkMode, onArticleClick])

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-800">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg"
        title="Return to classic view"
      >
        <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>

      <div className="absolute top-4 left-4 z-10 space-y-2 bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Bubble size: Article importance
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Color: Sentiment (Red = Negative, Yellow = Neutral, Green = Positive)
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Tip: Scroll to zoom, drag to pan
        </div>
      </div>
      <svg 
        ref={svgRef}
        style={{ width: '100vw', height: 'calc(100vh - 100px)' }}
      />
    </div>
  )
}

// Helper functions
function getRadius(article: NewsItem): number {
  // Base size on a combination of factors
  const base = 120 // Much larger base size
  const biasMultiplier = article.bias_analysis?.bias_score ? 1 - (article.bias_analysis.bias_score / 20) : 1
  const readabilityMultiplier = article.readability?.score ? article.readability.score / 100 : 1
  
  return base * biasMultiplier * readabilityMultiplier
}

function getSentimentColor(article: NewsItem): string {
  if (!article.sentiment) return '#6B7280' // Default gray
  
  const polarity = article.sentiment.polarity
  
  if (polarity > 0.3) return '#10B981' // Green
  if (polarity < -0.3) return '#EF4444' // Red
  return '#F59E0B' // Yellow/Orange
} 