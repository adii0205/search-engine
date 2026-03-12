import React, { useState, useRef } from 'react'

interface SearchBoxProps {
  onSearch: (query: string) => void
  placeholder?: string
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, placeholder = 'Search...' }) => {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSearch(input)
    }
  }

  const handleClear = () => {
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="search-box">
      <div className="input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          autoFocus
        />
        {input && (
          <button type="button" onClick={handleClear} className="clear-btn">
            ✕
          </button>
        )}
      </div>
      <button type="submit" className="search-btn" disabled={!input.trim()}>
        Search
      </button>
    </form>
  )
}

export default SearchBox
