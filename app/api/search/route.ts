import { searchConfig } from '@/constants/search';
import { handler } from '@/lib/request';
import { APIResult } from '@/types/api';
import { safeBody } from '@/utils/parse/body';
import { NextRequest } from 'next/server';

// 검색 결과 목 데이터
const searchMockData = [
  { id: "1", title: "Next.js 최신 기능", description: "Next.js 14의 새로운 기능들을 알아보세요. ", url: "/posts/1", image: "/api/placeholder/60/60", category: "개발", createdTime: "2024-01-15", views: 1 },
  { id: "2", title: "React 성능 최적화", description: "React 애플리케이션 성능을 향상시키는 방법", url: "/posts/2", image: "/api/placeholder/60/60", category: "React", createdTime: "2024-01-14", views: 3 },
  { id: "3", title: "TypeScript 실전 가이드", description: "실무에서 활용하는 TypeScript 패턴들", url: "/posts/3", image: "/api/placeholder/60/60", category: "TypeScript", createdTime: "2024-01-13", views: 5 },
  { id: "4", title: "웹 접근성 개선", description: "모든 사용자를 위한 웹 접근성 가이드", url: "/posts/4", image: "/api/placeholder/60/60", category: "웹 개발", createdTime: "2024-01-12", views: 3 },
  { id: "5", title: "CSS Grid 마스터", description: "CSS Grid를 활용한 레이아웃 디자인", url: "/posts/5", image: "/api/placeholder/60/60", category: "CSS", createdTime: "2024-01-11", views: 2 }
];

// 최근 게시물 목 데이터
const recentPostsMockData = [
  { id: "11", title: "JavaScript ES2024 신기능", description: "새롭게 추가된 JavaScript 기능들의 소식을 읽어보세요!!", url: "/posts/11", image: "/api/placeholder/60/60", category: "JavaScript", createdTime: "2024-06-20", views: 1250 },
  { id: "12", title: "모던 CSS 기법", description: "최신 CSS 기법으로 스타일링하기", url: "/posts/12", image: "/api/placeholder/60/60", category: "CSS", createdTime: "2024-06-19", views: 980 },
  { id: "13", title: "API 설계 베스트 프랙티스", description: "확장 가능한 API 설계 방법론", url: "/posts/13", image: "/api/placeholder/60/60", category: "백엔드", createdTime: "2024-06-18", views: 1450 }
];

// 인기 게시물 목 데이터
const popularPostsMockData = [
  { id: "21", title: "프론트엔드 개발자 로드맵", description: "2024년 프론트엔드 개발자가 되는 방법", url: "/posts/21", image: "/api/placeholder/60/60", category: "커리어", createdTime: "2024-05-15", views: 5200 },
  { id: "22", title: "Git 고급 사용법", description: "팀 협업을 위한 Git 워크플로우", url: "/posts/22", image: "/api/placeholder/60/60", category: "도구", createdTime: "2024-05-10", views: 3800 },
  { id: "23", title: "데이터베이스 최적화", description: "쿼리 성능을 높이는 실전 기법", url: "/posts/23", image: "/api/placeholder/60/60", category: "데이터베이스", createdTime: "2024-05-05", views: 4100 }
];

// 추천 검색어 목 데이터
const recommendationsMockData = [
  "React", "Next.js", "TypeScript", "JavaScript", "CSS"
];

// --- 핸들러 로직 ---

// POST: 실시간 검색 결과 핸들러
const searchHandler = async (request: NextRequest): Promise<APIResult> => {
    const { type, search } = await safeBody<{ type: string; search?: string }>(request);
    if (type !== searchConfig.type.search) {
        return { success: false, message: 'Invalid search type for POST request'};
    }
    if (!search) {
        return { success: true, data: [] };
    }
    const searchResults = searchMockData.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );
    return { success: true, data: searchResults };
}

// GET: 정적 데이터(최근, 인기, 추천) 핸들러
const staticData = async (): Promise<APIResult> => {
    return {
        success: true,
        data: {
            recent: recentPostsMockData,
            popular: popularPostsMockData,
            recommend: recommendationsMockData,
        }
    };
}

// --- 라우트 핸들러 export ---

export const POST = handler(searchHandler, {
    limit: true,
});

export const GET = handler(staticData, {
    limit: true
});
