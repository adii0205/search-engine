# Getting Started with Nexus

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd nexus
yarn install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys:
# - ANTHROPIC_API_KEY (Claude)
# - BING_SEARCH_API_KEY
# - STRIPE_SECRET_KEY
# - DATABASE_URL
```

### 3. Start Services

```bash
# Start Docker services (PostgreSQL, Redis, Qdrant)
docker-compose up -d

# Verify services are running
docker ps
```

### 4. Run Backend

```bash
yarn workspace @nexus/backend dev
# Server starts at http://localhost:3000
```

### 5. Run Extension

```bash
# In another terminal
yarn workspace @nexus/extension dev
```

**Load extension in Chrome:**
1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `nexus/extension/dist` folder
5. Test by opening new tab or clicking extension icon

---

## Architecture Overview

```
Browser Extension          Backend API              Services
┌──────────────┐         ┌──────────────┐        ┌─────────┐
│  React UI    │         │   Fastify    │        │ Claude  │
│  - Search    │ ←→      │   Router     │        └─────────┘
│  - Sidebar   │         │   - Auth     │        ┌─────────┐
│  - Settings  │         │   - Search   │        │  Groq   │
└──────────────┘         │   - Ads      │        └─────────┘
       ↓                 └──────────────┘        ┌─────────┐
  localStorage                ↓                  │ Qdrant  │
  (user prefs)          PostgreSQL ("users,     │ (RAG)   │
                        searches, ads")         └─────────┘
                              ↓
                          ┌─────────┐
                          │  Redis  │
                          │ (cache) │
                          └─────────┘
```

---

## Directory Structure

```
nexus/
├── extension/          # Chrome Extension
│   ├── src/
│   │   ├── popup.tsx          # Main search UI
│   │   ├── sidebar.tsx        # Page intelligence
│   │   ├── background.ts      # Service worker
│   │   ├── components/        # Reusable React components
│   │   └── styles/            # CSS
│   ├── manifest.json          # Extension manifest
│   └── package.json
│
├── backend/            # API Server
│   ├── src/
│   │   ├── server.ts          # Fastify app
│   │   ├── routes/            # API endpoints
│   │   │   ├── search.ts
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   └── ads.ts
│   │   ├── services/          # Business logic
│   │   │   ├── llm.ts         # Claude integration
│   │   │   ├── rag.ts         # RAG pipeline
│   │   │   └── search.ts      # Search federation
│   │   ├── db/                # Database
│   │   └── middleware/        # Auth, logging, etc
│   ├── package.json
│   └── tsconfig.json
│
├── browser/            # Tauri Browser (Phase 2)
│   ├── src/            # React UI
│   ├── src-tauri/      # Rust backend
│   └── tauri.conf.json
│
├── docs/               # Documentation
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── docker-compose.yml  # Services (PostgreSQL, Redis, Qdrant)
├── .env.example        # Environment template
└── README.md
```

---

## Common Tasks

### Run Tests

```bash
yarn workspace @nexus/backend test
yarn workspace @nexus/extension test
```

### Check Types

```bash
yarn workspace @nexus/backend type-check
yarn workspace @nexus/extension type-check
```

### Database Migrations

```bash
# Create a new migration
yarn workspace @nexus/backend db:migrate

# Reset database
docker-compose down -v
docker-compose up -d
```

### View Logs

```bash
# Backend logs
docker logs -f nexus_postgres
docker logs -f nexus_redis

# Check API health
curl http://localhost:3000/health
```

### Debug Extension

1. Right-click extension → "Inspect popup"
2. Open DevTools → "Service Worker" link
3. Use Console to debug

---

## File Editing Checklist

Before deploying:

- [ ] `.env` has all required API keys
- [ ] PostgreSQL is migrated
- [ ] Qdrant collection created
- [ ] Extension manifest is valid
- [ ] Backend types check (`tsc --noEmit`)
- [ ] No hardcoded secrets in code

---

## Deployment Targets

**Phase 1 (MVP):**
- Extension: Chrome Web Store (free)
- Backend: Railway or Render (auto-scaling)
- Database: Managed PostgreSQL (Neon, Railway, etc)
- Cache: Redis Labs (upstash)
- Vectors: Qdrant Cloud

**Phase 2:**
- Browser: GitHub Releases + auto-updater
- Mobile: App Store + Google Play (Capacitor)
- Self-hosted option: Docker Compose

---

## Next Steps

1. **Set environment variables** in `.env`
2. **Start services** with `docker-compose up -d`
3. **Run backend** with `yarn workspace @nexus/backend dev`
4. **Load extension** in Chrome for testing
5. **Test a search** — "best noise cancelling headphones"
6. **Check API response** and refine RAG pipeline
7. **Deploy to staging** (Railway/Render)
8. **Launch on Product Hunt** 🚀

---

## Troubleshooting

**Extension doesn't load:**
- Check manifest.json syntax
- Clear Chrome cache: Settings → Clear browsing data
- Reload extension (Ctrl+R)

**API returns 500:**
- Check `.env` variables
- Verify services are running: `docker ps`
- Check logs: `docker logs nexus_postgres`

**Search returns no results:**
- Verify BING_SEARCH_API_KEY is set
- Check API quotas
- Try different search query

**Slow responses:**
- Check Redis cache: `redis-cli info`
- Verify Qdrant is healthy: `curl http://localhost:6333/health`
- Profile backend: `NODE_OPTIONS="--prof" yarn dev`

---

Need help? See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) or check API reference in [docs/API.md](./docs/API.md).
