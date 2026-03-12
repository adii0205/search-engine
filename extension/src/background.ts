/**
 * Service Worker (Background Script)
 * Handles:
 * - Message routing
 * - Search API calls
 * - User authentication state
 * - Cache management
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000'

// Listen for messages from popup/sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SEARCH') {
    performSearch(request.query, request.userId)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }))
    return true // Keep channel open for async response
  }

  if (request.type === 'GET_AUTH_STATUS') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ isAuthenticated: !!result.authToken })
    })
    return true
  }
})

async function performSearch(query: string, userId?: string) {
  const authToken = await getAuthToken()

  const response = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    },
    body: JSON.stringify({
      query,
      userId,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`)
  }

  return response.json()
}

async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null)
    })
  })
}

// Listen for extension install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Open onboarding page
    chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/onboarding.html' })

    // Initialize user preferences
    chrome.storage.local.set({
      preferences: {
        theme: 'dark',
        searchLimit: 50, // Free tier
        autoSummary: true,
      },
    })
  }
})

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-sidebar') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_SIDEBAR' })
      }
    })
  }

  if (command === 'voice-search') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'START_VOICE_SEARCH' })
      }
    })
  }
})
