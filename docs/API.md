# Nexus API Reference

## Base URL

```
https://api.nexus.app/api
# Development:
http://localhost:3000/api
```

## Authentication

All endpoints (except `/auth/*`) require a Bearer token:

```
Authorization: Bearer <JWT_TOKEN>
```

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

---

## Search Endpoints

### POST `/search`

Execute an AI-powered search query.

**Request:**
```json
{
  "query": "best noise cancelling headphones under $200",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "answer": "The Sony WH-1000XM5 are...",
  "sources": [
    {
      "title": "Sony WH-1000XM5 Review",
      "url": "https://example.com/...",
      "excerpt": "The Sony WH-1000XM5 are..."
    }
  ],
  "searchQuery": "best noise cancelling headphones under $200",
  "processingTime": 1234,
  "cached": false
}
```

**Status Codes:**
- `200 OK` — Search successful
- `400 Bad Request` — Invalid query
- `429 Too Many Requests` — Rate limited
- `500 Internal Server Error` — Search failed

---

### POST `/search/deep`

Trigger a deep research job (Pro tier only).

**Request:**
```json
{
  "query": "latest advances in quantum computing 2025",
  "maxDepth": 5
}
```

**Response:**
```json
{
  "jobId": "research-1234567890",
  "statusUrl": "/api/search/jobs/research-1234567890"
}
```

---

## User Endpoints

### GET `/users/me`

Get current user profile.

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "tier": "pro",
  "createdAt": "2025-03-12T00:00:00Z",
  "preferences": {
    "theme": "dark",
    "searchLimit": 10000,
    "autoSummary": true
  }
}
```

### PATCH `/users/me`

Update user preferences.

**Request:**
```json
{
  "preferences": {
    "theme": "light",
    "autoSummary": false
  }
}
```

### GET `/users/me/history`

Get search history (limited to last 100).

**Response:**
```json
[
  {
    "query": "best noise cancelling headphones",
    "timestamp": "2025-03-12T10:30:00Z",
    "resultCount": 5
  }
]
```

### GET `/users/me/usage`

Get current usage stats.

**Response:**
```json
{
  "searches": 45,
  "limit": 50,
  "daysRemaining": 15,
  "resetDate": "2025-03-27T00:00:00Z"
}
```

---

## Auth Endpoints

### POST `/auth/signup`

Create a new account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "tier": "free"
  },
  "token": "eyJhbGc..."
}
```

### POST `/auth/signin`

Sign in with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### POST `/auth/oauth/google`

OAuth sign-in with Google.

**Request:**
```json
{
  "code": "auth-code-from-google"
}
```

---

## Ad Endpoints

### GET `/ads/marketplace`

Get available ad campaigns.

**Response:**
```json
[
  {
    "id": "campaign-123",
    "name": "Premium Headphones Sale",
    "advertiser": "Sony",
    "categories": ["electronics", "audio"],
    "impressionRate": 0.05
  }
]
```

### POST `/ads/impressions`

Log an ad impression (called by extension).

**Request:**
```json
{
  "campaignId": "campaign-123",
  "userSegment": "tech-enthusiast-high-income"
}
```

### GET `/ads/preferences`

Get user ad preferences.

**Response:**
```json
{
  "enabled": true,
  "categories": ["electronics", "technology"],
  "excludedAdvertisers": []
}
```

### PATCH `/ads/preferences`

Update ad preferences.

**Request:**
```json
{
  "enabled": true,
  "categories": ["food", "travel"]
}
```

---

## Rate Limits

| Tier | Limit | Window |
|------|-------|--------|
| Free | 50 requests | 24 hours |
| Pro | 10,000 requests | 24 hours |
| Team | Unlimited | — |
| Enterprise | Unlimited | — |

Response includes rate limit headers:
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

---

## Pagination

List endpoints support pagination:

```
GET /api/search/history?page=1&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNextPage": true
  }
}
```

---

## Webhooks

Subscribe to events (webhook setup in dashboard):

```
POST https://your-domain.com/webhooks/nexus
X-Signature: sha256=...

{
  "event": "subscription.upgraded",
  "data": {
    "userId": "user-123",
    "oldTier": "free",
    "newTier": "pro"
  }
}
```

Events:
- `subscription.upgraded`
- `subscription.downgraded`
- `subscription.cancelled`
- `ad_campaign.created`
- `ad_campaign.ended`
