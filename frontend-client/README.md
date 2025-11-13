# Instagram Chatbot SaaS - Client Portal

Multi-tenant Next.js application for end clients to manage their Instagram chatbot conversations, scheduled messages, and settings.

## Features

- **Multi-tenant Architecture**: Subdomain-based tenant detection
- **Authentication**: JWT-based authentication with token refresh
- **Real-time Chat**: WebSocket integration for live message updates
- **Dashboard**: Overview of messages, active chats, and quick actions
- **Chat Management**: View and respond to Instagram conversations
- **Scheduled Messages**: Schedule messages for future delivery
- **Tenant Branding**: Customizable logo and primary color per tenant
- **Settings**: Manage tenant branding and configuration

## Tech Stack

- **Framework**: Next.js 13 with TypeScript
- **UI Library**: Chakra UI
- **State Management**: React Context API + Zustand
- **API Client**: Axios with interceptors
- **Real-time**: Socket.io Client
- **Icons**: React Icons

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (see backend/README.md)

### Installation

```bash
cd frontend-client
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

### Testing Multi-tenancy Locally

To test multi-tenancy locally, you need to configure your hosts file:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux**: `/etc/hosts`

Add entries like:
```
127.0.0.1 tenant1.localhost
127.0.0.1 tenant2.localhost
```

Then access:
- `http://tenant1.localhost:3001`
- `http://tenant2.localhost:3001`

## Project Structure

```
src/
├── components/
│   └── Layout/
│       └── DashboardLayout.tsx    # Main layout with sidebar
├── contexts/
│   └── AuthContext.tsx            # Authentication context
├── hooks/
│   ├── useTenant.ts               # Tenant data hook
│   └── useWebSocket.ts            # WebSocket hooks
├── lib/
│   ├── api.ts                     # Axios instance with interceptors
│   ├── tenantContext.tsx          # Tenant context provider
│   └── websocket.ts               # WebSocket client
├── pages/
│   ├── _app.tsx                   # App wrapper
│   ├── _document.tsx              # Document wrapper
│   ├── _error.tsx                 # Error page
│   ├── index.tsx                  # Home/redirect page
│   ├── login.tsx                  # Login page
│   ├── dashboard.tsx              # Dashboard page
│   ├── tenant-error.tsx           # Tenant not found page
│   ├── chats/
│   │   ├── index.tsx              # Chat list
│   │   └── [id].tsx               # Chat detail
│   ├── schedules/
│   │   └── index.tsx              # Scheduled messages
│   └── settings/
│       └── index.tsx              # Tenant settings
└── middleware.ts                  # Tenant detection middleware
```

## Key Features Implementation

### Tenant Detection

The middleware extracts the tenant from the subdomain and adds it to request headers:

```typescript
// middleware.ts
const subdomain = hostname?.split('.')[0];
requestHeaders.set('x-tenant-domain', subdomain);
```

### Authentication

JWT tokens are stored in localStorage and automatically added to API requests:

```typescript
// lib/api.ts
const token = localStorage.getItem('accessToken');
config.headers.Authorization = `Bearer ${token}`;
```

Token refresh is handled automatically on 401 responses.

### Real-time Updates

WebSocket connection is established on authentication and listens for new messages:

```typescript
// hooks/useWebSocket.ts
const socket = initializeWebSocket(token);
socket.on('newMessage', callback);
```

### Tenant Branding

Each tenant can customize their logo and primary color, which is applied throughout the UI:

```typescript
// lib/tenantContext.tsx
const { logoUrl, primaryColor } = useTenant();
```

## API Endpoints Used

- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Get current user
- `GET /tenants/domain/:domain` - Get tenant by domain
- `PATCH /tenants/me` - Update tenant settings
- `POST /tenants/upload-logo` - Upload tenant logo
- `GET /chats` - List chats
- `GET /chats/:id` - Get chat details
- `POST /chats/:id/messages` - Send message
- `GET /chats/scheduled` - List scheduled messages
- `POST /chats/scheduled` - Create scheduled message
- `DELETE /chats/scheduled/:id` - Cancel scheduled message

## Building for Production

```bash
npm run build
npm start
```

## Deployment

The application is designed to be deployed on Vercel with:

1. Wildcard subdomain support
2. Environment variables configured
3. SSR enabled for tenant detection

### Vercel Configuration

```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/:path*"
    }
  ]
}
```

Configure wildcard domain in Vercel: `*.yourdomain.com`

## License

Proprietary
