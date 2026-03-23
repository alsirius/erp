# API Reference Documentation

## Overview

The Siriux API follows RESTful conventions with standardized request/response patterns, comprehensive error handling, and type-safe operations.

## Base URL

- **Development**: `http://localhost:3002`
- **Production**: `https://your-domain.com/api`

## Authentication

### JWT Token Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Types

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (30 days) for token renewal

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "user",
  "phone": "+1234567890",
  "department": "Engineering"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "status": "pending"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive tokens.

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [
      // Array of items
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "metadata": {
    "code": "ERROR_CODE",
    "details": {
      // Additional error details
    },
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

## Query Parameters

### Filtering
```http
GET /api/users?filters={"status":"active","role":"user"}
```

### Sorting
```http
GET /api/users?sort={"createdAt":"desc","name":"asc"}
```

### Pagination
```http
GET /api/users?page=1&limit=20
```

### Search
```http
GET /api/users?search={"query":"john","fields":["firstName","lastName","email"]}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_FAILED` | Request validation failed | 422 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `ALREADY_EXISTS` | Resource already exists | 409 |
| `INTERNAL_ERROR` | Server error | 500 |

## Generic CRUD Endpoints

All entities following the generic pattern support these endpoints:

### Create Entity
```http
POST /api/{entity}
```

### Get Entity by ID
```http
GET /api/{entity}/{id}
```

### List Entities
```http
GET /api/{entity}
```

### Update Entity
```http
PUT /api/{entity}/{id}
```

### Delete Entity
```http
DELETE /api/{entity}/{id}
```

### Bulk Operations

#### Bulk Create
```http
POST /api/{entity}/bulk
```

**Request Body**:
```json
{
  "items": [
    // Array of create DTOs
  ]
}
```

#### Bulk Update
```http
PUT /api/{entity}/bulk
```

**Request Body**:
```json
{
  "items": [
    {
      "id": "uuid",
      "data": {
        // Update DTO fields
      }
    }
  ]
}
```

#### Bulk Delete
```http
DELETE /api/{entity}/bulk
```

**Request Body**:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

## User Management API

### GET /api/users
List users with filtering and pagination.

**Query Parameters**:
- `filters`: JSON object with filter criteria
- `sort`: JSON object with sort fields
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example**:
```http
GET /api/users?filters={"status":"active"}&sort={"createdAt":"desc"}&page=1&limit=20
```

### GET /api/users/{id}
Get user by ID.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "status": "active",
    "department": "Engineering",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/users/{id}
Update user information.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "department": "Marketing"
}
```

### DELETE /api/users/{id}
Soft delete user (sets deleted flag).

## Health Check

### GET /api/health
Check API health status.

**Response**:
```json
{
  "success": true,
  "message": "Siriux Backend is running",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "environment": "development",
  "logLevel": "debug"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Window**: 15 minutes
- **Max Requests**: 100 per window per IP
- **Headers**: Rate limit info included in response headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## CORS Configuration

Cross-Origin Resource Sharing is configured for development:

```http
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Request Validation

All requests are validated using Joi schemas:

### Example Validation Schema
```javascript
const createUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  role: Joi.string().valid('user', 'manager', 'admin').default('user')
});
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "metadata": {
    "code": "VALIDATION_FAILED",
    "errors": [
      {
        "field": "email",
        "message": "Email is required",
        "code": "VALIDATION_ERROR",
        "value": ""
      }
    ],
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

## File Uploads

### POST /api/upload
Upload files to the server.

**Request**: `multipart/form-data`
- `file`: File to upload
- `category`: File category (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "filename": "document.pdf",
    "originalName": "my-document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "url": "/uploads/document.pdf"
  }
}
```

## Email Services

### POST /api/email/send
Send email using configured SMTP service.

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "text": "Plain text content",
  "html": "<p>HTML content</p>",
  "template": "welcome",
  "templateData": {
    "name": "John Doe",
    "company": "Acme Corp"
  }
}
```

## Database Operations

### GET /api/database/stats
Get database statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "tables": ["users", "products", "orders"],
    "users": 150,
    "products": 25,
    "orders": 500,
    "connections": 5
  }
}
```

### POST /api/database/migrate
Run database migrations.

**Response**:
```json
{
  "success": true,
  "data": {
    "migrations": [
      {
        "version": "001",
        "name": "create_users_table",
        "status": "completed"
      }
    ]
  }
}
```

## WebSocket Support

Real-time communication via WebSocket:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3002/ws');
```

### Authentication
```javascript
ws.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token'
}));
```

### Message Format
```json
{
  "type": "message_type",
  "data": {
    // Message payload
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { SiriuxAPI } from '@siriux/api-client';

const api = new SiriuxAPI('http://localhost:3002');

// Authentication
await api.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Create user
const user = await api.users.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'password'
});

// List users with pagination
const users = await api.users.findAll({
  pagination: { page: 1, limit: 10 },
  filters: { status: 'active' }
});
```

### Python
```python
from siriux_api import SiriuxClient

client = SiriuxClient('http://localhost:3002')

# Authentication
client.auth.login('user@example.com', 'password')

# Create user
user = client.users.create({
    'firstName': 'John',
    'lastName': 'Doe',
    'email': 'john.doe@example.com',
    'password': 'password'
})
```

## Testing

### Unit Testing API Endpoints
```typescript
import request from 'supertest';
import { app } from '../src/app';

describe('User API', () => {
  it('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      })
      .expect(201);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('john.doe@example.com');
  });
});
```

### Integration Testing
```typescript
describe('User Integration', () => {
  it('should complete user lifecycle', async () => {
    // Create user
    const createResponse = await request(app)
      .post('/api/users')
      .send(userData);
      
    const userId = createResponse.body.data.user.id;
    
    // Get user
    const getResponse = await request(app)
      .get(`/api/users/${userId}`)
      .expect(200);
      
    // Update user
    await request(app)
      .put(`/api/users/${userId}`)
      .send({ firstName: 'Jane' })
      .expect(200);
      
    // Delete user
    await request(app)
      .delete(`/api/users/${userId}`)
      .expect(200);
  });
});
```

## Monitoring and Logging

### Request Logging
All API requests are logged with:
- Method and endpoint
- Response status code
- Request duration
- User ID (if authenticated)
- IP address
- User agent

### Error Tracking
Errors are tracked with:
- Error stack trace
- Request context
- User information
- Timestamp

### Performance Metrics
- Response times
- Request counts
- Error rates
- Database query performance

## API Versioning

Current version: `v1`

Version is included in URL:
```http
GET /api/v1/users
```

Future versions will be:
```http
GET /api/v2/users
```

## Deprecation Policy

- **Notification**: 3 months before deprecation
- **Support**: 6 months overlap period
- **Migration**: Clear migration guides provided

This API reference provides comprehensive documentation for all available endpoints, request/response formats, and integration examples.
