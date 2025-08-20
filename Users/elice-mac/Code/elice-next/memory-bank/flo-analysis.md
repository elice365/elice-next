# FLO 코드 분석 보고서

## 프로젝트 구조
- Next.js 15.4.3 App Router 사용
- Prisma + PostgreSQL 데이터베이스
- Redux Toolkit 상태 관리
- Tailwind CSS v4 스타일링

## FLO 기능 분석

### 사용 중인 컴포넌트
1. **TrackTable** - 반응형 트랙 테이블 (Flo.tsx, TabSearchResults.tsx, MultiSearch.tsx에서 사용)
2. **SearchInput** - 검색 입력
3. **SearchResults** - 통합 검색 결과
4. **TabSearchResults** - 탭 기반 검색
5. **MultiSearch** - 멀티 검색
6. **ErrorDiagnostic** - 디버그 오버레이

### 미사용 컴포넌트 (삭제 가능)
1. components/features/flo/Card.tsx
2. components/features/flo/ContentTabs.tsx
3. components/features/flo/Filter.tsx
4. components/features/flo/Spinner.tsx (LoadingSpinner.tsx 중복)
5. components/features/flo/shared/FloCard.tsx
6. components/features/flo/shared/TrackListItem.tsx
7. components/features/flo/index.ts (실제로 사용되지 않음)

### 미사용 API 라우트
1. app/api/flo/chart/[id]/route.ts
2. app/api/flo/play/[trackId]/route.ts (클라이언트는 /api/flo/play로 POST)
3. app/api/flo/vcoloring-play/[id]/route.ts

### 미사용 Import 정리 필요
1. **TrackTable.tsx**
   - setPlaying (stores/slice/music)
   - getResponsiveTextClass, getResponsivePaddingClass, getIconSizeClass (utils/flo/responsive)

2. **TabSearchResults.tsx**  
   - getResponsiveGridClass, getResponsiveTextClass, getCardContainerClass, getResponsivePaddingClass

3. **MultiSearch.tsx**
   - getResponsiveTextClass, getResponsivePaddingClass

4. **SearchResults.tsx**
   - getIconSizeClass

## 최적화 계획

### 1단계: 미사용 코드 제거
- 미사용 컴포넌트 파일 삭제
- 미사용 import 정리
- 미사용 API 라우트 제거

### 2단계: 컴포넌트 재사용성 개선
- useAlbumTracks 훅 생성 (앨범 트랙 로딩/캐시)
- AlbumExpandable 컴포넌트 생성 (확장형 앨범 카드)
- 검색 결과에서 TrackTable 재사용 확대

### 3단계: 검색 기능 통합
- TRACK 섹션을 TrackTable로 대체
- 공통 컴포넌트로 중복 코드 제거
- 캐시 및 에러 처리 일원화