# 📡 API Catalog - Elice-Next

## API Overview

Base URL: `https://api.elice.io` (Production) | `http://localhost:3000` (Development)

### API Standards
- **Format**: RESTful JSON API
- **Authentication**: Bearer token (JWT)
- **Rate Limiting**: 100 requests/minute per IP
- **Versioning**: URL path versioning (currently v1 implied)
- **Response Format**: Consistent JSON structure

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-08-09T12:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... },
  "timestamp": "2024-08-09T12:00:00Z"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔐 Authentication APIs

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "terms": true,
  "marketing": false
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "message": "Registration successful. Please verify your email."
  }
}
```

### Social Login
```http
POST /api/auth/social
Content-Type: application/json

{
  "provider": "google|kakao|naver|apple",
  "accessToken": "provider_token",
  "profile": {
    "id": "provider_user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "isNewUser": false
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Cookie: token=refresh_token_here

Response: 200 OK
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Email Verification
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token"
}

Response: 200 OK
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Password Reset Request
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Password Reset Confirm
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "NewSecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset successful"
}
```

## 👤 User APIs

### Get Current User
```http
GET /api/user/me
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "profileImage": "https://...",
    "roles": ["USER"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "bio": "Software Developer",
  "profileImage": "https://..."
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### Change Password
```http
POST /api/user/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Password changed successfully"
}
```

## 📝 Blog APIs

### List Posts
```http
GET /api/post?page=1&limit=10&category=tech&sortBy=date&order=desc
Authorization: Optional

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "uid": "post_id",
      "title": "Post Title",
      "content": "Post content...",
      "category": "tech",
      "tags": ["javascript", "react"],
      "author": { "name": "John Doe" },
      "views": 100,
      "likes": 10,
      "createdAt": "2024-08-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Post
```http
GET /api/post/{uid}
Authorization: Optional

Response: 200 OK
{
  "success": true,
  "data": {
    "uid": "post_id",
    "title": "Post Title",
    "content": "Full post content...",
    "category": { "id": "1", "name": "Technology" },
    "tags": ["javascript", "react"],
    "author": {
      "id": "author_id",
      "name": "John Doe",
      "profileImage": "https://..."
    },
    "views": 100,
    "likes": 10,
    "comments": [ ... ],
    "createdAt": "2024-08-01T00:00:00Z",
    "updatedAt": "2024-08-02T00:00:00Z"
  }
}
```

### Like/Unlike Post
```http
POST /api/post/like
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "postId": "post_id"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 11
  }
}
```

### Search Posts
```http
POST /api/search
Content-Type: application/json

{
  "query": "javascript",
  "type": "posts",
  "filters": {
    "category": "tech",
    "dateRange": "month"
  },
  "page": 1,
  "limit": 10
}

Response: 200 OK
{
  "success": true,
  "data": {
    "posts": [ ... ],
    "total": 25,
    "suggestions": ["javascript tutorial", "javascript frameworks"]
  }
}
```

## 🔧 Admin APIs

### List Users (Admin)
```http
GET /api/admin/user?page=1&limit=20&role=USER&status=active
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["USER"],
      "status": "active",
      "lastLogin": "2024-08-08T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Update User (Admin)
```http
PUT /api/admin/user/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "suspended",
  "roles": ["USER", "MODERATOR"]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### Delete User (Admin)
```http
DELETE /api/admin/user/{id}
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Create Blog Post (Admin)
```http
POST /api/admin/blog
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "New Post",
  "content": "Post content...",
  "category": "tech",
  "tags": ["javascript", "tutorial"],
  "status": "draft",
  "publishAt": "2024-08-10T00:00:00Z"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "post": { ... }
  }
}
```

### Update Blog Post (Admin)
```http
PUT /api/admin/blog/{uid}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "published"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "post": { ... }
  }
}
```

### Delete Blog Post (Admin)
```http
DELETE /api/admin/blog/{uid}
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### Manage Categories (Admin)
```http
GET /api/admin/category
POST /api/admin/category
PUT /api/admin/category/{id}
DELETE /api/admin/category/{id}
Authorization: Bearer {admin_token}
```

### Manage Roles (Admin)
```http
GET /api/admin/role
POST /api/admin/role
PUT /api/admin/role/{id}
DELETE /api/admin/role/{id}
Authorization: Bearer {admin_token}
```

### Send Notifications (Admin)
```http
POST /api/admin/notification
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "type": "announcement",
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Sunday",
  "targetUsers": ["all"] // or specific user IDs
}

Response: 200 OK
{
  "success": true,
  "data": {
    "notificationId": "notif_id",
    "sentCount": 150
  }
}
```

## 📊 Analytics APIs

### Get Analytics (Admin)
```http
GET /api/admin/analytics?period=week
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "new": 50,
      "active": 300
    },
    "posts": {
      "total": 500,
      "published": 450,
      "draft": 50
    },
    "engagement": {
      "views": 10000,
      "likes": 500,
      "comments": 200
    }
  }
}
```

## 🔔 Notification APIs

### Get Notifications
```http
GET /api/notification?unread=true&limit=10
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "notif_id",
      "type": "comment",
      "title": "New comment",
      "message": "Someone commented on your post",
      "data": { "postId": "post_id" },
      "isRead": false,
      "createdAt": "2024-08-09T10:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

### Mark as Read
```http
PUT /api/notification/read
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "notificationIds": ["notif_id1", "notif_id2"]
}

Response: 200 OK
{
  "success": true,
  "message": "Notifications marked as read"
}
```

## 🔍 Search & Filter APIs

### Global Search
```http
GET /api/search?q=javascript&type=all
Authorization: Optional

Response: 200 OK
{
  "success": true,
  "data": {
    "posts": [ ... ],
    "users": [ ... ],
    "tags": [ ... ],
    "categories": [ ... ]
  }
}
```

### Get Categories
```http
GET /api/category

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Technology",
      "slug": "tech",
      "postCount": 150
    }
  ]
}
```

### Get Popular Tags
```http
GET /api/tags/popular?limit=10

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "name": "javascript",
      "count": 50
    }
  ]
}
```

## 📤 File Upload APIs

### Upload Image
```http
POST /api/upload/image
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

FormData:
- file: [image file]
- type: "profile|post|asset"

Response: 200 OK
{
  "success": true,
  "data": {
    "url": "https://cdn.elice.io/images/...",
    "size": 102400,
    "type": "image/jpeg"
  }
}
```

## 🔒 Security Headers

All API responses include these security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

## 📈 Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1691582400
```

Rate limit exceeded response:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

## 🔗 WebSocket Events

### Connection
```javascript
ws://localhost:3000/ws
Authorization: Bearer {access_token}
```

### Events
```javascript
// Server -> Client
{
  "event": "notification",
  "data": { ... }
}

{
  "event": "post_update",
  "data": { "postId": "...", "likes": 11 }
}

// Client -> Server
{
  "event": "subscribe",
  "channel": "post_updates",
  "data": { "postId": "..." }
}
```

## 🧪 Testing Endpoints

### Health Check
```http
GET /api/health

Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2024-08-09T12:00:00Z",
  "version": "0.1.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "s3": "connected"
  }
}
```

### API Version
```http
GET /api/version

Response: 200 OK
{
  "version": "0.1.0",
  "api": "v1",
  "build": "2024.08.09"
}
```

## 📝 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

## 🔧 API Client Examples

### JavaScript/TypeScript
```typescript
const apiClient = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Example usage
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};
```

### cURL Examples
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get posts with auth
curl http://localhost:3000/api/post \
  -H "Authorization: Bearer YOUR_TOKEN"

# Upload image
curl -X POST http://localhost:3000/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "type=post"
```

---

*This API catalog provides a comprehensive reference for all available endpoints in the elice-next application. For implementation details and integration guides, refer to the API documentation.*