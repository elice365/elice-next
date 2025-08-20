# API Reference - Elice Next

## 📋 Overview

RESTful API endpoints for the Elice Next application, organized by domain with consistent response patterns and authentication requirements.

### Base Response Format
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

---

## 🔐 Authentication Endpoints

### `POST /api/auth/login`
User login with email/password or social authentication.

**Request Body:**
```typescript
{
  email: string;
  password: string;
  type?: 'email' | 'social';
  provider?: 'google' | 'kakao' | 'naver' | 'apple';
  fingerprint?: string;
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    user: User;
    accessToken: string;
    expiresIn: number;
  }
}
```

### `POST /api/auth/register`
User registration with email verification.

**Request Body:**
```typescript
{
  email: string;
  password: string;
  name: string;
  fingerprint?: string;
}
```

### `POST /api/auth/logout`
Logout user and invalidate refresh token.

**Headers:** `Authorization: Bearer <token>`

### `POST /api/auth/refresh`
Refresh access token using HTTP-only cookie.

**Cookies:** `refreshToken`

### `POST /api/auth/verify`
Verify email address with token.

**Request Body:**
```typescript
{
  token: string;
  email: string;
}
```

---

## 📝 Blog Endpoints

### `GET /api/post`
Get paginated blog posts with filtering.

**Query Parameters:**
- `page?: number` - Page number (default: 1)
- `limit?: number` - Posts per page (default: 10)
- `category?: string` - Filter by category
- `tag?: string` - Filter by tag
- `search?: string` - Search query
- `status?: 'published' | 'draft'` - Post status

**Response:**
```typescript
{
  success: true;
  data: {
    posts: BlogPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    }
  }
}
```

### `GET /api/post/[uid]`
Get individual blog post by UID.

**Response:**
```typescript
{
  success: true;
  data: {
    post: BlogPost;
    related: BlogPost[];
  }
}
```

### `POST /api/post/like`
Toggle like status for a blog post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
{
  postId: string;
}
```

### `GET /api/post/categories`
Get all blog categories with post counts.

**Response:**
```typescript
{
  success: true;
  data: Category[];
}
```

---

## 🔍 Search Endpoints

### `GET /api/search`
Search across blog posts, users, and categories.

**Query Parameters:**
- `q: string` - Search query (required)
- `type?: 'posts' | 'users' | 'categories' | 'all'` - Search scope
- `limit?: number` - Results limit (default: 20)
- `page?: number` - Page number

**Response:**
```typescript
{
  success: true;
  data: {
    posts?: BlogPost[];
    users?: User[];
    categories?: Category[];
    total: number;
  }
}
```

---

## 🔔 Notification Endpoints

### `GET /api/notification`
Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page?: number` - Page number
- `limit?: number` - Notifications per page
- `unread?: boolean` - Filter unread notifications

### `POST /api/notification`
Create new notification.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```typescript
{
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: string; // If not provided, broadcast to all
}
```

---

## 📋 Notice Endpoints

### `GET /api/notice`
Get public notices and announcements.

**Query Parameters:**
- `page?: number` - Page number
- `limit?: number` - Notices per page
- `active?: boolean` - Filter active notices

**Response:**
```typescript
{
  success: true;
  data: {
    notices: Notice[];
    pagination: PaginationInfo;
  }
}
```

---

## 👑 Admin Endpoints

> **Authentication Required:** All admin endpoints require valid JWT with admin role.

### Blog Management

#### `GET /api/admin/blog`
Get all blog posts for admin management.

**Query Parameters:**
- `page?: number` - Page number
- `limit?: number` - Posts per page
- `status?: 'published' | 'draft' | 'archived'` - Filter by status
- `author?: string` - Filter by author ID

#### `POST /api/admin/blog`
Create new blog post.

**Request Body:**
```typescript
{
  title: string;
  content: string;
  excerpt?: string;
  categoryId: string;
  tags?: string[];
  status: 'published' | 'draft';
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
}
```

#### `GET /api/admin/blog/stats`
Get blog statistics.

**Response:**
```typescript
{
  success: true;
  data: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalLikes: number;
    postsThisMonth: number;
  }
}
```

#### `PUT /api/admin/blog/[uid]`
Update blog post.

#### `DELETE /api/admin/blog/[uid]`
Delete blog post.

#### `POST /api/admin/blog/upload-image`
Upload image for blog posts.

**Request:** `multipart/form-data` with image file

### User Management

#### `GET /api/admin/users`
Get all users for admin management.

**Query Parameters:**
- `page?: number` - Page number
- `limit?: number` - Users per page  
- `role?: string` - Filter by role
- `status?: 'active' | 'inactive' | 'banned'` - Filter by status

#### `GET /api/admin/users/stats`
Get user statistics.

**Response:**
```typescript
{
  success: true;
  data: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
  }
}
```

#### `PUT /api/admin/users/[id]/roles`
Update user roles.

**Request Body:**
```typescript
{
  roleIds: string[];
}
```

### Role Management

#### `GET /api/admin/roles`
Get all roles.

#### `POST /api/admin/roles`
Create new role.

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  permissions: string[];
}
```

#### `PUT /api/admin/roles/[id]`
Update role.

#### `DELETE /api/admin/roles/[id]`
Delete role.

### Session Management

#### `GET /api/admin/session`
Get all active sessions.

**Query Parameters:**
- `page?: number` - Page number
- `limit?: number` - Sessions per page
- `userId?: string` - Filter by user

#### `GET /api/admin/session/stats`
Get session statistics.

**Response:**
```typescript
{
  success: true;
  data: {
    totalSessions: number;
    activeSessions: number;
    sessionsToday: number;
    averageSessionDuration: number;
  }
}
```

#### `DELETE /api/admin/session/[id]`
Terminate specific session.

#### `POST /api/admin/sessions/cleanup`
Clean up expired sessions.

### Category Management

#### `GET /api/admin/category`
Get all categories for admin management.

#### `POST /api/admin/category`
Create new category.

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
}
```

#### `PUT /api/admin/category/[uid]`
Update category.

#### `DELETE /api/admin/category/[uid]`
Delete category.

#### `GET /api/admin/category/stats`
Get category statistics.

### Notification Management

#### `GET /api/admin/notification`
Get all notifications for admin management.

#### `POST /api/admin/notification`
Create new notification.

#### `PUT /api/admin/notification/[id]`
Update notification.

#### `DELETE /api/admin/notification/[id]`
Delete notification.

#### `GET /api/admin/notification/stats`
Get notification statistics.

### Route Management

#### `GET /api/admin/router`
Get route configuration.

#### `POST /api/admin/router`
Create new route.

**Request Body:**
```typescript
{
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: string;
  middleware?: string[];
  permissions?: string[];
}
```

#### `PUT /api/admin/router/[id]`
Update route.

#### `DELETE /api/admin/router/[id]`
Delete route.

---

## 📊 Response Codes

### Success Codes
- `200` - OK (successful GET, PUT requests)
- `201` - Created (successful POST requests)
- `204` - No Content (successful DELETE requests)

### Client Error Codes
- `400` - Bad Request (invalid request data)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity (validation errors)
- `429` - Too Many Requests (rate limit exceeded)

### Server Error Codes
- `500` - Internal Server Error (server error)
- `502` - Bad Gateway (upstream server error)
- `503` - Service Unavailable (server overloaded)

---

## 🔒 Authentication & Authorization

### JWT Token Structure
```typescript
{
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}
```

### Required Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Rate Limiting
- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute per IP
- **Admin endpoints**: 200 requests per minute per authenticated user

---

## 🚨 Error Handling

### Error Response Format
```typescript
{
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

### Common Error Codes
- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

---

## 📝 Example Usage

### JavaScript/TypeScript Client
```typescript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const { data } = await loginResponse.json();
const { accessToken } = data;

// Authenticated request
const postsResponse = await fetch('/api/admin/blog?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const posts = await postsResponse.json();
```

### cURL Examples
```bash
# Login
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get blog posts
curl -X GET "/api/post?page=1&limit=10"

# Admin request
curl -X GET /api/admin/users \
  -H "Authorization: Bearer your_token_here"
```

This API reference provides comprehensive documentation for all endpoints in the Elice Next application. For implementation details, refer to the corresponding route files in the `app/api/` directory.