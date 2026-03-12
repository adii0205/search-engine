# Nexus Roadmap

## Phase 1: MVP (3 months) ✅ In Progress

### Extension Foundation
- [x] Project scaffolding (this doc)
- [ ] Chrome extension manifest + build
- [ ] React popup UI (search box + results)
- [ ] Backend API (Fastify)
- [ ] RAG pipeline (search federation + LLM)

### Core Features
- [ ] Answer engine with source citations
- [ ] Bing/SerpAPI/Brave search integration
- [ ] Claude + Groq LLM routing
- [ ] Basic ad system (contextual, no tracking)
- [ ] User authentication (Clerk)

### Monetization
- [ ] Stripe billing integration
- [ ] Free tier (50 searches/day)
- [ ] Pro tier ($12/mo, unlimited searches)
- [ ] Carbon Ads integration

### Launch
- [ ] Chrome Web Store submission
- [ ] Product Hunt launch
- [ ] Documentation + setup guide
- [ ] **Target:** 1,000 users, $500 MRR

---

## Phase 2: Browser Alpha (Months 4–6)

### Browser Shell
- [ ] Tauri browser scaffold
- [ ] Tab management (multi-process)
- [ ] Address bar + bookmarks
- [ ] Sidebar (page intelligence)
- [ ] Settings panel

### AI Features
- [ ] Page summarization (sidebar)
- [ ] "Ask page" Q&A
- [ ] Auto-translate
- [ ] Screenshot search
- [ ] Memory engine (local embeddings)

### Monetization
- [ ] Team tier ($49/mo, workspaces)
- [ ] Enterprise features (SSO, analytics)
- [ ] Ad customization (users choose ads)

### Targets
- [ ] 10,000 MAU
- [ ] $10K MRR
- [ ] GitHub Releases for distribution

---

## Phase 3: Scale (Months 7–12)

### Market Expansion
- [ ] Mobile browser (iOS/Android, Capacitor)
- [ ] White-label program (API licensing)
- [ ] Enterprise sales (direct)
- [ ] Affiliate partnerships (Brave, Arc)

### Product
- [ ] Deep research mode (autonomous agent)
- [ ] Smart tab grouping + management
- [ ] Reading mode with highlights
- [ ] Video transcript search
- [ ] Sync across devices (E2E encrypted)

### Operations
- [ ] Series A funding (if bootstrapping allows)
- [ ] Team hiring (4–8 engineers)
- [ ] Support + community
- [ ] Security audits + compliance (SOC2, GDPR)

### Targets
- [ ] 50K MAU
- [ ] $50K+ MRR
- [ ] 100K monthly organic reach

---

## Phase 4: Enterprise (Year 2)

### Features
- [ ] Custom LLM integration (bring your own)
- [ ] On-premise deployment
- [ ] Custom integrations (Slack, Notion, etc)
- [ ] Advanced analytics
- [ ] Compliance packages (HIPAA, FedRAMP)

### Distribution
- [ ] AppStore + Google Play (paid app)
- [ ] B2B partnerships (SaaS platforms)
- [ ] Education program (free for students)
- [ ] Government contracts (if applicable)

### Targets
- [ ] 500K MAU
- [ ] $500K+ annual recurring revenue
- [ ] 50+ enterprise customers

---

## Hiring Plan

| Phase | Role | Priority |
|-------|------|----------|
| 1 | Backend Engineer | 🔴 Critical |
| 1 | Frontend Engineer (React) | 🔴 Critical |
| 2 | Tauri/Rust Developer | 🟡 High |
| 2 | DevOps/Infrastructure | 🟡 High |
| 3 | Product Manager | 🟡 High |
| 3 | Sales/BD | 🟡 High |
| 3 | Customer Success | 🟢 Medium |
| 4 | Security Engineer | 🟢 Medium |

---

## Success Metrics

### User Metrics
- **DAU/MAU:** 50K monthly users by month 12
- **Retention:** 40% D30, 20% D90
- **NPS:** >50 (Net Promoter Score)
- **Search volume:** 2M+ searches/month

### Business Metrics
- **ARR:** $500K+ by end of year
- **CAC (Customer Acquisition Cost):** <$5
- **LTV (Lifetime Value):** >$100
- **Churn:** <5% monthly

### Technical Metrics
- **Search latency:** <200ms P99
- **Uptime:** 99.9%
- **Security incidents:** 0
- **Code coverage:** >80%

---

## Known Challenges

| Challenge | Mitigation |
|-----------|-----------|
| Chrome dominance | Focus on privacy differentiator |
| Perplexity competition | Better UX, integration to browser |
| LLM costs | Multi-model routing, inference optimization |
| CAC in search | Organic launch (Product Hunt, communities) |
| Privacy (paradox) | Clear messaging, user control, open source core |

---

## Revenue Projections

| Month | Users | MRR | Cumulative |
|-------|-------|-----|-----------|
| 1 | 500 | $200 | $200 |
| 3 | 2K | $1,500 | $3K |
| 6 | 10K | $8K | $18K |
| 9 | 25K | $25K | $60K |
| 12 | 50K | $50K | **$330K** |

*Assumes: 60% free tier, 35% Pro ($12/mo), 5% Team ($49/mo)*

---

## Open Questions

- [ ] Will users accept ads if opt-in to categories?
- [ ] Can we achieve 1% conversion → $12 Pro without ads?
- [ ] What's the killer feature to drive Brave → Nexus?
- [ ] How to fund Series A without showing "hockey stick"?

---

## Get Involved

- **Contribute code:** See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Report bugs:** [GitHub Issues](https://github.com/nexus-ai/browser/issues)
- **Discuss features:** [GitHub Discussions](https://github.com/nexus-ai/browser/discussions)
- **Join Discord:** [link]
