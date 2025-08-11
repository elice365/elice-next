# Component Documentation

## Overview

This document provides detailed documentation for the key components in the elice-next project. The component architecture follows a feature-based organization with reusable UI primitives.

## Architecture Patterns

### Feature-Based Organization
```
components/
├── features/           # Domain-specific components
│   ├── auth/          # Authentication components
│   ├── blog/          # Blog functionality components
│   └── admin/         # Admin interface components
├── ui/                # Reusable UI primitives
├── layout/            # Page layout components
└── provider/          # Context providers
```

### Component Naming Convention
- **PascalCase** for component files (`AuthForm.tsx`, `BlogCard.tsx`)
- **Barrel exports** using `index.ts` files for clean imports
- **Display names** for debugging and React DevTools

## Core Components

## AuthForm

### Purpose
A comprehensive authentication form component that handles login, registration, and email verification with social login integration.

### Features
- ✅ **Multi-purpose**: Supports login, register, verify workflows
- ✅ **Social Login**: Kakao, Google, Naver, Apple integration  
- ✅ **Form Validation**: Real-time validation with error handling
- ✅ **Animations**: Framer Motion powered transitions
- ✅ **Internationalization**: Multi-language support
- ✅ **Accessibility**: WCAG compliant form controls

### Usage
```tsx
import { AuthForm } from '@/components/features/auth/AuthForm';

// Login form
<AuthForm
  title="login"
  fields={['email', 'password']}
  onSubmit={handleLogin}
  successRedirect="/dashboard"
  showSocialLogin={true}
/>

// Registration form
<AuthForm
  title="register" 
  fields={['email', 'password', 'confirmPassword']}
  onSubmit={handleRegister}
  validate={customValidation}
  showSocialLogin={true}
/>
```

### Props Interface
```typescript
interface AuthFormProps {
  title: 'login' | 'register' | 'verify';
  fields: AuthField[];
  onSubmit: (data: AuthFormData) => Promise<void>;
  successRedirect?: string;
  validate?: (data: AuthFormData) => string | null;
  showSocialLogin?: boolean;
}
```

### Custom Hooks Integration
- `useAuthFormState` - Form data and loading states
- `useAuthFormValidation` - Input validation logic  
- `useAuthFormSubmission` - Submit handling and success flow
- `useAuthError` - Error state management
- `useFormErrorDisplay` - Error display formatting

### Component Structure
```
AuthForm/
├── AuthForm.tsx           # Main form component
├── AuthFormFields.tsx     # Input field rendering
├── AuthFormActions.tsx    # Submit button and social login
└── SocialButtons.tsx      # Social authentication buttons
```

---

## Blog Card System

### Purpose  
A modular card system for displaying blog posts with responsive design, interactive elements, and optimized performance.

### Features
- ✅ **Responsive Design**: Mobile-first with tablet/desktop variants
- ✅ **Interactive Elements**: Like, bookmark, and view tracking
- ✅ **Performance Optimized**: Memoized components and lazy loading
- ✅ **Accessibility**: Semantic markup and keyboard navigation
- ✅ **Animation System**: Hover effects and state transitions

### Usage
```tsx
import { Card } from '@/components/features/blog/Card';

<Card 
  post={blogPost}
  className="custom-styling"
/>
```

### Component Architecture
```
blog/card/
├── index.tsx              # Main Card component
├── useCardState.tsx       # State management hook
├── CardImage.tsx          # Image display with fallbacks
├── CardContent.tsx        # Title, description, metadata
├── CardActions.tsx        # Like, bookmark, share buttons
└── CardEffects.tsx        # Hover effects and animations
```

### Props Interface
```typescript
interface BlogCardProps {
  post: PostType;
  className?: string;
}

interface PostType {
  uid: string;
  title: string;
  description: string;
  images: string[] | Record<string, string>;
  status: 'draft' | 'published';
  publishedAt?: string;
  likeCount: number;
  category?: {
    name: string;
    slug: string;
  };
}
```

### Responsive Behavior
- **Mobile**: Full-width cards with bottom actions
- **Tablet**: Grid layout with optimized sizing  
- **Desktop**: Hover effects and elevated interactions

### State Management
```typescript
const {
  mobile,           // Device detection
  tablet,           // Breakpoint detection  
  isBookmarked,     // Bookmark state
  isLikeAnimating,  // Animation state
  imageError,       // Image error handling
  handleLike,       // Like toggle function
  handleBookmark,   // Bookmark toggle function
  formatDate        // Date formatting utility
} = useCardState(post);
```

---

## Token Manager System

### Purpose
Centralized JWT token management for authentication with automatic refresh and secure storage.

### Features
- ✅ **Automatic Refresh**: Token renewal before expiration
- ✅ **Memory Storage**: Access tokens stored in memory for security
- ✅ **HTTP-Only Cookies**: Refresh tokens in secure cookies
- ✅ **Error Handling**: Graceful failure and redirect logic
- ✅ **TypeScript**: Full type safety

### Usage
```typescript
import { tokenManager } from '@/lib/services/token/manager';

// Get valid access token
const token = await tokenManager.getAccessToken();

// Refresh access token
const newToken = await tokenManager.refreshAccessToken();
```

### API Interface
```typescript
interface TokenManager {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
}
```

### Security Features
- **Token Expiration**: Automatic expiry checking
- **Secure Storage**: HTTP-only cookies for refresh tokens
- **Memory Storage**: Access tokens never persisted to localStorage
- **Automatic Cleanup**: Clear tokens on authentication failure

### Integration with API Client
```typescript
// Automatic token attachment in API requests
const apiClient = axios.create({
  interceptors: {
    request: async (config) => {
      const token = await tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }
  }
});
```

## Component Development Guidelines

### 1. Component Structure
```tsx
// Component template
'use client'; // Client components only

import { memo } from 'react';
import { ComponentProps } from '@/types/component';

export const Component = memo(function Component({ 
  prop1, 
  prop2 
}: ComponentProps) {
  // Component logic
  
  return (
    // JSX structure
  );
});

Component.displayName = 'Component';
```

### 2. Custom Hooks Pattern
```tsx
// Extract complex logic into custom hooks
export const useComponentState = (props: ComponentProps) => {
  // State and effects
  
  return {
    // Exposed state and handlers
  };
};
```

### 3. TypeScript Integration
- **Strict typing** for all props and state
- **Interface definitions** in dedicated type files
- **Generic types** for reusable components
- **Proper export/import** patterns

### 4. Performance Optimization
- `memo()` for expensive components
- `useCallback()` for stable function references  
- `useMemo()` for computed values
- Lazy loading for code splitting

### 5. Accessibility Standards
- **Semantic HTML** elements
- **ARIA labels** and roles
- **Keyboard navigation** support
- **Focus management** in modals and forms

### 6. Styling Guidelines
- **Tailwind CSS v4** utility classes
- **CSS custom properties** for theme variables
- **Responsive design** with mobile-first approach
- **Animation classes** for consistent motion

## Testing Recommendations

### Unit Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthForm } from './AuthForm';

describe('AuthForm', () => {
  it('renders login form correctly', () => {
    render(
      <AuthForm
        title="login"
        fields={['email', 'password']}
        onSubmit={mockSubmit}
      />
    );
    
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
```

### Integration Testing
- Test component interactions with Redux store
- Verify API integration with MSW (Mock Service Worker)
- Test responsive behavior across breakpoints
- Validate accessibility with jest-axe

## Performance Monitoring

### Bundle Analysis
```bash
# Analyze component bundle sizes
pnpm build
npx @next/bundle-analyzer
```

### Component Profiling
- Use React DevTools Profiler
- Monitor render frequency and performance
- Identify unnecessary re-renders
- Optimize component memo dependencies

---

This documentation provides a comprehensive guide to the component architecture and development patterns used in elice-next. For specific component APIs, refer to the TypeScript interfaces and inline documentation in the source code.