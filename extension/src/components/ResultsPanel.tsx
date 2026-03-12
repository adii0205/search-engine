import React from 'react'

interface Result {
  answer: string
  sources: {
    title: string
    url: string
    excerpt: string
  }[]
  searchQuery: string
  processingTime: number
}

interface ResultsPanelProps {
  results: Result
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results }) => {
  return (
    <div className="results-panel">
      <div className="answer-section">
        <h2>Answer</h2>
        <p className="answer-text">{results.answer}</p>
        <p className="processing-time">⏱️ Processed in {results.processingTime}ms</p>
      </div>

      <div className="sources-section">
        <h3>Sources</h3>
        <div className="sources-list">
          {results.sources.map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-card"
            >
              <h4>{source.title}</h4>
              <p className="url">{new URL(source.url).hostname}</p>
              <p className="excerpt">{source.excerpt}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="feedback-section">
        <button className="feedback-btn">👍 Helpful</button>
        <button className="feedback-btn">👎 Not helpful</button>
      </div>
    </div>
  )
}

export default ResultsPanel
