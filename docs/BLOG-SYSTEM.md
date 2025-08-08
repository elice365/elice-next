# 📝 Blog System Architecture Documentation

*Version: 1.0.0*  
*Last Updated: 2025-01-08*  
*Author: Claude Code Assistant*

---

## 🎯 Overview

The blog system is a comprehensive, enterprise-grade content management solution built with Next.js 15.4.3, featuring multi-language support, CDN integration, and advanced analytics.

### Key Features
- 🌍 **Multi-language Support**: Korean, English, Japanese, Russian
- 📊 **Analytics**: Real-time view tracking, engagement metrics
- 🚀 **CDN Integration**: Content served from `cdn.elice.pro`
- 🔐 **Role-based Access**: Admin/Editor permissions
- 💾 **R2 Storage**: Cloudflare R2 for images and media
- ⚡ **Performance**: Optimized with caching and pagination

---

## 📁 System Architecture

### API Routes Structure

#### Admin Blog Management (`/api/admin/blog/`)

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/admin/blog/route.ts` | GET | List blog posts with filters | Admin/Editor |
| | POST | Create new blog post | Admin/Editor |
| | PUT | Update existing post | Admin/Editor |
| | DELETE | Bulk delete posts | Admin |
| `/api/admin/blog/[uid]/route.ts` | GET | Get single post details | Admin/Editor |
| | PUT | Update single post | Admin/Editor |
| | DELETE | Delete single post | Admin |
| `/api/admin/blog/[uid]/content/route.ts` | GET | Get post content by language | Admin/Editor |
| | PUT | Update post content | Admin/Editor |
| | DELETE | Delete language version | Admin |
| `/api/admin/blog/[uid]/images/route.ts` | GET | List post images | Admin/Editor |
| | POST | Upload new images | Admin/Editor |
| `/api/admin/blog/[uid]/images/[imageId]/route.ts` | DELETE | Delete specific image | Admin/Editor |
| `/api/admin/blog/[uid]/likes/route.ts` | GET | Get like statistics | Admin/Editor |
| `/api/admin/blog/[uid]/status/route.ts` | PUT | Update post status | Admin/Editor |
| `/api/admin/blog/[uid]/views/route.ts` | GET | Get view analytics | Admin/Editor |
| `/api/admin/blog/stats/route.ts` | GET | Comprehensive blog statistics | Admin |
| `/api/admin/blog/upload-image/route.ts` | POST | Upload image to R2 | Admin/Editor |

#### Public Blog API (`/api/post/`)

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/post/route.ts` | POST | Type-based routing system | No |
| | | `type: 'list'` - Get paginated posts | |
| | | `type: 'post'` - Get single post | |
| | | `type: 'notice'` - Get notices | |
| | GET | Query-based routing | No |
| | | `?type=categories` - Get categories | |
| | | `?type=tags` - Get tags | |
| `/api/post/like/route.ts` | POST | Like/unlike post | Yes |
| `/api/post/categories/route.ts` | GET | Get all categories | No |

---

## 🧩 Component Structure

### Main Components

```typescript
components/features/blog/
├── Card.tsx              // Blog card component (re-exports from card/)
├── Display.tsx           // Card/list view toggle display
├── Post.tsx              // Individual post detail page
├── Header.tsx            // Blog header with search
├── Content.tsx           // Content renderer
├── Actions.tsx           // Like, share, bookmark actions
├── Comment.tsx           // Comment system
├── Related.tsx           // Related posts
├── Filters.tsx           // Category/tag filters
├── Gallery.tsx           // Image gallery
├── List.tsx              // List view component
└── SellerInfo.tsx        // Author information
```

### Modular Components

```typescript
components/features/blog/card/
├── index.tsx             // Main card export
├── CardContent.tsx       // Content rendering logic
├── CardImage.tsx         // Image handling with fallbacks
├── CardActions.tsx       // Interactive action buttons
├── CardEffects.tsx       // Animations and hover effects
└── useCardState.tsx      // State management hook

components/features/blog/content/
├── PrimarySection.tsx    // Primary content sections
└── AccentSection.tsx     // Accent/highlight sections

components/features/blog/list/
├── ListItemContent.tsx   // List item content
├── ListItemImage.tsx     // List item image
└── ListItemMeta.tsx      // List item metadata
```

---

## 📝 Type System

### Core Type Files

#### `types/blog.ts` (420 lines)

```typescript
// Core Blog Types
export interface BlogPost extends Post {
  author?: User;
  category?: BlogCategory;
  tags?: BlogTag[];
  content?: PostContent;
  _count?: {
    comments: number;
    likes: number;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

// API Response Types
export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Component Props
export interface BlogCardProps {
  post: BlogPost;
  layout?: 'card' | 'list';
  showActions?: boolean;
  onLike?: (postId: string) => void;
  onShare?: (post: BlogPost) => void;
  className?: string;
}

// State Management
export interface BlogState {
  posts: BlogPost[];
  currentPost: BlogPost | null;
  filters: BlogFilterState;
  pagination: BlogPaginationState;
  layout: BlogLayoutOption;
  isLoading: boolean;
  error: string | null;
}
```

#### `types/adminBlog.ts` (31 lines)

```typescript
export interface BlogContent {
  product: ProductItem[];
  author: AuthorInfo;
  content: ContentSection[];
}

export interface ProductItem {
  url: string;
  tag: string[];
  title: string;
  description: string;
}

export interface BlogImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
}
```

---

## 💾 Database Layer

### `lib/db/blog.ts` (630 lines)

#### Key Functions

```typescript
// Post Management
export async function createBlogPost(data: Prisma.PostCreateInput)
export async function updateBlogPost(uid: string, data: Prisma.PostUpdateInput)
export async function deleteBlogPost(uid: string)
export async function deleteBulkBlogPosts(uids: string[])

// Query Functions
export async function findBlogPosts(params: BlogQueryParams)
export async function getPostById(uid: string)
export async function getAdminBlogPosts(params: AdminBlogParams)

// Statistics
export async function getBlogStats(): Promise<BlogStats>
export async function getPostAnalytics(postId: string)

// Engagement
export async function togglePostLike(postId: string, userId: string)
export async function incrementPostView(postId: string, viewerId: string)

// Categories
export async function getAllCategories()
export async function createCategory(data: CategoryCreateInput)
```

### Database Schema

```prisma
model Post {
  id          String    @id @default(cuid())
  uid         String    @unique
  title       String
  slug        String    @unique
  excerpt     String?
  content     Json?
  thumbnail   String?
  images      String[]
  
  isDraft     Boolean   @default(true)
  publishedAt DateTime?
  
  viewCount   Int       @default(0)
  likeCount   Int       @default(0)
  
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  
  tags        Tag[]
  comments    Comment[]
  likes       Like[]
  views       View[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([slug])
  @@index([isDraft, publishedAt])
  @@index([categoryId])
  @@index([authorId])
}
```

---

## 🎛️ State Management

### `stores/slice/blog.ts` (462 lines)

#### Redux Slice Structure

```typescript
const blogSlice = createSlice({
  name: 'blog',
  initialState: {
    posts: [],
    currentPost: null,
    relatedPosts: [],
    categories: [],
    tags: [],
    filters: {
      category: '',
      tags: [],
      search: '',
      sortBy: 'latest',
    },
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      hasMore: false,
    },
    layout: 'card',
    isLoading: false,
    error: null,
  },
  reducers: {
    setLayout: (state, action) => {
      state.layout = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    // Async thunks for API calls
    builder.addCase(fetchBlogPosts.fulfilled, (state, action) => {
      state.posts = action.payload.posts;
      state.pagination = action.payload.pagination;
    });
  },
});
```

#### Async Thunks

```typescript
export const fetchBlogPosts = createAsyncThunk(
  'blog/fetchPosts',
  async (params: BlogQueryParams) => {
    const response = await api.post('/api/post', {
      type: 'list',
      ...params,
    });
    return response.data;
  }
);

export const togglePostLike = createAsyncThunk(
  'blog/toggleLike',
  async (postId: string) => {
    const response = await api.post('/api/post/like', { postId });
    return response.data;
  }
);
```

---

## 🚀 Content Delivery

### CDN Integration

Content is served from `cdn.elice.pro` with the following structure:

```
https://cdn.elice.pro/post/{postId}/{language}.json
```

#### Content Structure

```json
{
  "product": [
    {
      "url": "https://cdn.elice.pro/images/product.jpg",
      "tag": ["태그1", "태그2"],
      "title": "제품명",
      "description": "제품 설명"
    }
  ],
  "author": {
    "name": "작성자",
    "description": "작성자 소개",
    "profileImage": "https://cdn.elice.pro/images/profile.jpg"
  },
  "content": [
    {
      "title": "섹션 제목",
      "context": "섹션 내용"
    }
  ]
}
```

---

## 📊 Analytics & Tracking

### View Tracking System

```typescript
// lib/db/views.ts
export async function trackPostView(
  postId: string,
  userId?: string,
  ip?: string,
  userAgent?: string
): Promise<boolean> {
  const viewerId = userId || `${ip}_${userAgent}`;
  const viewKey = `view:${postId}:${viewerId}`;
  
  // Redis deduplication (24-hour TTL)
  const recentView = await redis.get(viewKey);
  if (recentView) return false;
  
  // Increment view count
  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
    
    await tx.postView.create({
      data: { postId, userId, ipAddress: ip, userAgent },
    });
  });
  
  await redis.setex(viewKey, 86400, '1');
  return true;
}
```

### Engagement Metrics

- **Like System**: Optimistic updates with user tracking
- **View Tracking**: IP/User deduplication
- **Comment System**: Nested comments with replies
- **Share Tracking**: Social platform analytics

---

## 🔒 Security

### Admin Access Control

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/api/admin/blog')) {
    const session = await getSession(request);
    
    if (!session || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}
```

### Rate Limiting

- Public API: 100 requests/minute per IP
- Admin API: 500 requests/minute per user
- Upload API: 10 requests/minute per user

---

## ⚡ Performance Optimizations

### Caching Strategy

1. **CDN Caching**: Static content with 1-hour TTL
2. **Database Indexes**: Optimized for common queries
3. **Redis Caching**: View deduplication, session data
4. **React Query**: Client-side caching with SWR

### Image Optimization

```typescript
// Responsive image handling
<Image
  src={post.thumbnail}
  alt={post.title}
  width={800}
  height={400}
  placeholder="blur"
  blurDataURL={post.thumbnailBlur}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Query Optimization

```typescript
// Efficient post query with relations
const posts = await prisma.post.findMany({
  where: {
    isDraft: false,
    publishedAt: { lte: new Date() },
  },
  include: {
    author: {
      select: { id: true, name: true, image: true },
    },
    category: true,
    _count: {
      select: { comments: true, likes: true },
    },
  },
  orderBy: { publishedAt: 'desc' },
  take: limit,
  skip: (page - 1) * limit,
});
```

---

## 📈 Statistics

### Blog System Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **Admin API Endpoints** | 12 | Full CRUD + analytics |
| **Public API Endpoints** | 3 | Read-only + engagement |
| **Component Files** | 20+ | Modular architecture |
| **Type Definitions** | 450+ lines | Comprehensive typing |
| **Database Operations** | 630+ lines | Optimized queries |
| **State Management** | 462+ lines | Redux Toolkit |
| **Supported Languages** | 4 | ko, en, ja, ru |
| **CDN Integration** | Yes | cdn.elice.pro |
| **Image Storage** | R2 | Cloudflare R2 |
| **View Deduplication** | 24h | Redis-based |

---

## 🛠️ Development Guidelines

### Adding New Features

1. **Define Types**: Add to `types/blog.ts` or `types/adminBlog.ts`
2. **Create API Route**: Add to appropriate directory under `app/api/`
3. **Update Database**: Add functions to `lib/db/blog.ts`
4. **Add Component**: Create in `components/features/blog/`
5. **Update State**: Modify `stores/slice/blog.ts`
6. **Add Tests**: Create test files in `__tests__/`

### Code Organization

```typescript
// Use feature-based organization
components/features/blog/
├── [feature]/            // Group related components
│   ├── index.tsx        // Main export
│   ├── [Component].tsx  // Individual components
│   └── use[Hook].tsx    // Custom hooks
```

### Best Practices

1. **Type Safety**: Always define interfaces for props and state
2. **Error Handling**: Use try-catch with proper error messages
3. **Performance**: Implement pagination and lazy loading
4. **Security**: Validate all inputs, sanitize outputs
5. **Accessibility**: Follow WCAG guidelines
6. **Testing**: Write unit and integration tests

---

## 📚 Related Documentation

- [PROJECT.md](./PROJECT.md) - Main project documentation
- [CLAUDE.md](../CLAUDE.md) - Claude Code integration guide
- [README.md](../README.md) - Project setup and installation

---

*This documentation is maintained by the development team and updated regularly to reflect the current state of the blog system.*