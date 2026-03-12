# Contributing to Nexus

## Code of Conduct

Be respectful, inclusive, and constructive.

## Getting Started

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Install dependencies: `yarn install`
4. Follow the setup in [SETUP.md](./SETUP.md)

## Development Workflow

```bash
# Start services
docker-compose up -d

# Run backend
yarn workspace @nexus/backend dev

# Run extension
yarn workspace @nexus/extension dev

# Run tests
yarn test

# Type check
yarn type-check

# Lint
yarn lint
```

## Code Style

- **Language:** TypeScript (strict mode)
- **Formatter:** Prettier (auto-format on commit)
- **Linter:** ESLint
- **Testing:** Jest + React Testing Library

```bash
# Auto-format
yarn prettier --write src/

# Lint
yarn lint --fix
```

## Pull Request Process

1. Create branch from `main`
2. Make changes
3. Write tests
4. Update docs if needed
5. Submit PR with description
6. Address review comments
7. Merge when approved

## Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`

Example:
```
feat: add deep research mode

Implement autonomous research agent using Claude tool_use.
Reduces manual research time by 70%.

Closes #123
```

## Testing Requirements

- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows
- >80% coverage target

```bash
yarn test --coverage
```

## Security

- Report security issues to security@nexus.app
- Do not open public issues
- Include reproduction steps and impact

## Feature Requests

Discuss in [GitHub Discussions](https://github.com/nexus-ai/browser/discussions) before coding.

## Questions?

- Join Discord: [link]
- Check FAQ: [link]
- Open an issue
