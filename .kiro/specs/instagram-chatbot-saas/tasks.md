# Implementation Plan

- [x] 1. Initialize project structure and dependencies







  - Create monorepo structure with backend, frontend-admin, and frontend-client directories
  - Initialize NestJS project in backend directory with TypeScript configuration
  - Initialize React project with Vite in frontend-admin directory
  - Initialize Next.js project with TypeScript in frontend-client directory
  - Configure shared TypeScript configurations and ESLint rules
  - Set up Git repository with .gitignore for node_modules and environment files
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 2. Set up backend database and ORM





  - [x] 2.1 Configure Prisma with PostgreSQL


    - Install Prisma CLI and client dependencies
    - Create prisma/schema.prisma file with datasource configuration
    - Configure DATABASE_URL environment variable
    - _Requirements: 11.1, 11.5_
  
  - [x] 2.2 Define database schema models


    - Write Tenant model with id, name, domain, logoUrl, primaryColor fields
    - Write User model with authentication fields and tenant relationship
    - Write Bot model with Instagram credentials and tenant relationship
    - Write Automation model with trigger, response fields and bot relationship
    - Write Chat model with Instagram user info and bot relationship
    - Write Message model with content, sender fields and chat relationship
    - Write ScheduledMessage model with scheduling fields
    - Add appropriate indexes for performance optimization
    - _Requirements: 11.2, 11.4_
  

  - [x] 2.3 Create initial database migration

    - Run prisma migrate dev to create initial migration
    - Generate Prisma client types
    - Verify database schema creation
    - _Requirements: 11.3_

- [x] 3. Implement authentication system




  - [x] 3.1 Set up JWT authentication


    - Install @nestjs/jwt and @nestjs/passport dependencies
    - Create auth module, controller, and service
    - Implement JWT strategy with token validation
    - Create login and register endpoints
    - Implement password hashing with bcrypt
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 3.2 Implement Google OAuth integration


    - Install passport-google-oauth20 dependency
    - Create Google OAuth strategy
    - Configure OAuth callback endpoint
    - Implement user creation/lookup for OAuth users
    - _Requirements: 2.3_
  
  - [x] 3.3 Create authentication guards and decorators


    - Implement JwtAuthGuard for protected routes
    - Create CurrentUser decorator to extract user from request
    - Create Tenant decorator to extract tenant context
    - Implement token refresh endpoint
    - _Requirements: 2.5, 12.1_

- [x] 4. Implement multi-tenancy infrastructure




  - [x] 4.1 Create tenant middleware and interceptor


    - Implement TenantInterceptor to extract tenant from request
    - Create TenantGuard to validate tenant access
    - Add tenant context to request object
    - _Requirements: 1.1, 1.4_
  
  - [x] 4.2 Implement tenant service and CRUD operations


    - Create tenants module, controller, and service
    - Implement create tenant endpoint with domain validation
    - Implement get tenant by domain endpoint
    - Implement update tenant endpoint for branding
    - Implement tenant isolation in all database queries
    - _Requirements: 1.2, 1.3, 1.5, 8.2_
  
  - [x] 4.3 Write unit tests for tenant isolation


    - Test tenant context extraction from requests
    - Test cross-tenant access prevention
    - Test tenant-scoped database queries
    - _Requirements: 1.5_

- [x] 5. Implement bot management module




  - [x] 5.1 Create bot service and CRUD endpoints


    - Create bots module, controller, and service
    - Implement create bot endpoint with tenant association
    - Implement list bots endpoint with tenant filtering
    - Implement update bot endpoint with ownership validation
    - Implement delete bot endpoint with cascade deletion
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 5.2 Implement bot activation and Instagram credential storage


    - Add encryption utility for Instagram access tokens
    - Implement bot activation/deactivation logic
    - Store Instagram user ID and encrypted access token
    - _Requirements: 3.5, 4.4_

- [x] 6. Implement automation configuration module




  - [x] 6.1 Create automation service and CRUD endpoints


    - Create automations module, controller, and service
    - Implement create automation endpoint with validation
    - Implement list automations endpoint filtered by bot
    - Implement update automation endpoint
    - Implement delete automation endpoint
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 6.2 Implement automation matching engine


    - Create service to match incoming messages against automation triggers
    - Implement keyword matching logic with case-insensitive comparison
    - Handle multiple automation matches with priority ordering
    - Return matched automation response
    - _Requirements: 5.4_

- [ ] 7. Set up Redis and BullMQ for async processing
  - [ ] 7.1 Configure Redis connection
    - Install ioredis and @nestjs/bullmq dependencies
    - Create Redis configuration module
    - Configure REDIS_URL environment variable
    - Test Redis connection on application startup
    - _Requirements: 7.4_
  
  - [ ] 7.2 Create message processing queue
    - Create scheduler module with BullMQ configuration
    - Define message processing queue with retry logic
    - Implement message processor to handle incoming Instagram messages
    - Add job logging and error handling
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 8. Implement Instagram Graph API integration
  - [ ] 8.1 Create Instagram service for API calls
    - Create instagram module and service
    - Implement send message method using Graph API
    - Implement error handling for API failures
    - Add rate limiting awareness
    - _Requirements: 3.1_
  
  - [ ] 8.2 Implement webhook endpoint
    - Create webhook controller with GET and POST endpoints
    - Implement webhook verification with challenge response
    - Validate webhook signatures using app secret
    - Parse incoming message payloads
    - Queue messages for async processing
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 8.3 Integrate automation engine with message processing
    - In message processor, fetch bot and automations
    - Match message content against automation triggers
    - Send automated response via Instagram API
    - Store message and response in database
    - _Requirements: 5.4, 3.1_

- [ ] 9. Implement chat management and real-time updates
  - [ ] 9.1 Create chat service and endpoints
    - Create chats module, controller, and service
    - Implement get chats endpoint with pagination
    - Implement get chat by ID with message history
    - Implement create/update chat on new messages
    - Store messages with sender, content, and timestamp
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [ ] 9.2 Implement WebSocket gateway for real-time chat
    - Install @nestjs/websockets and socket.io dependencies
    - Create chats gateway with WebSocket handlers
    - Implement authentication for WebSocket connections
    - Emit new message events to connected clients
    - Filter events by tenant context
    - _Requirements: 6.2_

- [ ] 10. Implement scheduled message system
  - [ ] 10.1 Create scheduled message service and endpoints
    - Create scheduled message endpoints in chats module
    - Implement create scheduled message with future datetime validation
    - Implement list scheduled messages endpoint
    - Implement cancel scheduled message endpoint
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 10.2 Implement scheduled message processor
    - Create BullMQ queue for scheduled messages
    - Implement processor to send messages at scheduled time
    - Update message status after sending
    - Handle failures and retry logic
    - _Requirements: 9.3, 9.4_

- [ ] 11. Implement metrics and dashboard data
  - [ ] 11.1 Create metrics service
    - Create metrics calculation service in tenants or dashboard module
    - Implement total message count query for tenant
    - Implement active chat count query
    - Implement average response time calculation
    - Filter all metrics by tenant and date range
    - _Requirements: 10.1, 10.2_
  
  - [ ] 11.2 Create metrics endpoint
    - Create dashboard or metrics controller
    - Implement GET /metrics endpoint with tenant filtering
    - Return metrics in structured format
    - Add caching for expensive calculations
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 12. Implement API security and validation
  - [ ] 12.1 Add input validation to all DTOs
    - Install class-validator and class-transformer
    - Add validation decorators to all DTO classes
    - Configure global validation pipe in main.ts
    - _Requirements: 12.3_
  
  - [ ] 12.2 Implement rate limiting
    - Install @nestjs/throttler dependency
    - Configure throttler module with 100 requests per minute limit
    - Apply throttler guard globally
    - Add custom limits for webhook endpoints
    - _Requirements: 12.2_
  
  - [ ] 12.3 Implement error logging and monitoring
    - Install @sentry/node dependency
    - Configure Sentry in main.ts with DSN
    - Create global exception filter
    - Log authentication failures with IP address
    - Implement structured logging for all errors
    - _Requirements: 12.4, 12.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 13. Create Docker configuration for backend
  - [ ] 13.1 Write Dockerfile for backend
    - Create Dockerfile with Node.js 20 Alpine base image
    - Copy package files and install dependencies
    - Generate Prisma client in build step
    - Expose port 3000
    - Set production start command
    - _Requirements: 13.1_
  
  - [ ] 13.2 Create docker-compose for local development
    - Create docker-compose.yml with backend, PostgreSQL, and Redis services
    - Configure environment variables
    - Set up volume mounts for development
    - _Requirements: 13.1, 13.2_

- [ ] 14. Build Admin Panel frontend
  - [ ] 14.1 Set up authentication and routing
    - Install React Router and Chakra UI dependencies
    - Create AuthContext for managing authentication state
    - Implement login page with email/password form
    - Create protected route wrapper component
    - Implement API service with Axios and JWT interceptor
    - _Requirements: 2.1, 2.2_
  
  - [ ] 14.2 Create main layout and navigation
    - Create MainLayout component with sidebar and header
    - Implement navigation menu with links to all sections
    - Add user profile dropdown with logout
    - Implement responsive design for mobile
    - _Requirements: 13.4_
  
  - [ ] 14.3 Implement tenant management pages
    - Create TenantList page displaying all tenants in table
    - Create TenantForm component for create/edit
    - Implement file upload for logo with preview
    - Add color picker for primary color selection
    - Integrate with backend tenant endpoints
    - _Requirements: 8.1, 8.2_
  
  - [ ] 14.4 Implement bot management pages
    - Create BotList page with tenant filtering
    - Create BotForm for creating and editing bots
    - Add Instagram credential input fields
    - Implement bot activation toggle
    - Integrate with backend bot endpoints
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 14.5 Implement automation management pages
    - Create AutomationList page filtered by selected bot
    - Create AutomationForm with trigger and response fields
    - Add validation for empty triggers and responses
    - Implement priority ordering UI
    - Integrate with backend automation endpoints
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [ ] 14.6 Implement metrics dashboard
    - Create MetricsDashboard page
    - Fetch metrics data from backend
    - Display total messages, active chats, and response time
    - Create charts using recharts or similar library
    - Add date range selector for filtering
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15. Build Client Portal frontend
  - [ ] 15.1 Set up Next.js with tenant detection
    - Configure Next.js with TypeScript
    - Create middleware.ts to extract tenant from subdomain
    - Implement tenant context using React Context API
    - Create API client with tenant header injection
    - _Requirements: 15.1, 15.2, 15.5_
  
  - [ ] 15.2 Implement authentication and layout
    - Create login page with email/password form
    - Implement JWT storage and refresh logic
    - Create DashboardLayout component with navigation
    - Add tenant branding loader to apply logo and colors
    - _Requirements: 2.1, 8.3, 8.4_
  
  - [ ] 15.3 Create dashboard page
    - Create dashboard page with summary cards
    - Display active chats count and recent activity
    - Show quick actions for common tasks
    - Implement responsive grid layout
    - _Requirements: 15.3_
  
  - [ ] 15.4 Implement chat management pages
    - Create chat list page with search and filters
    - Create chat detail page with message history
    - Implement WebSocket connection for real-time updates
    - Display message bubbles with sender distinction
    - Add auto-scroll to latest message
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 15.5 Implement scheduled messages page
    - Create scheduled messages list page
    - Create schedule form with datetime picker
    - Implement recipient selection
    - Add cancel scheduled message button
    - Integrate with backend scheduled message endpoints
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 15.6 Implement settings page
    - Create settings page for tenant branding
    - Add logo upload with preview
    - Add color picker for primary color
    - Implement save changes with API integration
    - Show success/error notifications
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 15.7 Handle tenant routing errors
    - Implement error page for invalid tenant domains
    - Add redirect logic for non-existent tenants
    - Display user-friendly error messages
    - _Requirements: 15.3_

- [ ] 16. Configure deployment
  - [ ] 16.1 Prepare backend for deployment
    - Create environment variable documentation
    - Configure production database connection
    - Set up Redis connection for production
    - Configure CORS for frontend domains
    - _Requirements: 13.2, 13.5_
  
  - [ ] 16.2 Deploy backend to Railway or Render
    - Create account on Railway or Render
    - Connect GitHub repository
    - Configure environment variables in platform
    - Set up PostgreSQL and Redis add-ons
    - Deploy and verify API endpoints
    - _Requirements: 13.2_
  
  - [ ] 16.3 Deploy Admin Panel to Vercel
    - Create Vercel account and connect repository
    - Configure build settings for React app
    - Set environment variables for API URL
    - Deploy and verify admin panel access
    - _Requirements: 13.4_
  
  - [ ] 16.4 Deploy Client Portal to Vercel
    - Configure Vercel project for Next.js
    - Set up wildcard subdomain routing
    - Configure environment variables
    - Enable SSR and API routes
    - Deploy and test multi-tenant routing
    - _Requirements: 13.3, 15.1, 15.2_

- [ ] 17. Integration testing and final wiring
  - [ ] 17.1 Test complete Instagram webhook flow
    - Configure Instagram app webhook URL
    - Send test message to bot Instagram account
    - Verify webhook receives message
    - Verify automation triggers and responds
    - Verify message appears in chat history
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.4_
  
  - [ ] 17.2 Test multi-tenant isolation
    - Create two test tenants with different domains
    - Verify each tenant sees only their own data
    - Test cross-tenant access prevention
    - Verify branding applies correctly per tenant
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 17.3 Test real-time chat updates
    - Open client portal in browser
    - Send message via Instagram to bot
    - Verify message appears in real-time without refresh
    - Test WebSocket reconnection on disconnect
    - _Requirements: 6.2_
  
  - [ ] 17.4 Test scheduled message delivery
    - Create scheduled message for 2 minutes in future
    - Verify message appears in pending list
    - Wait for scheduled time and verify message sends
    - Verify status updates to "sent"
    - _Requirements: 9.3, 9.4_
