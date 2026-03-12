import React from 'react'

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="spinner">
        <div className="spinner-dot"></div>
      </div>
      <p>Searching the web with AI...</p>
    </div>
  )
}

export default LoadingSpinner
