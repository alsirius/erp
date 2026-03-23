# AI Context - Siriux Premium WebApp Starter Kit

## Project Overview

**Siriux Premium WebApp Starter Kit** is a comprehensive, production-ready web application template designed for rapid development of enterprise-grade applications. It provides a complete foundation with PostgreSQL database, generic architecture patterns, advanced authentication, and modern frontend components that can be adapted to any business domain.

## Purpose

This premium starter kit is designed to help developers quickly build production-ready web applications with enterprise-grade architecture, comprehensive user management, and scalable patterns. Whether you're building SaaS, e-commerce, healthcare, education, or any other web application, this starter provides the foundation you need.

## Key Features

### 🗄️ Database Architecture
- **PostgreSQL Primary** - Production-ready database with connection pooling
- **SQLite Development** - Local development with easy setup
- **Generic DAO Pattern** - Database abstraction layer
- **Migration System** - Automatic schema management
- **Transaction Support** - ACID compliance
- **Multi-database Support** - Easy switching between databases

### 🔐 Advanced Authentication System
- **JWT with Refresh Tokens** - Secure token management
- **Role-Based Access Control** - Flexible permission system
- **Password Security** - Bcrypt hashing with salt rounds
- **Session Management** - Secure session storage
- **Token Validation** - Automatic token refresh
- **Multi-factor Ready** - Framework for 2FA implementation

### 🏗️ Generic Architecture Patterns
- **Generic DAO Layer** - Reusable data access patterns
- **Generic Service Layer** - Business logic abstraction
- **Generic API Client** - Type-safe frontend API calls
- **Generic Controllers** - Reusable CRUD controllers
- **Response Builders** - Standardized API responses
- **Error Handling** - Comprehensive error management

### ⚛️ Modern Frontend Architecture
- **TypeScript Throughout** - Complete type safety
- **Generic API Client** - Reusable HTTP client
- **React Hooks** - Custom authentication and data hooks
- **Debounced Validation** - User-friendly form validation
- **Visual Indicators** - Professional validation feedback
- **State Management** - Context-based state patterns

### 🔧 Developer Experience
- **Hot Reload** - Instant development feedback
- **Environment Configuration** - Flexible setup
- **Database Migrations** - Automated schema updates
- **Comprehensive Logging** - Structured request logging
- **Error Tracking** - Production error monitoring
- **Setup Scripts** - One-command project initialization

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware stack
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT with refresh tokens
- **ORM**: Generic DAO pattern (no heavy ORM)
- **Email**: Nodemailer with SMTP support
- **Validation**: Joi schemas with custom validators
- **Logging**: Winston with structured logging

### Frontend
- **Framework**: React with TypeScript
- **Routing**: React Router with protected routes
- **Styling**: Tailwind CSS with responsive design
- **State**: Context API with custom hooks
- **HTTP Client**: Generic API client with interceptors
- **Forms**: React Hook Form with validation
- **Validation**: Debounced validation with visual feedback

### Development Tools
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest with test utilities
- **Build**: Webpack with optimization
- **Environment**: Multi-environment configuration
- **CI/CD**: GitHub Actions ready

## Project Structure

```
siriux-premium-starter/
├── 📁 backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Generic CRUD controllers
│   │   ├── services/        # Business logic layer
│   │   ├── dao/            # Data access objects
│   │   ├── middleware/      # Auth, logging, validation
│   │   ├── database/        # Database managers
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   └── package.json
├── 📁 frontend/               # React/TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client and services
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   └── package.json
├── 📁 docs/                  # Documentation
├── 📁 scripts/               # Setup and deployment scripts
├── 📋 .env.postgres.example   # PostgreSQL configuration
├── 📋 .env.sqlite.example     # SQLite configuration
└── 📋 README.md              # Comprehensive documentation
```

## Development Workflow

### Getting Started
1. **Clone Repository**
   ```bash
   git clone https://github.com/alsirius/siriux.git my-new-app
   cd my-new-app
   ```

2. **Setup Environment**
   ```bash
   cp .env.postgres.example .env
   # Edit .env with your configuration
   ```

3. **Install Dependencies**
   ```bash
   npm run setup
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

### Customization Guide

#### 1. Database Configuration
```bash
# PostgreSQL (Production)
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp

# SQLite (Development)
DATABASE_URL=sqlite:./data/app.db
```

#### 2. Adding New Entities
```typescript
// 1. Define Types
interface Product {
  id: string;
  name: string;
  price: number;
}

// 2. Create DAO
class ProductDAO extends PostgreSQLDAO<Product, CreateProductDto, UpdateProductDto> {
  protected mapRowToEntity(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      price: row.price,
    };
  }
  
  protected getInsertFields(): string[] {
    return ['name', 'price'];
  }
  
  protected getUpdateFields(): string[] {
    return ['name', 'price'];
  }
  
  protected validateCreateData(data: CreateProductDto): void {
    if (!data.name || data.price <= 0) {
      throw new Error('Invalid product data');
    }
  }
  
  protected validateUpdateData(data: UpdateProductDto): void {
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Invalid price');
    }
  }
}

// 3. Create Service
class ProductService extends GenericService<Product, CreateProductDto, UpdateProductDto> {
  // Add business logic methods
  async calculateDiscount(productId: string): Promise<number> {
    const product = await this.findById(productId);
    return product ? product.price * 0.1 : 0;
  }
}
```

#### 3. Adding API Endpoints
```typescript
// 1. Create Controller
class ProductController extends GenericController<Product, CreateProductDto, UpdateProductDto> {
  constructor(
    private productService: ProductService,
    private responseBuilder: ResponseBuilder
  ) {
    super();
  }

  // Override or extend generic methods
  async getProductsByCategory(req: Request, res: Response): Promise<void> {
    const { category } = req.query;
    const query = { filters: { category } };
    const result = await this.productService.findAll(query);
    res.json(this.responseBuilder.success(result));
  }
}

// 2. Add Routes
app.use('/api/products', productRouter);
```

## Architecture Patterns

### Generic DAO Pattern
- **Base Interface** - IGenericDAO<T, CreateDto, UpdateDto>
- **Abstract Base** - BaseDAO with common CRUD operations
- **Database Specific** - PostgreSQLDAO and SQLiteDAO implementations
- **Type Safety** - Full TypeScript generics support

### Generic Service Pattern
- **Business Logic** - Separated from data access
- **Transaction Support** - Automatic transaction management
- **Error Handling** - Consistent error patterns
- **Validation** - Data validation before persistence

### Generic API Client
- **Type Safety** - Generic request/response types
- **Authentication** - Automatic token management
- **Error Handling** - Centralized error processing
- **Interceptors** - Request/response transformation
- **Bulk Operations** - Efficient batch processing

## Security Considerations

### Authentication Security
- **JWT Secrets** - Environment-based configuration
- **Token Expiration** - Short access tokens (15m)
- **Refresh Tokens** - Long-lived refresh tokens (30d)
- **Password Hashing** - Bcrypt with 12 salt rounds
- **Session Management** - Secure session storage

### API Security
- **Input Validation** - Joi schemas for all endpoints
- **SQL Injection Prevention** - Parameterized queries
- **CORS Configuration** - Environment-based origins
- **Rate Limiting** - Configurable request limits
- **Request Logging** - Comprehensive audit trail

### Data Protection
- **Environment Variables** - No hardcoded secrets
- **HTTPS Ready** - Production SSL configuration
- **Database Security** - Connection encryption options
- **Error Sanitization** - No sensitive data in logs

## Performance Optimizations

### Database Performance
- **Connection Pooling** - PostgreSQL connection management
- **Query Optimization** - Indexed queries
- **Pagination** - Efficient large dataset handling
- **Transaction Management** - Optimized batch operations

### Frontend Performance
- **Code Splitting** - Dynamic imports for large apps
- **Debounced Validation** - Reduced API calls
- **Caching Strategy** - Response caching where appropriate
- **Bundle Optimization** - Tree shaking and minification

## Deployment Strategy

### Development
- **Local Development** - Hot reload with SQLite
- **Docker Development** - Containerized environment
- **Database Migrations** - Automatic schema updates

### Production
- **PostgreSQL Database** - Production-ready configuration
- **Environment Variables** - Secure configuration management
- **Process Management** - PM2 or similar process manager
- **Monitoring** - Health checks and logging
- **Scaling** - Load balancer ready architecture

## Customization for Business Domains

### E-commerce Applications
- Add Product, Order, Customer entities
- Implement payment processing
- Add inventory management
- Create shopping cart functionality

### SaaS Applications
- Multi-tenant architecture
- Subscription management
- Billing integration
- Team collaboration features

### Healthcare Applications
- User management and profiles
- Appointment scheduling systems
- Data management and analytics
- Compliance and reporting tools
- Team collaboration features

### Project Management Tools
- Task tracking and assignment
- Team management and roles
- Progress monitoring
- Resource allocation
- Timeline and milestone tracking

## Best Practices

### Code Organization
- **Separation of Concerns** - Clear layer boundaries
- **Dependency Injection** - Loose coupling patterns
- **Interface Segregation** - Specific, focused interfaces
- **Single Responsibility** - One purpose per class

### Type Safety
- **Strict TypeScript** - No any types in business logic
- **Generic Patterns** - Reusable type-safe patterns
- **Interface Contracts** - Clear API definitions
- **Error Types** - Comprehensive error handling

### Testing Strategy
- **Unit Tests** - Business logic testing
- **Integration Tests** - API endpoint testing
- **E2E Tests** - User journey testing
- **Database Tests** - Migration and schema testing

## Future Enhancements

### Advanced Features
- **GraphQL Support** - Alternative to REST APIs
- **Real-time Communication** - WebSocket integration
- **Microservices** - Service decomposition patterns
- **Event Sourcing** - Audit trail and replay
- **CQRS Pattern** - Command Query Separation

### Developer Tools
- **API Documentation** - OpenAPI/Swagger generation
- **Testing Utilities** - Enhanced test helpers
- **Performance Monitoring** - APM integration
- **Security Scanning** - Automated vulnerability scanning

---

This context provides AI assistants with comprehensive understanding of the premium starter kit architecture, patterns, and customization capabilities for building production-ready applications efficiently.
