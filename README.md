# Instagram Chatbot SaaS Platform

A white-label, multi-tenant SaaS platform for automated Instagram Direct messaging.

## Project Structure

```
├── backend/          # NestJS API server
├── frontend-admin/   # React admin panel (Vite)
├── frontend-client/  # Next.js client portal
└── package.json      # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- Instagram Business Account

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend-admin/.env.example frontend-admin/.env
cp frontend-client/.env.example frontend-client/.env
```

### Development

```bash
# Run backend
npm run dev:backend

# Run admin panel
npm run dev:admin

# Run client portal
npm run dev:client
```

### Build

```bash
# Build all projects
npm run build:all
```

## Documentation

- [Requirements](.kiro/specs/instagram-chatbot-saas/requirements.md)
- [Design](.kiro/specs/instagram-chatbot-saas/design.md)
- [Tasks](.kiro/specs/instagram-chatbot-saas/tasks.md)

## License

Proprietary
