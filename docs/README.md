# Documentation Index

## Overview

This documentation provides comprehensive coverage of the elice-next project architecture, APIs, components, and development practices. The documentation is organized by topic and target audience to help developers quickly find relevant information.

## Documentation Structure

### 📚 Core Documentation

#### [📖 COMPONENTS.md](./COMPONENTS.md) - Component Documentation
- **Target Audience**: Frontend developers, UI/UX developers
- **Coverage**: React component architecture, patterns, and usage guidelines
- **Key Topics**:
  - AuthForm system with social login integration
  - Blog Card system with responsive design
  - Token Manager for secure authentication
  - Component development patterns and best practices
  - Performance optimization techniques
  - Testing recommendations

#### [🔌 API.md](./API.md) - API Documentation  
- **Target Audience**: Backend developers, full-stack developers, API consumers
- **Coverage**: Complete REST API reference with examples
- **Key Topics**:
  - Authentication API endpoints (/api/auth/[type])
  - Admin API for content management
  - Public blog API for content consumption
  - Error handling and response formats
  - Security features and rate limiting
  - Client integration patterns

#### [🔐 AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication System
- **Target Audience**: Security-focused developers, system architects
- **Coverage**: Enterprise-grade authentication system architecture
- **Key Topics**:
  - JWT dual-token system (access + refresh)
  - Social OAuth integration (Kakao, Google, Naver, Apple)
  - Session management and device tracking
  - Security features and best practices
  - Redux integration and error handling
  - Testing and deployment considerations

#### [👨‍💻 DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Developer Guide
- **Target Audience**: All developers, new contributors
- **Coverage**: Complete development workflow and coding standards
- **Key Topics**:
  - Project setup and quick start
  - Development workflow and best practices
  - Coding standards and patterns
  - Database development with Prisma
  - State management with Redux Toolkit
  - Performance optimization techniques
  - Testing strategies and troubleshooting

#### [🗄️ DATABASE.md](./DATABASE.md) - Database Architecture
- **Target Audience**: Backend developers, database administrators
- **Coverage**: Prisma ORM and PostgreSQL database layer
- **Key Topics**:
  - Database client and connection management
  - Data models (User, Session, Role, Notification)
  - Query patterns and transactions
  - Performance optimization and indexing
  - Migration management
  - Monitoring and health checks

#### [🛡️ MIDDLEWARE.md](./MIDDLEWARE.md) - Middleware & Security
- **Target Audience**: Security engineers, backend developers
- **Coverage**: Request processing and security middleware
- **Key Topics**:
  - Middleware stack architecture
  - Security headers and CORS
  - Rate limiting implementation
  - Device tracking and fingerprinting
  - Authorization and route protection
  - Performance monitoring

#### [🔄 STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - State Management
- **Target Audience**: Frontend developers, application architects
- **Coverage**: Redux Toolkit global state management
- **Key Topics**:
  - Store configuration and structure
  - State slices (auth, blog, device, modal, panel, search)
  - Custom hooks and utilities
  - Performance optimization with selectors
  - State persistence strategies
  - Testing state management

## Quick Navigation

### 🚀 Getting Started
- [Setup and Installation](./DEVELOPER_GUIDE.md#quick-start) - Get the project running locally
- [Project Structure](./DEVELOPER_GUIDE.md#project-structure-deep-dive) - Understand the codebase organization
- [Development Workflow](./DEVELOPER_GUIDE.md#development-workflow) - Daily development practices

### 🏗️ Architecture
- [Component Architecture](./COMPONENTS.md#architecture-patterns) - Feature-based organization
- [Authentication System](./AUTHENTICATION.md#architecture) - Security and token management
- [API Design](./API.md#base-configuration) - RESTful endpoint structure
- [Database Schema](./AUTHENTICATION.md#session-management) - Data models and relationships

### 🔐 Security
- [Authentication Flows](./AUTHENTICATION.md#authentication-flows) - Login, registration, social auth
- [Security Features](./AUTHENTICATION.md#security-features) - Password hashing, rate limiting
- [API Security](./API.md#security-features) - Headers, validation, CSRF protection
- [Best Practices](./AUTHENTICATION.md#security-best-practices) - Production security checklist

### 🎨 Frontend Development
- [Component Patterns](./COMPONENTS.md#core-components) - AuthForm, BlogCard, TokenManager
- [Styling Guidelines](./DEVELOPER_GUIDE.md#styling-and-ui-development) - Tailwind CSS v4 usage
- [Performance Optimization](./DEVELOPER_GUIDE.md#performance-optimization) - Code splitting, memoization
- [State Management](./DEVELOPER_GUIDE.md#state-management) - Redux Toolkit patterns

### 🗄️ Backend Development
- [API Development](./DEVELOPER_GUIDE.md#api-development-patterns) - Route handlers and validation
- [Database Operations](./DEVELOPER_GUIDE.md#database-development) - Prisma best practices
- [Authentication Logic](./AUTHENTICATION.md#jwt-token-system) - Token management and security
- [Error Handling](./API.md#error-handling) - Standardized error responses

### 🧪 Testing & Quality
- [Component Testing](./COMPONENTS.md#testing-recommendations) - Unit and integration tests
- [API Testing](./DEVELOPER_GUIDE.md#testing-strategies) - Endpoint testing strategies
- [Authentication Testing](./AUTHENTICATION.md#testing-authentication) - Security testing
- [Performance Testing](./COMPONENTS.md#performance-monitoring) - Bundle analysis and profiling

## Usage Examples

### For New Developers
1. Start with [Developer Guide - Quick Start](./DEVELOPER_GUIDE.md#quick-start)
2. Review [Project Structure](./DEVELOPER_GUIDE.md#project-structure-deep-dive)
3. Understand [Authentication System](./AUTHENTICATION.md#overview)
4. Explore [Component Patterns](./COMPONENTS.md#core-components)

### For Frontend Developers
1. Study [Component Documentation](./COMPONENTS.md)
2. Review [Styling Guidelines](./DEVELOPER_GUIDE.md#styling-and-ui-development)
3. Understand [State Management](./DEVELOPER_GUIDE.md#state-management)
4. Learn [Authentication Integration](./AUTHENTICATION.md#redux-integration)

### For Backend Developers
1. Review [API Documentation](./API.md)
2. Understand [Authentication System](./AUTHENTICATION.md)
3. Study [Database Patterns](./DEVELOPER_GUIDE.md#database-development)
4. Learn [Security Implementation](./AUTHENTICATION.md#security-features)

### For Security Audits
1. Review [Authentication Security](./AUTHENTICATION.md#security-features)
2. Check [API Security](./API.md#security-features)
3. Validate [Security Best Practices](./AUTHENTICATION.md#security-best-practices)
4. Examine [Deployment Security](./AUTHENTICATION.md#deployment-considerations)

## Documentation Standards

### Content Organization
- **Overview** - Brief introduction and key concepts
- **Features** - Specific capabilities and functionality  
- **Usage Examples** - Practical implementation examples
- **API References** - Detailed interface documentation
- **Best Practices** - Recommended patterns and approaches
- **Testing** - Validation and quality assurance

### Code Examples
- All code examples are tested and functional
- Examples include TypeScript types and interfaces
- Error handling patterns demonstrated
- Security considerations highlighted
- Performance optimizations noted

### Maintenance
- Documentation updated with code changes
- Version compatibility noted
- Deprecation warnings included
- Migration guides provided when needed

## Contributing to Documentation

### Documentation Updates
1. Keep examples current with codebase changes
2. Add new patterns and best practices
3. Update API references for endpoint changes
4. Include security considerations for new features

### Writing Guidelines
- Use clear, concise language
- Include practical examples
- Provide context for decisions
- Link related documentation sections
- Follow consistent formatting

### Review Process
- Technical accuracy validation
- Code example testing
- Clarity and completeness review
- Cross-reference verification

## Support and Resources

### Getting Help
- Check relevant documentation section first
- Review code examples and patterns
- Consult API reference for endpoint details
- Use component documentation for UI questions

### Additional Resources
- Project README.md for basic setup
- Code comments for implementation details
- TypeScript interfaces for data structures
- Test files for usage examples

---

This documentation ecosystem provides comprehensive coverage of the elice-next project. Whether you're implementing new features, debugging issues, or conducting security reviews, these guides will help you work effectively with the codebase.