# Siriux Premium WebApp Starter Kit 🚀

A comprehensive, production-ready web application starter kit designed for rapid development of enterprise-grade applications. Perfect for SaaS, e-commerce, healthcare, education, or any web application project.

## ✨ Features

- 🔐 **Complete Authentication** - JWT with refresh tokens, role-based access control
- 👥 **User Management** - Registration, profiles, permissions, and admin dashboard
- 🗄️ **Database Ready** - PostgreSQL (production) + SQLite (development) with migrations
- 🏗️ **Generic Architecture** - Reusable DAO, service, and controller patterns
- ⚛️ **Modern Frontend** - React with TypeScript, Tailwind CSS, and generic API client
- 🔧 **Developer Experience** - Hot reload, comprehensive logging, error handling
- 📱 **Responsive Design** - Mobile-friendly UI components
- 🚀 **Production Ready** - Environment configuration, security best practices
- 📚 **Well Documented** - Complete setup and customization guides

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware stack
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT with refresh tokens and bcrypt
- **Validation**: Joi schemas with custom validators
- **Email**: Nodemailer with SMTP support
- **Logging**: Winston with structured logging

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **State**: Context API with custom hooks
- **HTTP Client**: Generic API client with interceptors
- **Forms**: React Hook Form with debounced validation
- **Routing**: React Router with protected routes

### Development Tools
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest with test utilities
- **Build**: Optimized bundling with hot reload
- **Environment**: Multi-environment configuration

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Clone the starter
git clone https://github.com/alsirius/siriux.git my-webapp
cd my-webapp

# Setup environment
cp .env.postgres.example .env
# Edit .env with your configuration

# Install dependencies
npm run setup

# Start development
npm run dev
```

### 2. What You Get
- ✅ **Backend API** running on `http://localhost:3002`
- ✅ **Frontend App** running on `http://localhost:3000`
- ✅ **Database** automatically created and migrated
- ✅ **Authentication** complete with JWT tokens
- ✅ **User Management** ready with role-based permissions
- ✅ **API Documentation** with generic patterns

## 📁 Project Structure

```
my-webapp/
├── 📁 backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Generic CRUD controllers
│   │   ├── services/        # Business logic layer
│   │   ├── dao/            # Data access objects
│   │   ├── middleware/      # Auth, logging, validation
│   │   ├── database/        # Database managers
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── tsconfig.json
├── 📁 frontend/               # React/TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client and services
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── tsconfig.json
├── 📁 docs/                  # Documentation
├── 📋 .env.postgres.example   # PostgreSQL configuration
├── 📋 .env.sqlite.example     # SQLite configuration
├── 📋 AI_CONTEXT.md          # AI development context
├── 📋 ARCHITECTURE.md         # Technical architecture
└── 📋 README.md               # This file
```

## 🏗️ Generic Architecture Patterns

### Adding New Entities
```typescript
// 1. Define your type
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

// 2. Create DAO (extends GenericDAO)
class ProductDAO extends PostgreSQLDAO<Product, CreateProductDto, UpdateProductDto> {
  protected mapRowToEntity(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      price: row.price,
      category: row.category,
    };
  }
  
  protected getInsertFields(): string[] {
    return ['name', 'price', 'category'];
  }
  
  protected validateCreateData(data: CreateProductDto): void {
    if (!data.name || data.price <= 0) {
      throw new Error('Name and price are required');
    }
  }
}

// 3. Create Service (extends GenericService)
class ProductService extends GenericService<Product, CreateProductDto, UpdateProductDto> {
  // Add your business logic here
  async getProductsByCategory(category: string): Promise<ListResponse<Product>> {
    return this.findAll({ filters: { category } });
  }
}

// 4. Create Controller (extends GenericController)
class ProductController extends GenericController<Product, CreateProductDto, UpdateProductDto> {
  // Add your custom endpoints here
}
```

## 🔧 Customization Guide

### Database Configuration
```bash
# PostgreSQL (Production)
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# SQLite (Development)
DATABASE_URL=sqlite:./data/app.db
```

### Adding Your Business Logic
1. **Define Types** - Create interfaces for your entities
2. **Implement DAOs** - Extend GenericDAO for data access
3. **Create Services** - Extend GenericService for business logic
4. **Build Controllers** - Extend GenericController for API endpoints
5. **Add Frontend** - Use GenericApiClient for API calls

## 🎯 Perfect For Building

### 🏢 **SaaS Applications**
- Multi-tenant architecture support
- Subscription management patterns
- Team collaboration features
- Billing integration ready

### 🛒 **E-commerce Platforms**
- Product and inventory management
- Order processing systems
- Customer management tools
- Shopping cart functionality

### 🏥 **Healthcare Applications**
- User and patient management
- Appointment scheduling systems
- Data analytics and reporting
- Compliance and audit trails

### 📚 **Educational Platforms**
- Course and content management
- Student enrollment systems
- Progress tracking tools
- Assessment and grading

### 💼 **Project Management Tools**
- Task and project tracking
- Team collaboration features
- Resource management
- Timeline and milestone tracking

### 🎨 **Creative Portfolios**
- Gallery and portfolio management
- Media upload and processing
- Contact and inquiry forms
- Blog and content management

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-Based Access** - Flexible permission system
- **Input Validation** - Comprehensive data validation
- **SQL Injection Prevention** - Parameterized queries
- **CORS Protection** - Configurable origins
- **Rate Limiting** - Request throttling
- **Session Management** - Secure session handling

## 🚀 Deployment Options

### Development
```bash
npm run dev          # Start both frontend and backend
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only
```

### Production
```bash
npm run build        # Build for production
npm run start        # Start production servers
```

### Docker
```bash
docker-compose up    # Development with Docker
docker-compose up -d # Production with Docker
```

## 📚 Documentation

- **[AI_CONTEXT.md](./AI_CONTEXT.md)** - AI development context and patterns
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design
- **[API Documentation](./docs/api.md)** - Backend API reference
- **[Frontend Guide](./docs/frontend.md)** - React components and usage

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Attribution

Built with ❤️ by the [Alsirius](https://alsirius.co.uk) team.

---

🚀 **Ready to build your next web application? Clone this starter and start coding!**
