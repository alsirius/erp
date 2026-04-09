# Siriux Architecture & Design Principles

## Overview
Siriux is a modern roster management solution built with a clean separation between frontend and backend, emphasizing security, type safety, and maintainability.

## Core Architecture Principles

### 1. Separation of Concerns
- **Frontend**: Next.js 14 with TypeScript, responsible for UI/UX only
- **Backend**: Express.js with TypeScript, handles business logic and data
- **Database**: Multi-engine support via Generic DAO pattern
  - **Development**: SQLite (Local)
  - **Production/Staging**: Snowflake (Corporate Data Warehouse)
- **Communication**: REST APIs with JWT-based authentication

### 2. Security First
- All API endpoints require JWT authentication (except public endpoints)
- Token payload inspection for forgery detection
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS configuration

### 3. Type Safety
- **TypeScript** throughout the stack
- Shared type definitions between frontend and backend
- Database models with TypeScript interfaces
- API request/response type definitions

## Backend Architecture

### Layer Structure
```
backend/src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── dao/            # Data Access Objects
├── models/         # Database models and interfaces
├── middleware/     # Authentication, validation, error handling
├── routes/         # API route definitions
├── utils/          # Helper functions
├── types/          # TypeScript type definitions
└── config/         # Configuration files
```

### Data Flow
1. **Request** → Middleware (auth, validation) → Controller → Service → DAO → Database
2. **Response** → Database → DAO → Service → Controller → Response

### Authentication Strategy
- JWT tokens with signed payload
- Token contains: userId, role, permissions, timestamp
- Backend inspects token signature and payload for each request
- Refresh token mechanism for extended sessions

## Frontend Architecture

### Component Structure
```
frontend/src/
├── app/            # Next.js app router
├── components/     # Reusable UI components
├── pages/          # Route components
├── hooks/          # Custom React hooks
├── services/       # API communication layer
├── utils/          # Helper functions
├── types/          # TypeScript definitions
└── store/          # State management (if needed)
```

### API Communication
- Centralized API service with typed requests/responses
- Automatic token injection in headers
- Error handling and retry logic
- Request/response interceptors

## Database Design

### DAO Pattern Implementation
- Abstract database operations behind interfaces
- Each entity has its own DAO class
- Transaction support across multiple operations
- Connection pooling and error handling

### Example DAO Structure
```typescript
interface UserDAO {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserDto): Promise<User>;
  update(id: string, updates: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<boolean>;
}
```

## API Design Principles

### RESTful Conventions
- Resource-based URLs: `/api/users`, `/api/rosters`
- HTTP methods: GET, POST, PUT, DELETE
- Consistent response format
- Proper HTTP status codes

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

## Documentation Strategy

### 1. Code Documentation
- JSDoc comments for all public functions
- Type definitions serve as documentation
- README files for each major module

### 2. API Documentation
- OpenAPI/Swagger specification
- Interactive API documentation
- Example requests/responses

### 3. AI Context Management
- Central context file (`AI_CONTEXT.md`) for development guidelines
- Type definitions as single source of truth
- Consistent naming conventions and patterns

## Development Workflow

### 1. AI-Assisted Development
- AI always references `AI_CONTEXT.md` for guidelines
- Type-first development approach
- Automated testing and linting

### 2. Code Quality
- ESLint + Prettier for consistent formatting
- Unit tests for business logic
- Integration tests for API endpoints
- Type checking as first line of defense

## Technology Stack Summary

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3) & Snowflake (snowflake-sdk)
- **Authentication**: JWT with bcrypt
- **Documentation**: OpenAPI/Swagger
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **State**: React hooks (Context API if needed)
- **HTTP Client**: Native fetch or axios
- **Testing**: Jest + React Testing Library

## Security Considerations

### Token Security
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Secure token storage (httpOnly cookies)
- Token rotation on refresh

### API Security
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## Performance Considerations

### Backend
- Database connection pooling
- Query optimization
- Caching strategy
- Pagination for large datasets

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

## Deployment Strategy

### Backend
- Containerized deployment (Docker)
- Environment-based configuration
- Health checks and monitoring
- Database migrations

### Frontend
- Static site generation where possible
- CDN deployment
- Environment variables for API endpoints
- Build optimization

This architecture ensures scalability, maintainability, and security while providing clear guidelines for AI-assisted development.
