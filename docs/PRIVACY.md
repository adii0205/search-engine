# Privacy Architecture

## Design Principles

1. **Zero-Knowledge by Default** — We don't know what you search for
2. **On-Device First** — Computation happens locally
3. **User Control** — You decide what data to share
4. **Transparency** — We publish what we collect and how

## Data Flows

### Search Query

```
User Query
    ↓
[Hash locally] ← Query never sent in plaintext
    ↓
Query Hash → Cloud API
    ↓
Results returned ↓ (already anonymized)
User never identified
```

### Ad System (Privacy-Preserving)

```
Page Content
    ↓
[NLP model runs locally] ← Device-side analysis
    ↓
Ad category (device-only) → Anonymous bid request
    ↓
No user profile sent
No browsing history sent
No cookies to advertisers
```

### User Memory

```
Browsing History
    ↓
[Generate embeddings locally]
    ↓
Store in local SQLite (encrypted)
    ↓
Synced to cloud (E2E encrypted with user's key)
User can delete anytime (GDPR right to erasure)
```

## Privacy Guarantees

| Data | Collection | Storage | Sharing |
|------|-----------|---------|---------|
| **Search queries** | ❌ Never | — | — |
| **Browsing history** | ✅ Local optional | Encrypted | User choice |
| **IP address** | Hashed | Auto-delete 7d | Logs purged |
| **User profile** | ✅ Minimal (email only) | Encrypted | Never sold |
| **Ad preferences** | ✅ On-device | Device-only | Not shared |

## Technology Stack

- **DNS:** Quad9 (privacy-focused DNS resolver)
- **Encryption:** TLS 1.3 + AES-256 for local storage
- **Hashing:** SHA-256 for query anonymization
- **NLP (on-device):** BERT-tiny (1MB model, runs locally)
- **Fingerprinting protection:** Canvas/WebGL randomization
- **Tracking prevention:** ETag removal, cookie isolation

## Data You Control

Users can:
- Download all their data (GDPR Article 20)
- Delete all their data (GDPR Article 17)
- Request what we have on them (GDPR Article 15)
- Opt-out of memory/learning
- Disable ad personalization
- View/delete search history
- Block specific tracking (fingerprints, cookies)

## Compliance

- ✅ GDPR (EU users)
- ✅ CCPA (California users)
- ✅ PIPEDA (Canada)
- ✅ SOC2 Type II (enterprise)
- 🔄 HIPAA (coming for enterprise)

## Open Source

The core Nexus browser will be open source (AGPL) for:
- Security audits
- Community contributions
- Trust and transparency

Private parts (ad system, billing) remain proprietary.

## Audit & Transparency

**Annual:**
- Third-party privacy audit
- Published transparency report
- Code review by external firm

Reports available at `nexus.app/transparency`
