# 📚 Elice Next - 프로젝트 문서

*버전: 2.0.0*  
*업데이트: 2025-01-08*

---

## 📑 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [핵심 기능](#4-핵심-기능)
5. [주요 함수 및 API](#5-주요-함수-및-api)
6. [개발 가이드](#6-개발-가이드)

---

## 1. 프로젝트 개요

### 📋 개요

**Elice Next**는 Next.js 15.4.3 기반의 엔터프라이즈급 풀스택 웹 애플리케이션입니다. 블로그 시스템, 다중 언어 지원, 소셜 로그인, 관리자 대시보드를 포함한 종합적인 콘텐츠 관리 플랫폼으로 설계되었습니다.

### 🎯 핵심 특징

- 🚀 **최신 기술 스택**: Next.js 15.4.3, TypeScript 5.x, Tailwind CSS v4, React 18.3
- 🔐 **엔터프라이즈 인증**: JWT (Access 15분/Refresh 7일) + 소셜 로그인 (Kakao, Google, Naver, Apple)
  - Argon2id 해싱 (메모리: 64MB, 반복: 3회, 병렬: 4)
  - 디바이스 핑거프린팅 기반 세션 보안
  - 자동 토큰 로테이션 및 블랙리스트 관리
- 🌍 **다국어 지원**: 한국어, 영어, 일본어, 러시아어 (next-intl 3.x)
- 📊 **실시간 분석**: 조회수 추적, 좋아요 통계, 사용자 행동 분석
  - 24시간 중복 방지 로직
  - IP + UserAgent 기반 익명 사용자 추적
- 🎨 **테마 시스템**: 라이트/다크/딥블루 테마 지원 (CSS Variables)
- 👥 **관리자 시스템**: 역할 기반 접근 제어(RBAC), 실시간 통계 대시보드
- ⚡ **성능 최적화**: Turbopack, ISR, 동적 임포트, 이미지 최적화

### 📊 프로젝트 규모

| 항목 | 수량 | 설명 |
|------|------|------|
| **총 파일** | 8,793개 | TypeScript/TSX 파일 |
| **디렉토리** | 5,154개 | 전체 디렉토리 구조 |
| **코드 라인** | ~24,350줄 | TypeScript/JavaScript 코드 |
| **컴포넌트** | 82개 | React 컴포넌트 |
| **커스텀 훅** | 28개 | React 커스텀 훅 |
| **API 엔드포인트** | 32개 | RESTful API |
| **지원 언어** | 4개 | ko, en, ja, ru |

### 🛠️ 기술 스택

#### Frontend
- **Framework**: Next.js 15.4.3 (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **State**: Redux Toolkit 2.x + RTK Query
- **UI Components**: Custom Component Library
- **Testing**: Jest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky

#### Backend
- **Runtime**: Node.js 20.x LTS
- **Database**: PostgreSQL 16 with Prisma ORM 5.x
- **Cache**: Redis (Upstash) - 10MB free tier
- **Authentication**: JWT (RS256) + OAuth 2.0
- **Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Resend API
- **Rate Limiting**: 100 req/min per IP

#### DevOps
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics & Speed Insights
- **Monitoring**: Real-time performance tracking
- **Package Manager**: PNPM

---

## 2. 프로젝트 구조

### 📁 전체 디렉토리 구조

```
elice-next/
├── app/                        # Next.js 15 App Router
│   ├── (admin)/               # 관리자 라우트 그룹 [Protected]
│   │   ├── admin/
│   │   │   ├── blog/          # 블로그 관리
│   │   │   │   ├── content/[uid]/ # 컨텐츠 에디터
│   │   │   │   └── page.tsx
│   │   │   ├── category/      # 카테고리 관리
│   │   │   ├── notification/  # 알림 관리
│   │   │   ├── role/          # 역할 관리 (RBAC)
│   │   │   ├── router/        # 라우터 관리
│   │   │   ├── session/       # 세션 관리
│   │   │   ├── user/          # 사용자 관리
│   │   │   └── page.tsx       # 관리자 대시보드
│   │   └── layout.tsx         # 관리자 레이아웃
│   │
│   ├── (main)/                # 공개 라우트 그룹
│   │   ├── auth/[type]/       # 동적 인증 페이지
│   │   ├── blog/
│   │   │   ├── [uid]/         # 블로그 상세
│   │   │   │   ├── page.tsx
│   │   │   │   └── not-found.tsx
│   │   │   └── page.tsx      # 블로그 목록
│   │   ├── login/             # 로그인
│   │   ├── register/          # 회원가입
│   │   ├── product/           # 제품 페이지
│   │   ├── layout.tsx         # 메인 레이아웃
│   │   └── page.tsx           # 홈페이지
│   │
│   ├── api/                   # API 라우트
│   │   ├── admin/             # 관리자 API [Protected]
│   │   │   ├── blog/          # 블로그 CRUD
│   │   │   │   ├── [uid]/
│   │   │   │   │   ├── content/ # 컨텐츠 관리
│   │   │   │   │   ├── images/  # 이미지 관리
│   │   │   │   │   ├── likes/   # 좋아요 통계
│   │   │   │   │   ├── status/  # 상태 관리
│   │   │   │   │   ├── views/   # 조회수 통계
│   │   │   │   │   └── route.ts
│   │   │   │   ├── stats/       # 블로그 통계
│   │   │   │   ├── upload-image/ # 이미지 업로드
│   │   │   │   └── route.ts
│   │   │   ├── category/      # 카테고리 API
│   │   │   ├── notification/  # 알림 API
│   │   │   ├── roles/         # 역할 API
│   │   │   ├── router/        # 라우터 API
│   │   │   ├── session/       # 세션 API
│   │   │   ├── sessions/cleanup/ # 세션 정리
│   │   │   └── users/         # 사용자 API
│   │   ├── auth/[type]/       # 인증 엔드포인트
│   │   ├── notification/      # 공개 알림
│   │   ├── post/              # 공개 블로그 API
│   │   ├── router/[type]/     # 네비게이션
│   │   └── search/            # 검색 API
│   │
│   ├── favicon.ico
│   └── layout.tsx             # 루트 레이아웃
│
├── components/                 # React 컴포넌트
│   ├── features/              # 도메인별 기능 컴포넌트
│   │   ├── admin/            # 관리자 기능
│   │   ├── auth/             # 인증 기능
│   │   │   ├── AuthForm.tsx
│   │   │   ├── AuthFormFields.tsx
│   │   │   ├── AuthFormActions.tsx
│   │   │   └── SocialButtons.tsx
│   │   ├── blog/             # 블로그 기능
│   │   │   ├── Card.tsx
│   │   │   ├── List.tsx
│   │   │   ├── Post.tsx
│   │   │   ├── card/         # 카드 컴포넌트 모듈화
│   │   │   ├── content/      # 컨텐츠 섹션
│   │   │   └── list/         # 리스트 컴포넌트 모듈화
│   │   ├── locale/           # 국제화
│   │   ├── notification/     # 알림
│   │   ├── profile/          # 프로필
│   │   ├── search/           # 검색
│   │   └── theme/            # 테마
│   │
│   ├── layout/                # 레이아웃 컴포넌트
│   │   ├── Admin.tsx
│   │   ├── Blog.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   │
│   ├── provider/              # Context Providers
│   │   ├── Admin.tsx
│   │   ├── Auth.tsx
│   │   ├── Redux.tsx
│   │   └── index.tsx
│   │
│   └── ui/                    # 재사용 UI 컴포넌트
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal/
│       └── ...
│
├── lib/                       # 비즈니스 로직
│   ├── auth/                 # 인증 유틸리티
│   ├── db/                   # 데이터베이스 레이어
│   │   ├── blog.ts
│   │   ├── user.ts
│   │   ├── session.ts
│   │   └── ...
│   ├── services/             # 외부 서비스
│   │   ├── cloudflare/
│   │   ├── social/
│   │   └── token/
│   └── ...
│
├── hooks/                     # 커스텀 React 훅
│   ├── admin/
│   ├── auth/
│   ├── blog/
│   └── ...
│
├── types/                     # TypeScript 타입 정의
├── utils/                     # 유틸리티 함수
├── stores/                    # Redux 상태 관리
├── constants/                 # 상수 정의
├── i18n/                      # 국제화
└── styles/                    # 스타일
```

---

## 3. 시스템 아키텍처

### 🏛️ 레이어드 아키텍처

```mermaid
graph TB
    subgraph "Presentation Layer"
        A1[Pages/Routes]
        A2[Components]
        A3[UI Elements]
        A4[Layouts]
    end
    
    subgraph "Application Layer"
        B1[Custom Hooks]
        B2[Redux Store]
        B3[Context Providers]
        B4[Middleware]
    end
    
    subgraph "Business Logic Layer"
        C1[Services]
        C2[Utilities]
        C3[Validators]
        C4[Transformers]
    end
    
    subgraph "Data Access Layer"
        D1[Prisma ORM]
        D2[Redis Cache]
        D3[External APIs]
        D4[Storage Services]
    end
    
    subgraph "Infrastructure"
        E1[PostgreSQL]
        E2[Upstash Redis]
        E3[Cloudflare R2]
        E4[Vercel Edge]
    end
    
    A1 --> B1
    A2 --> B2
    B1 --> C1
    B2 --> C2
    C1 --> D1
    C2 --> D2
    D1 --> E1
    D2 --> E2
    D3 --> E3
    D4 --> E4
```

### 🔐 인증 플로우

```mermaid
flowchart TD
    A[Login Request] --> B{Validate Credentials}
    B -->|Invalid| C[Return Error]
    B -->|Valid| D[Generate Tokens]
    
    D --> E[Access Token<br/>15 minutes TTL]
    D --> F[Refresh Token<br/>7 days TTL]
    
    E --> G[Device Fingerprinting]
    F --> G
    
    G --> H[Session Storage<br/>PostgreSQL]
    H --> I[Set HTTP-Only Cookies]
    I --> J[Return Success Response]
    
    K[Token Refresh Request] --> L{Valid Refresh Token?}
    L -->|No| M[Redirect to Login]
    L -->|Yes| N[Rotate Tokens]
    N --> D
```

### 🛡️ 보안 아키텍처

| 레이어 | 기능 | 구현 | 설정 |
|--------|------|------|------|
| **DDoS Protection** | Cloudflare 보호 | 자동 활성화 | Rate limit: 100 req/min |
| **Rate Limiting** | IP 기반 제한 | Redis 카운터 | Window: 1분, Max: 100 |
| **Authentication** | JWT 토큰 검증 | RS256 알고리즘 | Access: 15분, Refresh: 7일 |
| **Authorization** | RBAC 권한 체크 | Prisma + Middleware | 역할: Admin, User, Guest |
| **CSRF Protection** | 토큰 검증 | Double Submit Cookie | SameSite: Lax |
| **XSS Prevention** | Content Security Policy | HTTP Headers | script-src 'self' |
| **SQL Injection** | Parameterized Queries | Prisma ORM | 자동 이스케이프 |
| **Input Validation** | Zod 스키마 | 런타임 검증 | 모든 API 엔드포인트 |

---

## 4. 핵심 기능

### 🔐 인증 시스템

#### JWT 토큰 관리
- **Access Token**: 15분 TTL, RS256 서명
- **Refresh Token**: 7일 TTL, 자동 로테이션
- **디바이스 핑거프린팅**: IP + UserAgent + Canvas 기반 세션 보안

#### 소셜 로그인 지원
- **Kakao**: OAuth 2.0
- **Google**: OAuth 2.0
- **Naver**: OAuth 2.0
- **Apple**: Sign in with Apple

### 📝 블로그 시스템

#### 게시글 관리
- **CRUD 작업**: 생성, 읽기, 수정, 삭제
- **상태 관리**: 임시저장, 공개, 예약 발행, 보관
- **이미지 업로드**: Cloudflare R2 연동
- **SEO 최적화**: 메타데이터, 오픈그래프

#### 통계 및 분석
- **조회수 추적**: IP + UserAgent 기반 중복 방지 (24시간)
- **좋아요 시스템**: 사용자별 좋아요 관리
- **실시간 통계**: 관리자 대시보드에서 확인

### 🌍 다국어 지원

#### next-intl 통합
- **지원 언어**: 한국어(기본), 영어, 일본어, 러시아어
- **자동 감지**: Cloudflare 헤더 기반 국가별 언어 설정
- **쿠키 저장**: 사용자 언어 선택 유지

### 👥 사용자 관리

#### 역할 기반 접근 제어 (RBAC)
- **Admin**: 전체 시스템 관리
- **User**: 일반 사용자 권한
- **Guest**: 제한된 접근

#### 세션 관리
- **자동 정리**: 만료된 세션 자동 삭제
- **다중 디바이스**: 디바이스별 세션 관리
- **보안 감지**: 의심스러운 로그인 탐지

---

## 4. 주요 함수 및 API

### 🔐 인증 시스템 함수

#### 토큰 관리 함수

```typescript
// lib/server/auth.ts
export async function UserInfo(): Promise<InitialAuthData | null> {
  // React.cache()로 래핑되어 요청당 한 번만 실행
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  if (!accessToken) return null;
  
  try {
    const payload = await verifyToken(accessToken);
    return { user: payload, accessToken };
  } catch (error) {
    // 토큰 만료 시 자동 갱신 시도
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (refreshToken) {
      return await refreshTokens(refreshToken);
    }
    return null;
  }
}

// lib/services/token/manager.ts
export const createTokenManager(): TokenManager = {
  generateTokens: async (payload: TokenPayload) => {
    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: '15m',
      algorithm: 'RS256',
    });
    
    const refreshToken = jwt.sign(
      { ...payload, tokenId: crypto.randomUUID() },
      REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'RS256' }
    );
    
    // 리프레시 토큰 DB 저장 (이전 토큰 무효화)
    await invalidatePreviousTokens(payload.userId);
    await saveRefreshToken(refreshToken, payload.userId);
    
    return { accessToken, refreshToken };
  },
  
  verifyToken: async (token: string, type: 'access' | 'refresh') => {
    const secret = type === 'access' ? ACCESS_SECRET : REFRESH_SECRET;
    return jwt.verify(token, secret, { algorithms: ['RS256'] });
  },
  
  rotateRefreshToken: async (oldToken: string) => {
    // 토큰 로테이션으로 보안 강화
    const payload = await verifyToken(oldToken, 'refresh');
    await invalidateToken(oldToken);
    return generateTokens(payload);
  },
};
```

#### 세션 관리 함수

```typescript
// lib/services/session/cleanup.ts
export async function cleanupExpiredSessions()
// 목적: 만료된 세션 자동 정리
// 실행: 크론잡 또는 미들웨어에서 호출

export async function cleanupDuplicateSessions(userId: string, maxSessions: number = 5)
// 목적: 사용자당 최대 세션 수 제한
// 보안: 다중 디바이스 로그인 제어

export async function detectSuspiciousSessions()
// 목적: 의심스러운 세션 탐지
// 기능: 비정상 패턴 감지, 보안 알림
```

#### 소셜 로그인 함수

```typescript
// lib/services/social/login.ts
export async function processSocial({ provider, code, state })
// 목적: 소셜 로그인 처리
// 지원: Kakao, Google, Naver, Apple
// 리턴: { user, tokens, isNewUser }

// lib/services/social/map.ts
export async function mapAndValidateSocialUser(provider, rawData)
// 목적: 소셜 사용자 정보 매핑 및 검증
// 보안: 데이터 검증, 안전한 매핑
```

### 📝 블로그 시스템 함수

#### 게시글 관리 함수

```typescript
// lib/db/blog.ts
export async function createPost(data: PostCreateInput)
// 목적: 새 게시글 생성
// 기능: 자동 슬러그 생성, SEO 최적화

export async function updatePost(uid: string, data: PostUpdateInput)
// 목적: 게시글 수정
// 기능: 버전 관리, 변경 이력

export async function getPublishedPosts(params: PostQueryParams)
// 목적: 공개 게시글 목록 조회
// 기능: 페이지네이션, 필터링, 정렬
```

#### 조회수 추적 시스템

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
  
  // Redis를 통한 빠른 중복 체크 (24시간 TTL)
  const recentView = await redis.get(viewKey);
  if (recentView) return false; // 이미 조회함
  
  // 트랜잭션으로 조회수 증가 및 상세 기록
  const result = await prisma.$transaction(async (tx) => {
    // 조회수 증가
    await tx.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
    
    // 상세 조회 기록 저장
    await tx.postView.create({
      data: {
        postId,
        userId,
        ipAddress: ip,
        userAgent,
        viewedAt: new Date(),
      },
    });
    
    return true;
  });
  
  // Redis에 조회 기록 (24시간 후 자동 삭제)
  await redis.setex(viewKey, 86400, '1');
  
  return result;
}

export async function getViewStats(postId: string)
// 목적: 조회수 통계 조회
// 리턴: { total, unique, daily, hourly }
```

### 👥 사용자 관리 함수

#### 사용자 CRUD 함수

```typescript
// lib/db/user.ts
export const createUser = async (data: Prisma.UserCreateInput)
// 목적: 새 사용자 생성
// 보안: 이메일 중복 검사, 암호화

export const findUserByEmail = async (email: string)
// 목적: 이메일로 사용자 조회
// 사용: 로그인, 중복 검사

export const getAdminUsers = async (params: AdminUserParams)
// 목적: 관리자용 사용자 목록 조회
// 기능: 고급 필터링, 페이지네이션

export const getUserWithRelations = async (userId: string)
// 목적: 관계 데이터 포함 사용자 조회
// 포함: 역할, 세션, 소셜 계정

export const getUserStats = async ()
// 목적: 사용자 통계 조회
// 리턴: 총 사용자, 활성 사용자, 신규 가입
```

#### 역할 관리 함수

```typescript
// lib/db/roles.ts
export const createRole = async (data: RoleCreateInput)
// 목적: 새 역할 생성
// 기능: 권한 설정, 계층 구조

export const setUserRole = async (userId: string, roleId: string)
// 목적: 사용자 역할 할당
// 보안: 권한 검증, 감사 로그

export const checkRole = async (userId: string, roleId: string)
// 목적: 역할 권한 확인
// 사용: 미들웨어, API 보호

export const getAllRoles = async ()
// 목적: 모든 역할 조회
// 리턴: 역할 목록과 권한
```

### 🌐 API 엔드포인트 구조

#### 공개 API

```typescript
// 인증
POST   /api/auth/login         - 로그인
POST   /api/auth/register      - 회원가입
POST   /api/auth/refresh       - 토큰 갱신
POST   /api/auth/logout        - 로그아웃
POST   /api/auth/verify        - 이메일 인증
POST   /api/auth/resend        - 인증 메일 재발송

// 블로그
GET    /api/post               - 게시글 목록
GET    /api/post/[uid]         - 게시글 상세
POST   /api/post/[uid]/like    - 좋아요
POST   /api/post/[uid]/view    - 조회수 증가
GET    /api/post/[uid]/comments - 댓글 조회

// 검색
GET    /api/search             - 통합 검색
GET    /api/search/posts       - 게시글 검색
GET    /api/search/users       - 사용자 검색

// 알림
GET    /api/notification       - 공개 알림 조회
```

#### 관리자 API

```typescript
// 사용자 관리
GET    /api/admin/users        - 사용자 목록
POST   /api/admin/users        - 사용자 생성
PUT    /api/admin/users/[id]   - 사용자 수정
DELETE /api/admin/users/[id]   - 사용자 삭제
GET    /api/admin/users/stats  - 사용자 통계

// 블로그 관리
GET    /api/admin/blog         - 게시글 관리
POST   /api/admin/blog         - 게시글 생성
PUT    /api/admin/blog/[uid]   - 게시글 수정
DELETE /api/admin/blog/[uid]   - 게시글 삭제
GET    /api/admin/blog/[uid]/views - 조회 통계
GET    /api/admin/blog/[uid]/likes - 좋아요 통계

// 역할 관리
GET    /api/admin/roles        - 역할 목록
POST   /api/admin/roles        - 역할 생성
PUT    /api/admin/roles/[id]   - 역할 수정
DELETE /api/admin/roles/[id]   - 역할 삭제

// 세션 관리
GET    /api/admin/session      - 세션 목록
DELETE /api/admin/session/[id] - 세션 종료
POST   /api/admin/session/cleanup - 세션 정리

// 통계
GET    /api/admin/stats        - 전체 통계
GET    /api/admin/stats/users  - 사용자 통계
GET    /api/admin/stats/posts  - 게시글 통계
```

### 🎣 커스텀 훅

#### 인증 관련 훅

```typescript
// hooks/auth/useAuth.ts
export const useAuth = ()
// 목적: 인증 상태 관리
// 제공: user, isAuthenticated, login, logout
// 통합: Redux, JWT, 소셜 로그인

// hooks/auth/useTokenRefresh.ts
export const useTokenRefresh = (options?: TokenRefreshOptions)
// 목적: 자동 토큰 갱신
// 기능: 만료 전 자동 갱신, 실패 시 재시도
// 최적화: 중복 요청 방지
```

#### 모달 관리 훅

```typescript
// hooks/modal/useModalState.ts
export function useModalState({ fetchData, dependencies })
// 목적: 모달 상태 관리 통합
// 제공: loading, data, error, open, close
// 기능: 자동 데이터 페칭

// hooks/modal/useModalForm.ts
export function useModalForm<T>({ initialData, validation })
// 목적: 모달 폼 관리
// 기능: 검증, 제출, 에러 처리
// 통합: 폼 상태, API 호출
```

#### 관리자 페이지 훅

```typescript
// hooks/admin/useAdminTable.ts
export function useAdminTable<T>({ endpoint, columns })
// 목적: 관리자 테이블 로직 통합
// 기능: CRUD, 페이지네이션, 정렬, 필터
// 최적화: 캐싱, 낙관적 업데이트

// hooks/admin/useAdminModals.ts
export function useAdminModals<T>()
// 목적: 관리자 모달 상태 관리
// 제공: create, edit, delete 모달 제어
// 통합: 폼, 검증, API
```

#### 블로그 관련 훅

```typescript
// hooks/blog/useBlogActions.ts
export const useBlogActions = (post: PostType)
// 목적: 블로그 액션 관리
// 기능: 좋아요, 공유, 북마크
// 최적화: 낙관적 업데이트

// hooks/blog/usePost.ts
export const usePost = ()
// 목적: 포스트 상태 관리
// 제공: 조회, 수정, 삭제
// 캐싱: SWR 통합
```

### 🌐 API 클라이언트

#### API 팩토리 시스템

```typescript
// lib/fetch/api.ts
export const createAPI = (config: ApiClientConfig) => {
  const client: AxiosInstance = axios.create(config);
  const tokenManager = config.tokenManager;
  
  // 자동 토큰 관리
  if (tokenManager) {
    client.interceptors.request.use(async (reqConfig) => {
      const token = await tokenManager.getAccessToken();
      if (token) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      }
      return reqConfig;
    });
    
    // 401 응답 시 자동 토큰 갱신 및 재시도
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          const newToken = await tokenManager.refreshAccessToken();
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return client(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }
  
  return {
    get: <T>(url: string, config?) => request<T>('get', url, undefined, config),
    post: <T, D>(url: string, data: D, config?) => request<T>('post', url, data, config),
    put: <T, D>(url: string, data: D, config?) => request<T>('put', url, data, config),
    patch: <T, D>(url: string, data: D, config?) => request<T>('patch', url, data, config),
    delete: <T>(url: string, config?) => request<T>('delete', url, undefined, config),
  };
};
```

#### API 인스턴스

```typescript
// lib/fetch/index.ts
// 내부 API 통신용 (토큰 매니저 포함)
export const api = createAPI({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  tokenManager: tokenManager
});

// 외부 API 통신용 (토큰 매니저 없음)
export const request = createAPI({
  timeout: 10000,
});

// 사용 예시
const response = await api.get<BlogPost[]>('/api/post');
const newPost = await api.post<BlogPost>('/api/admin/blog', {
  title: '새 게시글',
  content: '내용'
});
```

#### API 클라이언트 특징

- **자동 토큰 관리**: Access Token 자동 주입 및 갱신
- **401 에러 처리**: 토큰 만료 시 자동 갱신 후 재시도
- **FormData 지원**: 이미지 업로드를 위한 FormData 자동 처리
- **에러 핸들링**: 향상된 에러 메시지 추출 및 컨텍스트 보존
- **TypeScript 지원**: 제네릭을 통한 타입 안전성
- **인터셉터**: 요청/응답 전처리 및 후처리

### 🔗 데이터베이스 관리

```typescript
// lib/db/index.ts
export const checkDbConnection = async ()
// 목적: DB 연결 상태 확인
// 리턴: { status, timestamp, error? }

export const getDbStats = async ()
// 목적: 테이블별 통계 조회
// 리턴: 각 테이블의 레코드 수

// lib/db/connection-manager.ts
export const withRetry = async (fn, options)
// 목적: 재시도 로직 래퍼
// 기능: 지수 백오프, 최대 재시도

export const batchQuery = async (queries)
// 목적: 배치 쿼리 실행
// 최적화: 트랜잭션, 병렬 처리
```

---

## 6. 개발 가이드

### 🚀 빠른 시작

#### 전제 조건
- Node.js 20.x 이상
- PostgreSQL 14 이상
- Redis (선택사항, Upstash 사용 가능)
- PNPM 8.x 이상

#### 환경 설정

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정
cp .env.example .env.local

# 필수 환경 변수:
DATABASE_URL="postgresql://user:password@localhost:5432/elice_next"
NEXTAUTH_SECRET="openssl rand -base64 32로 생성"
NEXTAUTH_URL="http://localhost:3000"

# 3. 데이터베이스 설정
pnpm prisma:generate  # Prisma 클라이언트 생성
pnpm prisma:push      # 개발 환경 (마이그레이션 없이 스키마 동기화)

# 4. 개발 서버 실행
pnpm dev              # Turbopack 사용 (http://localhost:3000)
```

#### 주요 명령어

```bash
# 개발
pnpm dev          # 개발 서버 (Turbopack)
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버

# 코드 품질
pnpm lint         # ESLint 검사
pnpm typecheck    # TypeScript 검사

# 데이터베이스
pnpm prisma:push     # 스키마 동기화
pnpm prisma:migrate  # 마이그레이션 실행
pnpm prisma:studio   # Prisma Studio
```

### 📝 코딩 컨벤션

#### 파일 명명 규칙

| 타입 | 규칙 | 예시 |
|------|------|------|
| **컴포넌트** | PascalCase.tsx | `BlogCard.tsx` |
| **페이지** | page.tsx | `app/blog/page.tsx` |
| **API 라우트** | route.ts | `app/api/post/route.ts` |
| **훅** | useCamelCase.ts | `useAuth.ts` |
| **유틸리티** | camelCase.ts | `formatDate.ts` |
| **타입** | types.ts 또는 .d.ts | `post.types.ts` |

#### Import 규칙

```typescript
// 1. 외부 라이브러리
import React from 'react';
import { useState, useEffect } from 'react';

// 2. 내부 모듈 (@ alias 사용)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/auth/useAuth';

// 3. 타입 (type 키워드 사용)
import type { User } from '@/types/user';
```

### 🏗️ 새 기능 추가 패턴

#### 1. 새 API 엔드포인트

```typescript
// app/api/새기능/route.ts
import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';

async function handleRequest(request: NextRequest, context: AuthInfo) {
  try {
    const result = await doSomething();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export const GET = handler(handleRequest, {
  auth: true,           // 인증 필요
  role: ['admin'],      // 역할 제한
  rateLimit: 100,       // 분당 요청 제한
});
```

#### 2. 새 컴포넌트

```typescript
// components/features/새기능/Component.tsx
'use client';

import { memo } from 'react';
import { cn } from '@/utils/cn';

interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export const Component = memo(function Component({ 
  className,
  children,
  ...props 
}: ComponentProps) {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
});
```

#### 3. 새 커스텀 훅

```typescript
// hooks/새기능/useNewFeature.ts
import { useState, useCallback, useEffect } from 'react';

interface UseNewFeatureReturn {
  state: any;
  action: () => void;
}

export function useNewFeature(): UseNewFeatureReturn {
  const [state, setState] = useState();
  
  const action = useCallback(() => {
    // 액션 로직
  }, []);
  
  return { state, action };
}
```

### 🔧 환경 변수

#### 필수 환경 변수

```env
# 데이터베이스
DATABASE_URL="postgresql://user:password@localhost:5432/elice_next"

# 인증
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Redis (선택사항)
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# 소셜 로그인 (선택사항)
KAKAO_CLIENT_ID="your-kakao-client-id"
KAKAO_CLIENT_SECRET="your-kakao-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### ⚡ 성능 최적화

#### 데이터베이스 최적화

```typescript
// N+1 문제 해결: Include 사용
const posts = await prisma.post.findMany({
  include: { 
    author: true,
    category: true,
    _count: {
      select: { likes: true, comments: true }
    }
  }
});

// 필요한 필드만 선택
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    author: { select: { name: true } }
  }
});
```

#### React 최적화

```typescript
// React.memo 사용
export const BlogCard = memo(function BlogCard({ post }: Props) {
  return <article>{/* 컴포넌트 내용 */}</article>;
});

// useMemo로 비싼 연산 캐싱
const filteredPosts = useMemo(() => {
  return posts.filter(post => post.status === 'published');
}, [posts]);
```

### 🔧 고급 시스템 구성

#### Constants 구성 시스템

**인증 설정 (`constants/auth/client.ts`)**
```typescript
export const authConfig = {
  // 보안 설정
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15분
    sessionTimeout: 60 * 60 * 1000,  // 1시간
    accessToken: 15 * 60 * 1000,     // 15분
    refreshToken: 7 * 24 * 60 * 60 * 1000, // 7일
  },
  
  // 소셜 로그인 이미지 제공
  socialImages: [
    { name: "Google", src: "https://cdn.elice.pro/images/sns/google.svg" },
    { name: "Kakao", src: "https://cdn.elice.pro/images/sns/kakao.svg" }
  ],
  
  // 라우트 보호 설정
  protected: ['/admin', '/product'],
  public: ['/auth', '/login', '/api/auth/*']
};
```

**블로그 모듈 설정 (`constants/blog.ts`)**
```typescript
export const BLOG_LAYOUTS = { CARD: 'card', LIST: 'list' };
export const SORT_OPTIONS = { 
  LATEST: 'latest', POPULAR: 'popular', 
  TRENDING: 'trending', OLDEST: 'oldest' 
};
export const SPRING_CONFIG = {
  DEFAULT: { type: "spring", stiffness: 400, damping: 30 },
  BOUNCY: { type: "spring", stiffness: 400, damping: 17 }
};
export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'facebook', TWITTER: 'twitter', 
  LINKEDIN: 'linkedin', KAKAO: 'kakao'
};
```

**아이콘 카테고리 시스템 (`constants/modal/iconCategories.ts`)**
```typescript
export const ICON_CATEGORIES = {
  navigation: [
    { name: 'Home', label: '홈' },
    { name: 'User', label: '사용자' }
  ],
  business: [
    { name: 'BarChart3', label: '차트' },
    { name: 'TrendingUp', label: '트렌드' }
  ]
  // 46개 카테고리별 아이콘 정의
};
```

**검색 설정 (`constants/search.ts`)**
```typescript
export const searchConfig = {
  delay: 500,
  minLength: 2,
  option: {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 5000
  }
};
```

#### 고성능 유틸리티 시스템

**고급 메모이제이션 (`utils/performance/memoization.ts`)**
```typescript
// LRU Cache 기반 TTL 메모이제이션
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttlMs: number = 60000, // 1분 기본값
  maxSize: number = 50
): T {
  const cache = new LRUCache<string, { value: ReturnType<T>; timestamp: number }>(maxSize);
  // TTL 기반 캐시 로직
}

// 비동기 함수용 에러 핸들링 메모이제이션
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttlMs: number = 300000, // 5분 기본값 (API 호출용)
  maxSize: number = 30
): T {
  // Promise 캐싱 및 에러 상태 관리
}

// 디바운스 메모이제이션 (검색 등 expensive operations)
export function debouncedMemoize<T>(
  fn: T, 
  delayMs: number = 300
): T {
  // 디바운스 + 캐시 결합
}

// React 컴포넌트용 얕은 비교 메모이제이션
export function shallowMemoize<T>(fn: T): T {
  // Shallow equality 기반 최적화
}
```

**중앙화된 로깅 시스템 (`utils/logger/index.ts`)**
```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = 'AUTH' | 'API' | 'DB' | 'EMAIL' | 'PERFORMANCE' | 'GENERAL';

class Logger {
  // 환경별 로깅 정책 (프로덕션에서는 warn/error만)
  private shouldLog(level: LogLevel): boolean {
    return this.isProduction ? ['warn', 'error'].includes(level) : true;
  }
  
  // 컨텍스트별 특화 로깅
  auth = {
    info: (message: string, data?: any) => this.info(message, 'AUTH', data),
    error: (message: string, data?: any) => this.error(message, 'AUTH', data)
  };
  
  performance = {
    info: (message: string, data?: any) => this.info(message, 'PERFORMANCE', data)
  };
}

export const logger = new Logger();
```

**통합 에러 처리 (`utils/error/extractErrorMessage.ts`)**
```typescript
// HTTP 상태 코드별 사용자 친화적 메시지
function getHttpStatusMessage(status: number): string {
  const statusMessages: Record<number, string> = {
    400: 'Bad request. Please check your input.',
    401: 'Authentication required. Please login.',
    403: 'Access denied. You do not have permission.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.'
  };
  return statusMessages[status] || `Request failed with status ${status}.`;
}

// 다양한 에러 타입 통합 처리
export function extractErrorMessage(error: unknown): string {
  // Error 객체, 문자열, Axios 에러 등 모든 형태 처리
}

// 표준화된 API 에러 응답 생성
export function createErrorResponse(error: unknown, context?: string) {
  return {
    success: false,
    error: extractErrorMessage(error),
    data: null
  };
}
```

#### 미들웨어 보안 시스템 (`middleware.ts`)

```typescript
export async function middleware(request: NextRequest) {
  // 1. 보안 헤더 설정
  setSecurityHeaders(response); // XSS, Frame-Options, Content-Type 보안
  
  // 2. 디바이스 추적 (핑거프린팅)
  handleDeviceTracking(request, response); // IP + UserAgent 기반
  
  // 3. 다국어 감지 (Cloudflare 헤더 사용)
  handleLanguageDetection(request, response); // cf-ipcountry 헤더
  
  // 4. 속도 제한 (Rate Limiting)
  const rateLimitResult = await limitAPI(request, request.url, 100); // 분당 100회
  
  // 5. 인증 검사
  const authResponse = await checkAuthorization(request, pathname);
}

export const config = {
  matcher: [
    // 정적 파일 제외, API 경로 포함
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};
```

#### 테마 시스템 (`styles/globals.css`)

**CSS 커스텀 프로퍼티 기반 멀티 테마**
```css
:root {
  /* 기본 변수 */
  --background: #ffffff;
  --foreground: #171717;
  --blog-accent: #2563eb;
}

html.light {
  /* 라이트 테마 - 브라운 베이스 블로그 디자인 */
  --blog-accent: #5c5049;
  --blog-gradient-start: #5c5049;
  --blog-gradient-end: #6b5b52;
  --blog-shadow-sm: 0 1px 3px 0 rgb(92 80 73 / 0.08);
  --blog-shadow-md: 0 4px 8px -1px rgb(92 80 73 / 0.12);
}

html.dark {
  /* 다크 테마 */
  --background: #0a0a0a;
  --foreground: #ededed;
}

html.deepblue {
  /* 딥블루 테마 */
  --background: #0f172a;
  --blog-accent: #3b82f6;
}

@theme {
  /* Tailwind CSS v4 연동 */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

#### 이메일 템플릿 시스템 (`constants/registerEmail.ts`)

```typescript
export const registerEmail = (url: string): Promise<{ subject: string; html: string }> => {
  return new Promise((resolve) => {
    const subject = '[Alice] 이메일 인증을 완료해 주세요';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <div style="text-align: center;">
        <h1 style="color: #ff6b35;">Alice</h1>
      </div>
      
      <h2 style="border-bottom: 2px solid #ff6b35;">이메일 인증</h2>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #ff6b35; color: white; 
           padding: 15px 30px; border-radius: 8px;">
          이메일 인증하기
        </a>
      </div>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #ff6b35;">
        <p><strong>중요:</strong> 이 링크는 10분 후에 만료됩니다.</p>
      </div>
    </div>`;
    
    resolve({ subject, html });
  });
};
```

#### 데이터베이스 스키마 (`prisma/schema.prisma`)

**15개 모델로 구성된 엔터프라이즈 스키마**
```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  auth          Auth?          // 1:1 관계
  sessions      Session[]      // 1:N 세션 관리
  socialLogins  Social[]       // 소셜 로그인
  likes         Like[]         // 블로그 좋아요
  postViews     PostView[]     // 조회수 추적
  userRoles     UserRole[]     // 역할 기반 접근 제어
}

model Auth {
  passwordHash             String    // Argon2 해시
  emailVerificationToken   String?   // 이메일 인증
  twoFactorSecret          String?   // 2FA 지원
}

model Session {
  sessionId        String    @id
  refreshToken     String    @unique
  deviceInfo       String?   // 디바이스 핑거프린팅
  ipAddress        String?   // IP 추적
  active           Boolean   @default(true)
}

model Post {
  uid           String     @id @default(uuid())
  likeCount     Int        @default(0)
  view          PostView[] // 조회수 추적 관계
  likes         Like[]     // 좋아요 관계
  tags          Tag[]      // 다대다 태그 관계
}

model PostView {
  // 24시간 중복 방지 로직을 위한 추적 모델
  userId    String?
  ip        String?
  userAgent String?
  viewedAt  DateTime @default(now())
}
```

#### API 클라이언트 팩토리 시스템 (`lib/fetch/`)

**자동 토큰 관리 및 재시도 로직**
```typescript
// lib/fetch/api.ts
export const createAPI = (config: ApiClientConfig) => {
  const client = axios.create(config);
  const tokenManager = config.tokenManager;
  
  // 자동 토큰 첨부 인터셉터
  client.interceptors.request.use(async (reqConfig) => {
    const token = await tokenManager?.getAccessToken();
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    
    // FormData 자동 처리 (Content-Type 헤더 제거)
    if (reqConfig.data instanceof FormData) {
      delete reqConfig.headers['Content-Type'];
    }
    return reqConfig;
  });
  
  // 401 에러 자동 토큰 갱신 및 재시도
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !originalRequest._retry) {
        const newToken = await tokenManager?.refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest); // 자동 재시도
        }
      }
      return Promise.reject(error);
    }
  );
};

// lib/fetch/index.ts - 두 개의 인스턴스 제공
export const api = createAPI({        // 인증 필요한 내부 API
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  tokenManager: tokenManager
});

export const request = createAPI({    // 외부 API (토큰 없음)
  timeout: 10000
});
```

#### 다국어 시스템 (`i18n/translations/`)

**4개 언어 지원 (ko, en, ja, ru)**
```json
// ko.json 구조 예시
{
  "locales": { "lang": "ko" },
  "common": {
    "search": "검색", "filter": "필터", "sort": "정렬",
    "latest": "최신순", "popular": "인기순"
  },
  "router": { "notice": "공지사항", "blog": "블로그" },
  "auth": {
    "login": "로그인", "logout": "로그아웃",
    "register": "회원가입", "forgot_password": "비밀번호 찾기"
  }
}
```

---

이 문서는 **Elice Next** 프로젝트의 전체적인 구조와 주요 기능을 이해하는 데 필요한 핵심 정보를 담고 있습니다. 고급 시스템 구성을 통해 엔터프라이즈급 확장성과 성능을 제공하며, 각 모듈의 세부 사항은 해당 파일의 주석과 타입 정의를 참고하시기 바랍니다.