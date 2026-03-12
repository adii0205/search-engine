import React, { useState, useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import SearchBox from './components/SearchBox'
import ResultsPanel from './components/ResultsPanel'
import LoadingSpinner from './components/LoadingSpinner'
import './styles/popup.css'

const PopupApp: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    chrome.storage.local.get(['authToken'], (result) => {
      setIsLoggedIn(!!result.authToken)
    })
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setQuery(searchQuery)
    setLoading(true)
    setError(null)

    try {
      // Call backend API for AI search
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const getAuthToken = async (): Promise<string> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['authToken'], (result) => {
        resolve(result.authToken || '')
      })
    })
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1 className="logo">Nexus ✨</h1>
        <button className="settings-btn" title="Settings">⚙️</button>
      </header>

      {!isLoggedIn && (
        <div className="auth-banner">
          <p>Sign in to save searches and unlock Pro features</p>
          <button className="btn-primary">Sign In</button>
        </div>
      )}

      <SearchBox onSearch={handleSearch} placeholder="Ask anything..." />

      {loading && <LoadingSpinner />}

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {results && <ResultsPanel results={results} />}

      {!results && !loading && (
        <div className="empty-state">
          <p>Try searching for:</p>
          <ul>
            <li>Product comparisons</li>
            <li>How-to guides</li>
            <li>Current events</li>
            <li>Technical tutorials</li>
          </ul>
        </div>
      )}
    </div>
  )
}

// Mount React app
const root = createRoot(document.getElementById('root')!)
root.render(<PopupApp />)
