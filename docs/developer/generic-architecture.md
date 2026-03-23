# Generic Architecture Implementation

## Overview

The Siriux project implements a comprehensive generic architecture pattern that enables rapid development while maintaining type safety, consistency, and scalability.

## Architecture Layers

### 1. Generic DAO Layer

**Purpose**: Abstract data access operations with database-agnostic functionality.

**Key Features**:
- Type-safe CRUD operations
- Multi-database support (PostgreSQL, SQLite)
- Bulk operations support
- Transaction management
- Full-text search capabilities
- JSON field handling

**Files**:
- `IGenericDAO.ts` - Core interface definitions
- `BaseDAO.ts` - Abstract base implementation
- `PostgreSQLDAO.ts` - PostgreSQL-specific implementation
- `SQLiteDAO.ts` - SQLite-specific implementation

#### Core Interface

```typescript
export interface IGenericDAO<T, CreateDto, UpdateDto> {
  // Basic CRUD
  findById(id: string): Promise<T | null>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<boolean>;
  
  // Query operations
  findAll(query?: QueryRequest): Promise<ListResponse<T>>;
  findOne(filters: Record<string, any>): Promise<T | null>;
  findMany(filters: Record<string, any>, options?: FindManyOptions): Promise<T[]>;
  
  // Bulk operations
  bulkCreate(items: CreateDto[]): Promise<T[]>;
  bulkUpdate(updates: Array<{ id: string; data: UpdateDto }>): Promise<T[]>;
  bulkDelete(ids: string[]): Promise<number>;
  
  // Utility
  count(filters?: Record<string, any>): Promise<number>;
  exists(id: string): Promise<boolean>;
  transaction<R>(operation: () => Promise<R>): Promise<R>;
}
```

#### Implementation Example

```typescript
export class ProductDAO extends PostgreSQLDAO<Product, CreateProductDto, UpdateProductDto> {
  // Required: Map database row to entity
  protected mapRowToEntity(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      price: row.price,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
  
  // Required: Define table creation SQL
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
  
  // Required: Specify insertable fields
  protected getInsertFields(): string[] {
    return ['name', 'price'];
  }
  
  // Required: Specify updatable fields
  protected getUpdateFields(): string[] {
    return ['name', 'price'];
  }
  
  // Required: Validate create data
  protected validateCreateData(data: CreateProductDto): void {
    if (!data.name) throw new Error('Name required');
    if (data.price <= 0) throw new Error('Price must be > 0');
  }
  
  // Required: Validate update data
  protected validateUpdateData(data: UpdateProductDto): void {
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Price must be > 0');
    }
  }
  
  // Optional: Generate unique ID
  protected generateId(): string {
    return this.generateUUID();
  }
}
```

### 2. Generic Service Layer

**Purpose**: Business logic abstraction with validation, authorization, and transaction support.

**Key Features**:
- Business logic hooks (before/after operations)
- Validation framework
- Authorization checks
- Error handling
- Transaction management
- Service response standardization

**File**: `GenericService.ts`

#### Core Service Pattern

```typescript
export abstract class GenericService<T, CreateDto, UpdateDto> {
  constructor(protected dao: IGenericDAO<T, CreateDto, UpdateDto>, protected entityName: string) {}
  
  // CRUD operations with business logic
  async create(data: CreateDto, context?: RequestContext): Promise<ServiceResponse<T>>
  async findById(id: string, context?: RequestContext): Promise<ServiceResponse<T>>
  async findAll(query: QueryRequest, context?: RequestContext): Promise<ServiceResponse<ListResponse<T>>>
  async update(id: string, data: UpdateDto, context?: RequestContext): Promise<ServiceResponse<T>>
  async delete(id: string, context?: RequestContext): Promise<ServiceResponse<boolean>>
  
  // Business logic hooks
  protected async beforeCreate(data: CreateDto, context?: RequestContext): Promise<ServiceResponse<any>>
  protected async afterCreate(entity: T, context?: RequestContext): Promise<void>
  protected async beforeUpdate(existing: T, data: UpdateDto, context?: RequestContext): Promise<ServiceResponse<any>>
  protected async afterUpdate(updated: T, original: T, context?: RequestContext): Promise<void>
  
  // Authorization hooks
  protected async canRead(entity: T, context?: RequestContext): Promise<ServiceResponse<any>>
  protected async canUpdate(entity: T, context?: RequestContext): Promise<ServiceResponse<any>>
  protected async canDelete(entity: T, context?: RequestContext): Promise<ServiceResponse<any>>
  
  // Validation (must implement)
  protected abstract validateCreateData(data: CreateDto, context?: RequestContext): Promise<ValidationResult>
  protected abstract validateUpdateData(data: UpdateDto, existing: T, context?: RequestContext): Promise<ValidationResult>
}
```

#### Service Implementation Example

```typescript
export class ProductService extends GenericService<Product, CreateProductDto, UpdateProductDto> {
  constructor(productDAO: ProductDAO) {
    super(productDAO, 'Product');
  }
  
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
        message: 'Price must be greater than 0',
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
        message: 'Price must be greater than 0',
        code: 'INVALID_VALUE'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Custom business logic
  async getProductsInPriceRange(min: number, max: number): Promise<ServiceResponse<Product[]>> {
    try {
      const result = await this.dao.findMany({
        price: { $between: [min, max] }
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return this.handleError(error, 'getProductsInPriceRange');
    }
  }
}
```

### 3. Generic Controller Layer

**Purpose**: REST API endpoints with standardized request/response handling.

**Key Features**:
- Standard REST endpoints
- Request validation middleware
- Response standardization
- Error handling
- Query parameter parsing
- Authentication/authorization middleware factories

**File**: `GenericController.ts`

#### Controller Pattern

```typescript
export abstract class GenericController<T, CreateDto, UpdateDto> {
  constructor(protected service: GenericService<T, CreateDto, UpdateDto>, protected entityName: string) {}
  
  // Standard REST endpoints
  async create(req: Request, res: Response, next: NextFunction): Promise<void>
  async getById(req: Request, res: Response, next: NextFunction): Promise<void>
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void>
  async update(req: Request, res: Response, next: NextFunction): Promise<void>
  async delete(req: Request, res: Response, next: NextFunction): Promise<void>
  
  // Bulk operations
  async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void>
  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void>
  async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void>
  
  // Utility endpoints
  async count(req: Request, res: Response, next: NextFunction): Promise<void>
  async search(req: Request, res: Response, next: NextFunction): Promise<void>
  
  // Middleware factories
  protected validateCreate(validationSchema: any)
  protected validateUpdate(validationSchema: any)
  protected requirePermission(permission: string)
  protected requireRole(role: string)
}
```

#### Controller Implementation Example

```typescript
export class ProductController extends GenericController<Product, CreateProductDto, UpdateProductDto> {
  constructor(productService: ProductService) {
    super(productService, 'Product');
  }
  
  // Custom endpoint
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
  
  // Route setup example
  static setupRoutes(productService: ProductService): Router {
    const controller = new ProductController(productService);
    const router = Router();
    
    // Standard CRUD routes
    router.post('/', controller.validateCreate(productValidationSchema), controller.create.bind(controller));
    router.get('/', controller.getAll.bind(controller));
    router.get('/:id', controller.getById.bind(controller));
    router.put('/:id', controller.validateUpdate(productValidationSchema), controller.update.bind(controller));
    router.delete('/:id', controller.delete.bind(controller));
    
    // Custom routes
    router.get('/category/:category', controller.getProductsByCategory.bind(controller));
    
    // Bulk operations
    router.post('/bulk', controller.bulkCreate.bind(controller));
    router.put('/bulk', controller.bulkUpdate.bind(controller));
    router.delete('/bulk', controller.bulkDelete.bind(controller));
    
    return router;
  }
}
```

## Type System

### Entity Types
```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  created_at: Date;
  updated_at: Date;
  deleted: number;
}
```

### DTO Types
```typescript
export interface CreateProductDto {
  name: string;
  price: number;
  category?: string;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  category?: string;
}
```

### API Types
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface QueryRequest {
  filters?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
  pagination?: {
    page?: number;
    limit?: number;
  };
  search?: {
    query?: string;
    fields?: string[];
  };
}
```

## Database Support

### PostgreSQL Features
- Connection pooling
- Full-text search (FTS)
- JSON field operations
- Advanced indexing
- Transaction support

### SQLite Features
- WAL mode for concurrency
- FTS5 virtual tables
- Built-in migration support
- Synchronous operations
- Performance optimizations

## Benefits

### 1. **Type Safety**
- End-to-end TypeScript coverage
- Generic type parameters ensure consistency
- Compile-time error detection

### 2. **Consistency**
- Standardized patterns across all entities
- Uniform API responses
- Consistent error handling

### 3. **Productivity**
- Rapid entity creation
- Boilerplate reduction
- Built-in best practices

### 4. **Maintainability**
- Clear separation of concerns
- Easy to extend and modify
- Comprehensive documentation

### 5. **Scalability**
- Database-agnostic design
- Performance optimizations
- Bulk operation support

## Best Practices

### 1. **Always extend base classes**
- Never bypass the generic layers
- Use provided hooks for custom logic

### 2. **Implement required methods**
- All abstract methods must be implemented
- Follow the established patterns

### 3. **Validate data properly**
- Use both DAO and service validation
- Provide meaningful error messages

### 4. **Handle errors consistently**
- Use ServiceResponse pattern
- Implement proper error logging

### 5. **Document custom logic**
- Add comments for business rules
- Update API documentation

## Migration Guide

### From Traditional Architecture

1. **Replace direct database access** with Generic DAO
2. **Move business logic** to Service layer
3. **Standardize API responses** with Generic Controller
4. **Add type definitions** for all entities
5. **Implement validation** at appropriate layers

### Example Migration

**Before**:
```typescript
// Direct database access
app.post('/products', async (req, res) => {
  const product = await db.query('INSERT INTO products SET ?', req.body);
  res.json(product);
});
```

**After**:
```typescript
// Generic architecture
class ProductDAO extends PostgreSQLDAO<Product, CreateProductDto, UpdateProductDto> { /* ... */ }
class ProductService extends GenericService<Product, CreateProductDto, UpdateProductDto> { /* ... */ }
class ProductController extends GenericController<Product, CreateProductDto, UpdateProductDto> { /* ... */ }

// Route setup
router.post('/', 
  controller.validateCreate(productValidationSchema), 
  controller.create.bind(controller)
);
```

This generic architecture provides a solid foundation for building scalable, maintainable web applications with consistent patterns and type safety throughout the stack.
