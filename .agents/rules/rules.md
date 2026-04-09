---
trigger: always_on
---

# Siriux Project AI Workspace Rules

## Primary Directive: Always Reference AI Context

### AI Context Requirements
- **ALWAYS read `AI_CONTEXT.md` first** before starting any development task
- **ALWAYS reference `ARCH.md`** for architecture decisions and patterns
- **ALWAYS follow the tiered architecture** specified in the documentation
- **NEVER implement features without checking** the AI context for existing patterns
- **ALWAYS validate your approach** against the documented architecture principles

## Development Workflow

### Server Management
- **ALWAYS use `rebuild-servers.sh`** for running development frontend and backend
- **NEVER start servers individually** - use the provided rebuild script
- **ALWAYS run the rebuild script** from the project root directory
- **The script handles both frontend and backend** restart and rebuild
- **Use `./rebuild-servers.sh`** command to start development environment

### Documentation Requirements
- **ALWAYS update documentation** when implementing new features or code changes
- **TWO types of documentation must be maintained**:
  1. **Developer Reference** - Technical documentation about coding, implementation, and architecture
  2. **User Guide** - End-user documentation on how to use the product as a user persona
- **Developer Reference docs go in** `/docs/developer/` directory
- **User Guide docs go in** `/docs/user/` directory
- **Use Markdown format** for all documentation files
- **Include code examples** in developer documentation
- **Include screenshots and step-by-step instructions** in user guide documentation
- **Update table of contents** when adding new documentation files
- **Document all new API endpoints** with request/response examples
- **Document configuration options** and environment variables

## Architecture Principles

### Generic Pattern Usage
- **Always use the Generic DAO pattern** for new entities. Extend `PostgreSQLDAO` or `SQLiteDAO` instead of writing raw SQL.
- **Always use the Generic Service pattern** for business logic. Extend `GenericService` for all service classes.
- **Always use the Generic Controller pattern** for REST endpoints. Extend `GenericController` for all controllers.
- **Never bypass the generic layers** - controllers should only call services, services should only call DAOs.

### Type Safety Requirements
- **All entities must have TypeScript interfaces** in `/backend/src/types/index.ts`
- **All DTOs must be strongly typed** - use `CreateXxxDto` and `UpdateXxxDto` naming convention
- **Never use `any` type** in business logic, controllers, or services
- **All API responses must use the generic response types** from `/backend/src/types/api.ts`

### Database Layer Rules
- **All DAOs must extend the appropriate base class**: `PostgreSQLDAO` or `SQLiteDAO`
- **Always implement the required abstract methods**: `mapRowToEntity`, `getInsertFields`, `getUpdateFields`, `getCreateTableSQL`
- **Use parameterized queries only** - never concatenate SQL strings with user input
- **Always validate data in DAO layer** using `validateCreateData` and `validateUpdateData` methods
- **Use transactions for multi-entity operations** via the `transaction()` method

### Service Layer Rules
- **All services must extend `GenericService`** with proper typing
- **Implement validation hooks**: `validateCreateData` and `validateUpdateData`
- **Use business logic hooks** for pre/post operations (beforeCreate, afterCreate, etc.)
- **Always handle authorization** in service layer using `canRead`, `canUpdate`, `canDelete` methods
- **Return `ServiceResponse<T>` type** from all service methods
- **Never access the database directly** - always use DAOs

### Controller Layer Rules
- **All controllers must extend `GenericController`** with proper typing
- **Use the provided middleware factories** for validation and authorization
- **Always return standardized API responses** using `ResponseBuilder`
- **Handle errors properly** and pass to next() middleware
- **Extract query parameters using `buildQueryRequest()` method**
- **Create request context using `createRequestContext()` method**

## Code Organization

### File Structure Requirements
```
backend/src/
├── dao/
│   ├── generic/           # Generic DAO implementations (DO NOT MODIFY)
│   └── [entity]/          # Entity-specific DAO implementations
├── services/
│   ├── generic/           # Generic service implementations (DO NOT MODIFY)
│   └── [entity]/          # Entity-specific service implementations
├── controllers/
│   ├── generic/           # Generic controller implementations (DO NOT MODIFY)
│   └── [entity]/          # Entity-specific controller implementations
├── types/
│   ├── index.ts           # All entity types and DTOs
│   └── api.ts             # API response types (DO NOT MODIFY)
└── middleware/            # Express middleware
```

### Naming Conventions
- **Entities**: PascalCase (e.g., `User`, `Product`, `Order`)
- **DTOs**: `Create[Entity]Dto`, `Update[Entity]Dto` (e.g., `CreateUserDto`, `UpdateUserDto`)
- **DAOs**: `[Entity]DAO` (e.g., `UserDAO`, `ProductDAO`)
- **Services**: `[Entity]Service` (e.g., `UserService`, `ProductService`)
- **Controllers**: `[Entity]Controller` (e.g., `UserController`, `ProductController`)
- **Files**: kebab-case (e.g., `user-dao.ts`, `product-service.ts`)

## Implementation Guidelines

### Adding New Entities
1. **Define types** in `/backend/src/types/index.ts`:
   ```typescript
   export interface Product {
     id: string;
     name: string;
     price: number;
     created_at: Date;
     updated_at: Date;
   }
   
   export interface CreateProductDto {
     name: string;
     price: number;
   }
   
   export interface UpdateProductDto {
     name?: string;
     price?: number;
   }
   ```

2. **Create DAO** in `/backend/src/dao/product/`:
   ```typescript
   export class ProductDAO extends PostgreSQLDAO<Product, CreateProductDto, UpdateProductDto> {
     protected mapRowToEntity(row: any): Product { /* implementation */ }
     protected getCreateTableSQL(): string { /* implementation */ }
     // ... other required methods
   }
   ```

3. **Create Service** in `/backend/src/services/product/`:
   ```typescript
   export class ProductService extends GenericService<Product, CreateProductDto, UpdateProductDto> {
     protected async validateCreateData(data: CreateProductDto): Promise<ValidationResult> {
       // validation logic
     }
   }
   ```

4. **Create Controller** in `/backend/src/controllers/product/`:
   ```typescript
   export class ProductController extends GenericController<Product, CreateProductDto, UpdateProductDto> {
     // Custom endpoints if needed
   }
   ```

### Database Operations
- **Use the built-in query methods**: `findAll()`, `findById()`, `findOne()`, `findMany()`
- **Apply business filters** in service layer, not DAO layer
- **Use bulk operations** for multiple records: `bulkCreate()`, `bulkUpdate()`, `bulkDelete()`
- **Implement soft deletes** by setting `deleted = 1` instead of actual deletion

### Error Handling
- **Use the standardized error codes** from `ApiErrorCode` enum
- **Return proper HTTP status codes** using `ResponseBuilder`
- **Include validation errors** in response details
- **Log errors appropriately** but don't expose sensitive data

### Security Requirements
- **Always validate input** in both service and DAO layers
- **Use parameterized queries** to prevent SQL injection
- **Implement authorization checks** in service layer
- **Never expose internal errors** to clients
- **Use environment variables** for sensitive configuration

## Frontend Integration

### API Client Usage
- **Use the Generic API Client** pattern for frontend API calls
- **Type all API requests/responses** using the shared types
- **Handle authentication tokens** automatically
- **Implement proper error handling** for API responses

### Component Organization
- **Create components per entity** in `/frontend/src/components/[entity]/`
- **Use shared UI components** from `/frontend/src/components/ui/`
- **Implement proper loading states** and error handling
- **Follow React hooks patterns** for data fetching

## Development Workflow

### Code Quality
- **Run TypeScript compiler** before committing: `npm run build`
- **Use ESLint**: `npm run lint`
- **Write unit tests** for business logic
- **Test API endpoints** with proper validation

### Database Migrations
- **Create migration files** in `/backend/src/database/migrations/`
- **Test migrations** on development environment first
- **Backup production database** before applying migrations
- **Use transactional migrations** for complex changes

### Environment Configuration
- **Use `.env.example` files** for configuration templates
- **Never commit actual `.env` files**
- **Use different configs** for development, staging, and production
- **Validate required environment variables** on startup

## Testing Requirements

### Unit Tests
- **Test all service methods** with various scenarios
- **Mock DAO dependencies** in service tests
- **Test validation logic** thoroughly
- **Cover error cases** and edge cases

### Integration Tests
- **Test API endpoints** with realistic data
- **Test database operations** with actual database
- **Test authentication and authorization**
- **Test bulk operations** and transactions

### API Documentation
- **Document all endpoints** using OpenAPI/Swagger
- **Include request/response examples**
- **Document authentication requirements**
- **Keep documentation in sync** with code changes

## Performance Guidelines

### Database Optimization
- **Use appropriate indexes** for frequently queried fields
- **Implement pagination** for large result sets
- **Use database connections** efficiently (connection pooling)
- **Optimize queries** with EXPLAIN ANALYZE

### Caching Strategy
- **Cache frequently accessed data** in service layer
- **Use appropriate cache invalidation** strategies
- **Consider Redis** for distributed caching
- **Monitor cache hit rates**

### API Performance
- **Use compression** for API responses
- **Implement rate limiting** where appropriate
- **Monitor API response times**
- **Use async operations** for I/O bound tasks

## Security Best Practices

### Authentication
- **Use JWT tokens** with proper expiration
- **Implement refresh tokens** for extended sessions
- **Validate tokens** on every protected request
- **Use secure token storage** (httpOnly cookies)

### Authorization
- **Implement role-based access control** (RBAC)
- **Check permissions** at service layer
- **Use principle of least privilege**
- **Audit access** to sensitive resources

### Data Protection
- **Encrypt sensitive data** at rest
- **Use HTTPS** in production
- **Sanitize user input** properly
- **Implement CORS** correctly

## Deployment Guidelines

### Production Deployment
- **Use environment-specific configurations**
- **Implement health checks** for all services
- **Use proper logging** and monitoring
- **Implement graceful shutdown**

### Monitoring
- **Log all API requests** with correlation IDs
- **Monitor database performance**
- **Set up alerts** for critical errors
- **Track business metrics**

## Code Review Checklist

### Before Submitting Code
- [ ] **Read AI_CONTEXT.md and ARCH.md** first
- [ ] Follows generic architecture patterns
- [ ] All types are properly defined
- [ ] No `any` types in business logic
- [ ] Proper error handling implemented
- [ ] Tests written for new functionality
- [ ] **Documentation updated** (both Developer Reference and User Guide)
- [ ] Security considerations addressed
- [ ] Performance implications considered

### Review Focus Areas
- **AI Context compliance** - Does it follow documented patterns?
- **Architecture compliance** with generic patterns
- **Type safety** and interface consistency
- **Security vulnerabilities** and input validation
- **Performance implications** of database operations
- **Error handling** and user experience
- **Test coverage** and test quality
- **D