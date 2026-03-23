# Siriux Developer Documentation

## Overview

Siriux is a premium web application starter kit built with a generic, type-safe architecture that enables rapid development of enterprise-grade applications.

## Architecture

### Generic Pattern Architecture

The project follows a 3-tier generic architecture pattern:

1. **DAO Layer** - Data access with generic CRUD operations
2. **Service Layer** - Business logic with validation and authorization
3. **Controller Layer** - REST API endpoints with standardized responses

### Core Components

#### Generic DAO Pattern
- **Location**: `/backend/src/dao/generic/`
- **Files**: 
  - `IGenericDAO.ts` - Interface definitions
  - `BaseDAO.ts` - Abstract base implementation
  - `PostgreSQLDAO.ts` - PostgreSQL-specific implementation
  - `SQLiteDAO.ts` - SQLite-specific implementation

#### Generic Service Pattern
- **Location**: `/backend/src/services/generic/`
- **Files**:
  - `GenericService.ts` - Base service with business logic hooks

#### Generic Controller Pattern
- **Location**: `/backend/src/controllers/generic/`
- **Files**:
  - `GenericController.ts` - Base REST controller

## Implementation Guide

### Adding New Entities

1. **Define Types** in `/backend/src/types/index.ts`:
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

2. **Create DAO** extending the appropriate base class:
```typescript
export class ProductDAO extends PostgreSQLDAO<Product, CreateProductDto, UpdateProductDto> {
  protected mapRowToEntity(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      price: row.price,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
  
  protected getCreateTableSQL(): string {
    return `CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0
    )`;
  }
  
  protected getInsertFields(): string[] {
    return ['name', 'price'];
  }
  
  protected getUpdateFields(): string[] {
    return ['name', 'price'];
  }
  
  protected validateCreateData(data: CreateProductDto): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Product name is required');
    }
    if (data.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }
  }
  
  protected validateUpdateData(data: UpdateProductDto): void {
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }
  }
}
```

3. **Create Service** extending GenericService:
```typescript
export class ProductService extends GenericService<Product, CreateProductDto, UpdateProductDto> {
  protected async validateCreateData(data: CreateProductDto): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Product name is required',
        code: 'REQUIRED_FIELD'
      });
    }
    
    if (data.price <= 0) {
      errors.push({
        field: 'price',
        message: 'Product price must be greater than 0',
        code: 'INVALID_VALUE'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  protected async validateUpdateData(data: UpdateProductDto, existing: Product): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    if (data.price !== undefined && data.price <= 0) {
      errors.push({
        field: 'price',
        message: 'Product price must be greater than 0',
        code: 'INVALID_VALUE'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

4. **Create Controller** extending GenericController:
```typescript
export class ProductController extends GenericController<Product, CreateProductDto, UpdateProductDto> {
  constructor(productService: ProductService) {
    super(productService, 'Product');
  }
  
  // Add custom endpoints if needed
  async getProductsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = this.createRequestContext(req);
      const { category } = req.query;
      
      const result = await this.service.findAll({
        filters: { category }
      }, context);
      
      if (result.success && result.data) {
        const response = ResponseBuilder.successWithPagination(
          result.data.items,
          result.data.pagination
        );
        res.status(200).json(response);
      }
    } catch (error) {
      next(this.handleError(error, 'getProductsByCategory'));
    }
  }
}
```

## Database Support

### PostgreSQL (Production)
- Connection pooling with pg library
- Full-text search support
- JSON field handling
- Advanced query optimization

### SQLite (Development)
- better-sqlite3 for synchronous operations
- WAL mode for better concurrency
- FTS5 virtual table support
- Built-in migration system

## API Standards

### Response Format
All API responses use the standardized format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}
```

### Error Handling
Use the `ResponseBuilder` for consistent responses:

```typescript
// Success response
const response = ResponseBuilder.success(data);

// Success with pagination
const response = ResponseBuilder.successWithPagination(items, pagination);

// Error response
const response = ResponseBuilder.error(
  ApiErrorCode.NOT_FOUND,
  'Entity not found'
);

// Validation error
const response = ResponseBuilder.validationError(errors);
```

## Development Workflow

### Server Management
Always use the provided script:
```bash
./rebuild-servers.sh [mode] [environment] [target]
```

Modes:
- `1` or `restart` - Restart servers
- `2` or `rebuild` - Rebuild and restart
- `3` or `clean` - Full clean and rebuild

### Environment Configuration
- Development: `.env.development` files
- Production: `.env.production` files
- Backend: `/backend/.env.{environment}`
- Frontend: `/frontend/.env.{environment}`

## Security

### Authentication
- JWT tokens with refresh mechanism
- Role-based access control (RBAC)
- Secure session management

### Authorization
- Service-layer authorization checks
- Role and permission validation
- Resource-level access control

## Testing

### Unit Tests
Test service layer business logic:
```typescript
describe('ProductService', () => {
  it('should create product with valid data', async () => {
    const result = await productService.create(validProductData);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

### Integration Tests
Test API endpoints:
```typescript
describe('ProductController', () => {
  it('should create product via API', async () => {
    const response = await request(app)
      .post('/api/products')
      .send(validProductData)
      .expect(201);
      
    expect(response.body.success).toBe(true);
  });
});
```

## Performance Optimization

### Database
- Use appropriate indexes
- Implement pagination
- Optimize queries with EXPLAIN ANALYZE
- Use connection pooling

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

## Deployment

### Development
```bash
./rebuild-servers.sh 2 dev
```

### Production
```bash
./rebuild-servers.sh 2 prod
```

### Docker
```bash
docker-compose up -d
```

## AI Development Rules

All AI assistants must follow the rules in `.windsurf/rules.md`:

1. **Always reference AI_CONTEXT.md and ARCH.md first**
2. **Use generic patterns for all new entities**
3. **Update both developer and user documentation**
4. **Follow the established naming conventions**
5. **Use rebuild-servers.sh for development**

## Troubleshooting

### Common Issues

**Frontend import errors**: Check import paths - components are in `/src/components/` not `/src/app/components/`

**Database connection issues**: Verify environment files exist and have correct credentials

**Build failures**: Run `./rebuild-servers.sh 3 dev` for full clean rebuild

### Logs
- Backend: `tail -f /tmp/siriux-backend.log`
- Frontend: `tail -f /tmp/siriux-frontend.log`

## Contributing

1. Follow the AI workspace rules
2. Update documentation for all changes
3. Write tests for new functionality
4. Use the generic architecture patterns
5. Ensure type safety throughout
