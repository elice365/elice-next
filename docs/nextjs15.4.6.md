# Next.js 15.4.6 App Router Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Project Structure](#project-structure)
4. [Routing System](#routing-system)
5. [Data Fetching](#data-fetching)
6. [Server & Client Components](#server--client-components)
7. [Navigation](#navigation)
8. [Metadata & SEO](#metadata--seo)
9. [Styling](#styling)
10. [Middleware & Security](#middleware--security)
11. [Internationalization](#internationalization)
12. [Migration Guide](#migration-guide)
13. [Performance Optimization](#performance-optimization)
14. [API Routes](#api-routes)
15. [Best Practices](#best-practices)

## Overview

Next.js 15.4.6 introduces significant improvements to the App Router, providing a modern React framework with server components, streaming, and enhanced performance features. The App Router is the recommended approach for new Next.js applications.

### Key Features
- **React Server Components** - Reduced client-side JavaScript
- **Streaming & Suspense** - Progressive page rendering
- **Nested Layouts** - Shared UI across routes
- **Enhanced Data Fetching** - Built-in caching and revalidation
- **Turbopack** - Ultra-fast development builds
- **Parallel & Intercepting Routes** - Advanced routing patterns

## Core Concepts

### App Router vs Pages Router

The App Router (`app/` directory) is the modern routing system that replaces the Pages Router (`pages/` directory):

| Feature | Pages Router | App Router |
|---------|--------------|------------|
| Directory | `pages/` | `app/` |
| Components | Client Components | Server & Client Components |
| Data Fetching | `getServerSideProps`, `getStaticProps` | Async Server Components |
| Layouts | `_app.js`, `_document.js` | Nested `layout.tsx` |
| Routing | File-based | File-based with conventions |

## Project Structure

### File Conventions

```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx           # Home page
├── loading.tsx        # Loading UI
├── error.tsx          # Error boundary
├── not-found.tsx      # 404 page
├── global-error.tsx   # Global error boundary
├── template.tsx       # Re-rendered layout
├── route.ts           # API endpoint
└── (route-group)/     # Route groups
    ├── layout.tsx
    └── page.tsx
```

### Special Files

- **`layout.tsx`** - Shared UI for a segment and its children
- **`page.tsx`** - Unique UI of a route
- **`loading.tsx`** - Loading UI with React Suspense
- **`error.tsx`** - Error UI with React Error Boundary
- **`not-found.tsx`** - Not found UI
- **`route.ts`** - API endpoint handlers

## Routing System

### Basic Routing

```typescript
// app/page.tsx - maps to /
export default function HomePage() {
  return <h1>Home</h1>
}

// app/about/page.tsx - maps to /about
export default function AboutPage() {
  return <h1>About</h1>
}
```

### Dynamic Routes

```typescript
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <h1>Blog Post: {slug}</h1>
}
```

### Route Groups

Route groups organize routes without affecting the URL structure:

```typescript
// app/(main)/layout.tsx - Layout for main routes
// app/(admin)/layout.tsx - Layout for admin routes
```

### Parallel Routes

```typescript
// app/@modal/page.tsx - Modal slot
// app/@sidebar/page.tsx - Sidebar slot
// app/layout.tsx
export default function Layout({
  children,
  modal,
  sidebar
}: {
  children: React.ReactNode
  modal: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
      {sidebar}
    </>
  )
}
```

## Data Fetching

### Server Components (Default)

```typescript
// Cached by default (force-cache)
async function getStaticData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

// Fresh on every request (no-store)
async function getDynamicData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  })
  return res.json()
}

// Revalidate every 60 seconds
async function getRevalidatedData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }
  })
  return res.json()
}

export default async function Page() {
  const data = await getStaticData()
  return <div>{/* Use data */}</div>
}
```

### Static Generation with Dynamic Params

```typescript
// app/blog/[id]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(res => res.json())
  
  return posts.map((post: { id: string }) => ({
    id: post.id,
  }))
}

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await fetch(`https://api.example.com/posts/${id}`).then(res => res.json())
  
  return <article>{/* Render post */}</article>
}
```

### Incremental Static Regeneration (ISR)

```typescript
// Revalidate page every 60 seconds
export const revalidate = 60

// Control dynamic params behavior
export const dynamicParams = true // or false

export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{/* Render data */}</div>
}
```

## Server & Client Components

### Server Components (Default)

```typescript
// app/page.tsx - Server Component by default
import { db } from '@/lib/db'

export default async function Page() {
  // Direct database access
  const posts = await db.post.findMany()
  
  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

### Client Components

```typescript
// app/components/Counter.tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### Mixing Server and Client Components

```typescript
// app/page.tsx - Server Component
import ClientComponent from './ClientComponent'

async function getData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

export default async function Page() {
  const data = await getData()
  
  return (
    <div>
      <h1>Server Rendered</h1>
      <ClientComponent initialData={data} />
    </div>
  )
}
```

## Navigation

### Client-Side Navigation Hooks

```typescript
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function NavigationExample() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Programmatic navigation
  const handleNavigation = () => {
    router.push('/about')
    router.replace('/home')
    router.back()
    router.forward()
    router.refresh()
    router.prefetch('/products')
  }
  
  return (
    <div>
      <p>Current path: {pathname}</p>
      <p>Search: {searchParams.get('q')}</p>
    </div>
  )
}
```

### Link Component

```typescript
import Link from 'next/link'

export default function Navigation() {
  return (
    <nav>
      {/* Simple link */}
      <Link href="/about">About</Link>
      
      {/* With query params */}
      <Link href="/blog?category=tech">Tech Blog</Link>
      
      {/* Dynamic route */}
      <Link href="/blog/my-post">My Post</Link>
      
      {/* Prefetch control */}
      <Link href="/heavy-page" prefetch={false}>
        Heavy Page
      </Link>
    </nav>
  )
}
```

## Metadata & SEO

### Static Metadata

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Welcome to my Next.js app',
  keywords: ['nextjs', 'react', 'app'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'My App',
    description: 'Welcome to my Next.js app',
    url: 'https://myapp.com',
    siteName: 'My App',
    images: [
      {
        url: 'https://myapp.com/og.jpg',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My App',
    description: 'Welcome to my Next.js app',
    images: ['https://myapp.com/twitter-image.jpg'],
  },
}

export default function Page() {
  return <div>Page content</div>
}
```

### Dynamic Metadata

```typescript
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await fetch(`https://api.example.com/products/${id}`).then(res => res.json())
  
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      images: [product.image],
    },
  }
}
```

## Styling

### Global Styles

```typescript
// app/layout.tsx
import './globals.css'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### CSS Modules

```typescript
// app/page.module.css
.container {
  padding: 2rem;
}

// app/page.tsx
import styles from './page.module.css'

export default function Page() {
  return <div className={styles.container}>Content</div>
}
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Middleware & Security

### Middleware Configuration

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Authentication check
  const token = request.cookies.get('token')
  
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## Internationalization

### Setup with next-intl

```typescript
// app/[locale]/layout.tsx
import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Using Translations

```typescript
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('HomePage')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  )
}
```

## Migration Guide

### From Pages Router to App Router

#### 1. Update Dependencies

```bash
npm install next@15.4.6 react@19.1.0 react-dom@19.1.0
npm install -D eslint-config-next@latest
```

#### 2. Create App Directory Structure

```typescript
// Before: pages/_app.js
function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

// After: app/layout.tsx
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

#### 3. Migrate Data Fetching

```typescript
// Before: pages/index.js
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/data')
  const data = await res.json()
  return { props: { data } }
}

export default function Page({ data }) {
  return <div>{/* Use data */}</div>
}

// After: app/page.tsx
export default async function Page() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  })
  const data = await res.json()
  return <div>{/* Use data */}</div>
}
```

#### 4. Update Navigation Hooks

```typescript
// Before
import { useRouter } from 'next/router'

// After
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
```

## Performance Optimization

### Streaming with Suspense

```typescript
// app/page.tsx
import { Suspense } from 'react'
import LoadingSpinner from './loading-spinner'

async function SlowComponent() {
  const data = await fetch('https://slow-api.example.com/data')
  return <div>{/* Render data */}</div>
}

export default function Page() {
  return (
    <div>
      <h1>Fast Content</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}
```

### Partial Prerendering (Experimental)

```typescript
// next.config.js
module.exports = {
  experimental: {
    ppr: true,
  },
}

// app/page.tsx
export const experimental_ppr = true

export default function Page() {
  return (
    <div>
      {/* Static content */}
      <h1>Static Header</h1>
      
      {/* Dynamic content */}
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  )
}
```

### Image Optimization

```typescript
import Image from 'next/image'

export default function Gallery() {
  return (
    <div>
      <Image
        src="/hero.jpg"
        alt="Hero image"
        width={1200}
        height={600}
        priority // Load immediately
        placeholder="blur" // Show blurred placeholder
        blurDataURL="..." // Base64 encoded placeholder
      />
    </div>
  )
}
```

## API Routes

### Route Handlers

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  
  const posts = await db.post.findMany({
    where: query ? { title: { contains: query } } : undefined
  })
  
  return NextResponse.json(posts)
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const post = await db.post.create({
    data: body
  })
  
  return NextResponse.json(post, { status: 201 })
}
```

### Dynamic Route Handlers

```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await db.post.findUnique({
    where: { id }
  })
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(post)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  
  const post = await db.post.update({
    where: { id },
    data: body
  })
  
  return NextResponse.json(post)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.post.delete({
    where: { id }
  })
  
  return new NextResponse(null, { status: 204 })
}
```

## Best Practices

### 1. Component Organization

```typescript
// Prefer Server Components for data fetching
// app/posts/page.tsx
export default async function PostsPage() {
  const posts = await getPosts() // Direct data access
  return <PostList posts={posts} />
}

// Use Client Components for interactivity
// app/components/PostList.tsx
'use client'
export function PostList({ posts }) {
  const [filter, setFilter] = useState('')
  // Interactive filtering logic
}
```

### 2. Error Handling

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### 3. Loading States

```typescript
// app/loading.tsx
export default function Loading() {
  return (
    <div className="loading-skeleton">
      <div className="animate-pulse">
        {/* Skeleton UI */}
      </div>
    </div>
  )
}
```

### 4. Route Segment Configuration

```typescript
// app/page.tsx
// Route Segment Config
export const runtime = 'edge' // 'nodejs' (default) | 'edge'
export const dynamic = 'force-dynamic' // 'auto' | 'force-dynamic' | 'error' | 'force-static'
export const revalidate = 3600 // Revalidate every hour
export const fetchCache = 'auto' // 'auto' | 'default-cache' | 'only-cache' | 'force-cache' | 'force-no-store' | 'default-no-store' | 'only-no-store'
```

### 5. Security Headers

```typescript
// next.config.ts
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}

export default nextConfig
```

## Current Project Implementation

Based on your project structure, here's how Next.js 15.4.6 App Router is implemented:

### Route Groups
- `(main)/` - Public routes (blog, auth, product)
- `(admin)/` - Admin interface routes (protected)

### Key Features Used
- **Turbopack**: Fast development builds (`pnpm dev --turbopack`)
- **Internationalization**: next-intl integration
- **Authentication**: JWT with middleware protection
- **Database**: Prisma ORM with PostgreSQL
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS v4

### Configuration

```typescript
// next.config.ts
import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Security headers configuration
  async headers() {
    // ... headers configuration
  },
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
```

This documentation covers the essential aspects of Next.js 15.4.6 App Router. For more detailed information, refer to the official Next.js documentation at https://nextjs.org/docs.