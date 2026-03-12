# Deployment & Operations

## Hosting Options

### Phase 1 MVP (Chrome Extension + Backend)

**Hosting Platform:** Railway or Render (easiest for Node.js)

```bash
# Deploy backend to Railway
npm install -g railway
railway link
railway up
```

**Services to Deploy:**
- Backend API (Node.js)
- PostgreSQL (managed)
- Redis (managed)
- Qdrant (managed or self-hosted)

### Phase 2 Full Browser

**Desktop App Distribution:**
- GitHub Releases + Squirrel.Windows (auto-update)
- Direct download (.exe, .dmg, .deb)
- App Stores (optional)

**Mobile:**
- App Store (iOS) via Capacitor
- Google Play (Android) via Capacitor

---

## Environment Variables

See `.env.example`. Required for production:

```bash
# Secrets (use Railway/Render secrets manager)
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=<64-char-random-string>
STRIPE_SECRET_KEY=sk_live_...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/nexus_prod

# Services (Managed)
REDIS_URL=redis://upstash.io:...
QDRANT_URL=https://qdrant.cloud/...
```

---

## Deployment Checklist

Before going live:

- [ ] Domain configured (nexus.app or similar)
- [ ] SSL certificate (auto with Railway/Render)
- [ ] Database backed up
- [ ] Secrets in environment manager (not .env)
- [ ] CORS origins whitelisted
- [ ] Monitoring set up (Sentry, PostHog)
- [ ] Stripe webhook configured
- [ ] Email service (SendGrid/Mailgun)
- [ ] CDN for assets (Cloudflare)
- [ ] Rate limiting tested

---

## Monitoring & Observability

### Error Tracking
```bash
# Sentry
SENTRY_DSN=https://key@sentry.io/projectid
```

### Analytics
```bash
# PostHog (privacy-safe)
POSTHOG_API_KEY=phc_...
```

### Performance
```bash
# LangFuse (LLM observability)
LANGFUSE_SECRET_KEY=sk_...
```

### Logs
```bash
# View production logs
railway logs -e production
# or
render logs --service=nexus-api
```

---

## Database Backups

```bash
# Manual backup (PostgreSQL)
pg_dump "postgresql://user:pass@host:5432/nexus" > backup.sql

# Restore
psql "postgresql://user:pass@host:5432/nexus" < backup.sql

# Automated backups (Railway)
# Configured in Railway dashboard
```

---

## Performance Optimization

### Caching Strategy
- Query results: Redis (15 min TTL)
- User data: Redis (1 hour)
- Vector embeddings: Qdrant (persistent)

### Database Optimization
```sql
-- Add missing indexes
CREATE INDEX idx_searches_query_hash ON search_queries(query_hash);
CREATE INDEX idx_impressions_campaign ON ad_impressions(campaign_id);

-- Analyze performance
EXPLAIN ANALYZE SELECT * FROM search_queries WHERE user_id = $1;
```

### CDN
- Edge cache via Cloudflare
- Gzip compression enabled
- Image optimization (WebP)

---

## Scaling Roadmap

| Users | Infra | Changes |
|-------|-------|---------|
| <10K | Single instance + managed services | Current setup |
| 10–100K | Horizontal scaling (load balancer) | Add horizontal API instances |
| 100K–1M | Multi-region | Database read replicas, geo-routing |
| 1M+ | Full enterprise | Dedicated infra, custom caching, CDN |

---

## Disaster Recovery

**RTO (Recovery Time Objective):** <1 hour
**RPO (Recovery Point Objective):** <15 min

**Backup Strategy:**
- Daily full database backups
- 30-day retention
- Test restore quarterly
- Infrastructure as Code (Terraform)

**Failover:**
- Database: Managed service handles HA
- API: Load balancer + multiple instances
- Cache: Redis replication

---

## Security Hardening

```bash
# Keep dependencies updated
yarn upgrade-interactive

# Run security audit
yarn audit --audit-level moderate

# Database encryption at rest
# (Enabled by default in Railway/Render)

# TLS 1.3 enforced
# (Auto with Railway/Render)

# Rate limiting per IP
# (Configured in server.ts)
```

---

## Cost Optimization

| Component | Cost | Notes |
|-----------|------|-------|
| Backend API | $7/mo | Railway hobby tier |
| Database | $15/mo | 1GB Postgres |
| Redis | $5/mo | Upstash free tier |
| Qdrant | $20/mo | Cloud (pay-as-you-go) |
| CDN | $20/mo | Cloudflare Pro |
| **Total** | **$67+/mo** | Scales with usage |

**Cost reduction tips:**
- Use serverless when possible (but impacts latency)
- Cache aggressively to reduce DB/API calls
- Compress images + optimize assets
- Close unused instances

---

## Support & SLAs

**Free Tier:** Community support (Discord)
**Pro:** Email support, <24h response
**Team:** Priority support, <4h response
**Enterprise:** Dedicated account manager, <1h response

---

## Incident Response

1. **Detect:** Sentry/Datadog alert
2. **Alert:** Slack/PagerDuty notification
3. **Investigate:** Check logs, metrics, user reports
4. **Mitigate:** Rollback or hotfix
5. **Communicate:** Status page update
6. **RCA:** Post-mortem within 48h

Status page: `status.nexus.app` (StatusPage.io)
