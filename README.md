# Nexus — AI Search Engine + Browser

A production-grade, privacy-first AI-native browser with integrated search engine. Competing with Chrome, Brave, Arc, and Perplexity.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn 3.6+
- PostgreSQL 14+
- Redis 6+
- Docker (optional, for services)

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd nexus
yarn install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start services (Docker)
docker-compose up -d

# Run development servers
yarn dev
```

## 📁 Project Structure

```
nexus/
├── extension/           # Chrome Extension MVP
│   ├── src/
│   │   ├── manifest.json
│   │   ├── popup.tsx           # New tab + search UI
│   │   ├── sidebar.tsx          # Page intelligence sidebar
│   │   ├── background.ts        # Service worker
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/             # Fastify API Server
│   ├── src/
│   │   ├── server.ts           # Fastify app
│   │   ├── routes/
│   │   │   ├── auth.ts         # Auth endpoints
│   │   │   ├── search.ts       # Search API
│   │   │   ├── user.ts         # User profiles
│   │   │   └── ads.ts          # Ad engine
│   │   ├── services/
│   │   │   ├── llm.ts          # LLM orchestration
│   │   │   ├── rag.ts          # RAG pipeline
│   │   │   ├── search.ts       # Search federator
│   │   │   └── ads.ts          # Privacy-first ads
│   │   ├── db/
│   │   │   ├── schema.ts       # Database schema
│   │   │   └── client.ts       # DB client
│   │   └── middleware/
│   ├── package.json
│   └── tsconfig.json
│
├── browser/             # Tauri Browser (Phase 2)
│   ├── src/             # React UI
│   ├── src-tauri/       # Rust backend
│   ├── package.json
│   └── tauri.conf.json
│
├── docs/                # Product spec + architecture docs
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── docker-compose.yml   # Database + services
├── package.json         # Monorepo root
└── README.md
```

## 🏆 Phase 1 — Chrome Extension MVP (Current)

### Features
- [x] AI-powered new tab page
- [x] Answer engine with source citations
- [x] Basic ad integration (contextual)
- [x] Free + Pro tier with Stripe

### Checklist
- [ ] Extension manifest + popup UI
- [ ] RAG pipeline (search + summarize)
- [ ] User auth (Clerk)
- [ ] Ad system integration
- [ ] Stripe billing

## 🔄 Phase 2 — Browser Alpha

- [ ] Tauri browser shell
- [ ] Tab manager + AI sidebar
- [ ] Local memory engine
- [ ] Team tier + enterprise features

## 📊 Stack Overview

| Component | Technology | Why |
|-----------|-----------|-----|
| Extension | React 18 + TypeScript | Fast, composable, familiar |
| Backend | Fastify + Node.js | High throughput, easy deployment |
| Vector DB | Qdrant | Self-hosted, semantic search |
| LLM | Claude Sonnet | Best for RAG, reasoning |
| Auth | Clerk | OAuth2, SSO, magic links |
| DB | PostgreSQL | Reliable, complex queries |
| Cache | Redis | Sub-ms lookups |
| Storage | Cloudflare R2 | Cheap, S3-compatible |

## 🔐 Security & Privacy

- Zero-knowledge architecture: queries hashed before logging
- Local-first memory: embeddings stored on device in SQLite
- End-to-end encrypted sync
- Privacy-preserving ads: on-device NLP, no data leak
- Open source core (trust signal)

## 📈 Success Metrics (MVP)

- **User acquisition:** 1K users by end of Phase 1
- **Engagement:** 15+ searches/user/day
- **Revenue:** $500+ MRR from Pro subscriptions + ads
- **Performance:** <200ms P99 search latency
- **Quality:** 90%+ source relevance score

## 🛠️ Development

```bash
# Run extension
yarn workspace @nexus/extension dev

# Run backend
yarn workspace @nexus/backend dev

# Watch logs
docker logs -f nexus_postgres
docker logs -f nexus_redis

# Database migrations
yarn workspace @nexus/backend db:migrate
```

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Database Schema](./docs/SCHEMA.md)
- [Contributing](./CONTRIBUTING.md)

## 📜 License

Proprietary — Nexus Inc.

## 🎯 Next Steps

1. Set up `.env` with API keys
2. Start Docker services: `docker-compose up -d`
3. Install dependencies: `yarn install`
4. Run extension dev: `yarn workspace @nexus/extension dev`
5. Load extension in Chrome for testing
