# API Documentation

## Overview

The elice-next API follows RESTful principles with a focus on security, performance, and developer experience. All endpoints return standardized JSON responses with consistent error handling.

## Base Configuration

### API Structure
```
api/
├── auth/[type]/route.ts          # Authentication endpoints
├── admin/                        # Admin-only endpoints
│   ├── blog/route.ts            # Blog management
│   ├── users/route.ts           # User management
│   └── */route.ts               # Other admin resources
└── post/                        # Public blog endpoints
    ├── route.ts                 # Post listing/creation
    └── like/route.ts            # Post interactions
```

### Response Format
All API endpoints return a standardized response format:

```typescript
interface APIResult {
  success: boolean;
  message: string;
  data?: any;
  status?: number;
}

// Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "data": null,
  "status": 400
}
```

## Authentication API

### Base Endpoint: `/api/auth/[type]`

The authentication API uses dynamic routing with type-based handlers for different auth operations.

#### Supported Auth Types
- `login` - User login with email/password
- `register` - User registration
- `verify` - Email verification
- `logout` - User logout
- `refresh` - Token refresh
- `me` - Get current user info
- `resend` - Resend verification email
- `social` - Generic social login
- `kakao` - Kakao OAuth
- `google` - Google OAuth
- `naver` - Naver OAuth
- `apple` - Apple OAuth

#### Rate Limiting
- **Limit**: 30 requests per minute per IP
- **Headers**: Rate limit info in response headers
- **Behavior**: 429 status code when exceeded

### POST `/api/auth/login`

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response Headers:**
```
Authorization: Bearer <access_token>
Set-Cookie: token=<refresh_token>; HttpOnly; Secure; SameSite=Strict
Set-Cookie: fp=<fingerprint>; HttpOnly; Secure; SameSite=Strict
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "roles": ["user"]
    }
  }
}
```

**Error Responses:**
- `400` - Invalid credentials or missing fields
- `401` - Authentication failed
- `429` - Rate limit exceeded
- `500` - Server error

### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "name": "New User",
  "marketing": true,
  "terms": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "emailVerification": true,
    "email": "newuser@example.com"
  }
}
```

### GET `/api/auth/kakao?code={auth_code}`

Handle Kakao OAuth authentication.

**Query Parameters:**
- `code` (required) - Authorization code from Kakao OAuth

**Success Response (200):**
```json
{
  "success": true,
  "message": "Social login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@kakao.com",
      "name": "Kakao User",
      "imageUrl": "https://profile.image.url",
      "roles": ["user"]
    }
  }
}
```

### POST `/api/auth/refresh`

Refresh access token using refresh token from HTTP-only cookie.

**Request:** No body required (uses HTTP-only cookie)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {}
}
```

**Response Headers:**
```
Authorization: Bearer <new_access_token>
Set-Cookie: token=<new_refresh_token>; HttpOnly; Secure
```

### POST `/api/auth/logout`

Logout user and invalidate tokens.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {}
}
```

**Response Cookies:** All auth cookies cleared

## Admin API

### Base Authentication
All admin endpoints require:
- Valid JWT access token
- User role with admin permissions
- Rate limiting: 100 requests/minute

### GET `/api/admin/blog`

Get paginated list of blog posts for admin management.

**Query Parameters:**
```typescript
interface AdminBlogParams {
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 10)
  search?: string;      // Search in title/description
  category?: string;    // Filter by category ID
  status?: string;      // Filter by status (draft/published)
  type?: string;        // Filter by post type
  sortBy?: string;      // Sort field (default: createdTime)
  sortOrder?: 'asc' | 'desc'; // Sort direction (default: desc)
}
```

**Example Request:**
```
GET /api/admin/blog?page=1&limit=10&status=published&search=next.js
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Blog posts retrieved successfully",
  "data": {
    "posts": [
      {
        "uid": "post_id",
        "title": "Blog Post Title",
        "description": "Post description",
        "status": "published",
        "publishedAt": "2024-01-15T10:00:00Z",
        "likeCount": 15,
        "category": {
          "uid": "category_id",
          "name": "Technology",
          "slug": "tech"
        },
        "_count": {
          "likes": 15,
          "view": 150
        }
      }
    ],
    "totalCount": 45,
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### POST `/api/admin/blog`

Create a new blog post.

**Request Body:**
```json
{
  "type": "article",
  "title": "New Blog Post",
  "description": "Post description and content",
  "url": "new-blog-post",
  "images": ["image1.jpg", "image2.jpg"],
  "categoryId": "category_id",
  "status": "draft",
  "tags": ["nextjs", "react", "typescript"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Blog post created successfully",
  "data": {
    "uid": "new_post_id",
    "title": "New Blog Post",
    "status": "draft",
    "createdTime": "2024-01-15T10:00:00Z"
  }
}
```

### PUT `/api/admin/blog/[uid]`

Update an existing blog post.

**Path Parameters:**
- `uid` - Post ID to update

**Request Body:** Same as POST (all fields optional)

### DELETE `/api/admin/blog/[uid]`

Delete a blog post.

**Path Parameters:**
- `uid` - Post ID to delete

**Success Response (200):**
```json
{
  "success": true,
  "message": "Blog post deleted successfully",
  "data": {}
}
```

### GET `/api/admin/blog/stats`

Get blog statistics for admin dashboard.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Blog statistics retrieved",
  "data": {
    "total": 150,
    "published": 120,
    "draft": 30,
    "publishRate": 80,
    "totalViews": 15000,
    "totalLikes": 850,
    "todayViews": 245,
    "todayLikes": 12,
    "thisMonth": 25,
    "categories": [
      {
        "uid": "cat_1",
        "name": "Technology", 
        "_count": { "posts": 45 }
      }
    ],
    "typeStats": [
      { "type": "article", "count": 100 },
      { "type": "tutorial", "count": 50 }
    ]
  }
}
```

## Public Blog API

### GET `/api/post`

Get paginated list of published blog posts for public consumption.

**Query Parameters:**
```typescript
interface PublicBlogParams {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  search?: string;
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "posts": [
      {
        "uid": "post_id",
        "title": "Public Blog Post",
        "description": "Post description",
        "url": "blog-post-url",
        "images": ["image.jpg"],
        "publishedAt": "2024-01-15T10:00:00Z",
        "likeCount": 25,
        "category": {
          "name": "Technology",
          "slug": "tech"
        }
      }
    ],
    "totalCount": 120,
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 12
    }
  }
}
```

### POST `/api/post/like`

Toggle like status for a blog post (requires authentication).

**Request Body:**
```json
{
  "postId": "post_id_to_like"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Post like toggled",
  "data": {
    "liked": true,
    "likeCount": 26
  }
}
```

## Error Handling

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "Detailed error message",
  "data": null,
  "status": 400,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Security Features

### Authentication & Authorization
- **JWT Access Tokens**: 15-minute expiry, stored in memory
- **Refresh Tokens**: 7-day expiry, HTTP-only cookies
- **Role-Based Access**: Admin endpoints require proper roles
- **Device Fingerprinting**: Additional security layer

### Rate Limiting
- **API Endpoints**: 100 requests/minute (general)
- **Auth Endpoints**: 30 requests/minute
- **IP-based**: Per-IP address limiting
- **Headers**: Rate limit info in responses

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Request Validation
- **Zod Schemas**: Server-side validation
- **Input Sanitization**: XSS prevention
- **SQL Injection**: Prisma ORM protection
- **CSRF Protection**: SameSite cookies

## API Client Usage

### Client Configuration
```typescript
import { api } from '@/lib/fetch';

// Automatic token attachment
const response = await api.get('/api/admin/blog');

// With custom headers
const response = await api.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password'
}, {
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Error Handling
```typescript
try {
  const { data } = await api.get('/api/admin/blog');
  if (data.success) {
    // Handle success
    console.log(data.data.posts);
  }
} catch (error) {
  if (error.response?.status === 401) {
    // Handle authentication error
    router.push('/login');
  }
  console.error('API Error:', error.response?.data?.message);
}
```

## Development Tools

### API Testing
```bash
# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test admin endpoint with token
curl -X GET http://localhost:3000/api/admin/blog \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Database Inspection
```bash
# View database with Prisma Studio
npx prisma studio

# Check database schema
npx prisma db pull
```

This API documentation provides comprehensive coverage of all endpoints, authentication flows, and integration patterns used in elice-next. For implementation details, refer to the source code in the `/app/api/` directory.