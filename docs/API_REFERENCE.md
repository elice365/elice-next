# API Reference

Complete API documentation for the elice-next application.

## Base URL
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

Refresh tokens are handled via HTTP-only cookies.

## 🔐 Authentication Endpoints

### POST /api/auth/login
User login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fingerprint": "device_fingerprint"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name"
    },
    "message": "Login successful"
  }
}
```

### POST /api/auth/register
User registration.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "fingerprint": "device_fingerprint"
}
```

### POST /api/auth/social
Social login (Kakao, Google, Naver, Apple).

**Request Body:**
```json
{
  "provider": "kakao",
  "code": "authorization_code",
  "fingerprint": "device_fingerprint"
}
```

### POST /api/auth/refresh
Refresh access token.

**Headers:**
```
Cookie: token=refresh_token
```

### POST /api/auth/verify
Email verification.

**Request Body:**
```json
{
  "token": "verification_token"
}
```

### POST /api/auth/logout
User logout.

**Headers:**
```
Authorization: Bearer <access_token>
```

## 📝 Blog Endpoints

### GET /api/post
Get blog posts with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Posts per page (default: 10)
- `category` (string): Filter by category
- `tag` (string): Filter by tag
- `search` (string): Search in title/description
- `sort` (string): Sort by 'latest', 'popular', 'trending'

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "uid": "post_id",
        "title": "Post Title",
        "description": "Post description",
        "url": "post-slug",
        "images": ["image1.jpg"],
        "status": "published",
        "publishedAt": "2024-01-01T00:00:00Z",
        "views": 100,
        "likeCount": 25,
        "category": {
          "name": "Category Name",
          "slug": "category-slug"
        },
        "tags": [
          {
            "name": "Tag Name"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalCount": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### POST /api/post
Create a new blog post (Admin only).

**Request Body:**
```json
{
  "type": "blog",
  "title": "Post Title",
  "description": "Post description",
  "url": "post-slug",
  "images": ["image1.jpg"],
  "categoryId": "category_id",
  "status": "draft"
}
```

### GET /api/post/categories
Get all blog categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uid": "category_id",
      "code": "tech",
      "name": "Technology",
      "slug": "technology",
      "path": "/tech",
      "level": 1,
      "children": []
    }
  ]
}
```

### POST /api/post/like
Like or unlike a blog post.

**Request Body:**
```json
{
  "postId": "post_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likeCount": 26
  }
}
```

## 🔔 Notification Endpoints

### GET /api/notification
Get user notifications.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Notifications per page
- `read` (boolean): Filter by read status

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "uid": "notification_id",
        "category": "system",
        "title": "Notification Title",
        "content": "Notification content",
        "link": "/link",
        "read": false,
        "createdTime": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50
    }
  }
}
```

### POST /api/notification
Mark notification as read.

**Request Body:**
```json
{
  "notificationId": "notification_id"
}
```

## 🔍 Search Endpoints

### GET /api/search
Search across blog posts.

**Query Parameters:**
- `q` (string): Search query
- `type` (string): Search type ('posts', 'categories', 'tags')
- `limit` (number): Results limit

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [],
    "categories": [],
    "tags": [],
    "totalCount": 10
  }
}
```

## 🛠️ Admin Endpoints

### GET /api/admin/users
Get all users (Admin only).

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Users per page
- `search` (string): Search by email/name
- `role` (string): Filter by role
- `status` (string): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "email": "user@example.com",
        "name": "User Name",
        "status": "active",
        "lastLoginTime": "2024-01-01T00:00:00Z",
        "createdTime": "2024-01-01T00:00:00Z",
        "userRoles": [
          {
            "role": {
              "name": "user"
            }
          }
        ],
        "_count": {
          "sessions": 2,
          "notifications": 5
        }
      }
    ],
    "pagination": {},
    "stats": {
      "totalUsers": 1000,
      "activeUsers": 800,
      "newThisMonth": 50
    }
  }
}
```

### POST /api/admin/users
Create a new user (Admin only).

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123",
  "roles": ["user"]
}
```

### PUT /api/admin/users/[id]
Update user (Admin only).

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "active",
  "roles": ["user", "moderator"]
}
```

### DELETE /api/admin/users/[id]
Delete user (Admin only).

### GET /api/admin/blog
Get all blog posts (Admin only).

**Query Parameters:**
- `page`, `limit`, `search`, `status`, `category`

### POST /api/admin/blog
Create blog post (Admin only).

### PUT /api/admin/blog/[uid]
Update blog post (Admin only).

### DELETE /api/admin/blog/[uid]
Delete blog post (Admin only).

### POST /api/admin/blog/upload-image
Upload blog image (Admin only).

**Request Body:** FormData with image file

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://cdn.example.com/image.jpg",
    "imageId": "image_id"
  }
}
```

### GET /api/admin/category
Get all categories (Admin only).

### POST /api/admin/category
Create category (Admin only).

**Request Body:**
```json
{
  "code": "tech",
  "name": "Technology",
  "slug": "technology",
  "parentId": "parent_category_id"
}
```

### GET /api/admin/sessions
Get all user sessions (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "session_id",
        "userId": "user_id",
        "deviceInfo": "Device info",
        "ipAddress": "192.168.1.1",
        "active": true,
        "lastActivityTime": "2024-01-01T00:00:00Z",
        "user": {
          "email": "user@example.com"
        }
      }
    ],
    "stats": {
      "totalSessions": 500,
      "activeSessions": 300
    }
  }
}
```

### DELETE /api/admin/sessions/[id]
Terminate session (Admin only).

### POST /api/admin/sessions/cleanup
Clean up expired sessions (Admin only).

### GET /api/admin/notification
Get all notifications (Admin only).

### POST /api/admin/notification
Create system notification (Admin only).

**Request Body:**
```json
{
  "category": "system",
  "title": "System Maintenance",
  "content": "Scheduled maintenance notification",
  "link": "/maintenance",
  "userIds": ["user1", "user2"] // Optional: specific users
}
```

## 📊 Statistics Endpoints

### GET /api/admin/users/stats
Get user statistics (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "activeUsers": 800,
    "newUsersThisMonth": 50,
    "verifiedUsers": 750,
    "userGrowth": [
      {
        "date": "2024-01-01",
        "count": 900
      }
    ]
  }
}
```

### GET /api/admin/blog/stats
Get blog statistics (Admin only).

### GET /api/admin/sessions/stats
Get session statistics (Admin only).

### GET /api/admin/notification/stats
Get notification statistics (Admin only).

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `RATE_LIMIT` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

API endpoints are rate-limited:
- **Default**: 100 requests per minute
- **Authentication**: 10 requests per minute
- **Admin endpoints**: 200 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Response Format

All API responses follow this format:

```json
{
  "success": true | false,
  "data": {}, // Present on success
  "error": "Error message", // Present on error
  "pagination": {}, // Present for paginated results
  "meta": {} // Additional metadata
}
```