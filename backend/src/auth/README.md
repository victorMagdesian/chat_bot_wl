# Authentication Module

This module implements JWT-based authentication with support for local (email/password) and Google OAuth authentication.

## Features

- JWT token-based authentication
- Email/password registration and login
- Google OAuth integration
- Token refresh mechanism
- Password hashing with bcrypt
- Protected routes with guards
- User and tenant context decorators

## Endpoints

### POST /auth/register
Register a new user with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "tenantId": "optional-tenant-id"
}
```

### POST /auth/login
Login with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

### GET /auth/google
Initiate Google OAuth flow.

### GET /auth/google/callback
Google OAuth callback endpoint.

### GET /auth/me
Get current user profile (protected route).

## Usage

### Protecting Routes

By default, all routes are protected. Use the `@Public()` decorator to make routes public:

```typescript
import { Public } from '../common/decorators';

@Public()
@Get('public-route')
async publicRoute() {
  return 'This is public';
}
```

### Getting Current User

Use the `@CurrentUser()` decorator to get the authenticated user:

```typescript
import { CurrentUser, CurrentUserData } from '../common/decorators';

@Get('profile')
async getProfile(@CurrentUser() user: CurrentUserData) {
  return user;
}
```

### Getting Tenant Context

Use the `@Tenant()` decorator to get the tenant information:

```typescript
import { Tenant } from '../common/decorators';

@Get('tenant-info')
async getTenantInfo(@Tenant() tenant) {
  return tenant;
}
```

## Environment Variables

```env
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

## Security Features

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens expire after 1 hour (configurable)
- Refresh tokens expire after 7 days (configurable)
- Failed login attempts don't reveal if email exists
- Cross-tenant access is prevented through tenant validation
