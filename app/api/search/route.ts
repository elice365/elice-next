import { handler } from '@/lib/request';
import { APIResult } from '@/types/api';
import { safeBody } from '@/utils/parse/body';
import { NextRequest } from 'next/server';
import {
  searchBlogPosts,
  getRecentPosts,
  getPopularPostsByViews,
  getPopularPostsByLikes,
  getRecommendedTags,
  getTrendingTags,
  getSearchSuggestions
} from '@/lib/db/search';

// --- 핸들러 로직 ---

// POST: 블로그 검색 핸들러
const searchHandler = async (request: NextRequest): Promise<APIResult> => {
  try {
    const body = await safeBody<{
      query?: string;
      type?: 'posts' | 'tags' | 'all';
      filters?: {
        category?: string;
        dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
      };
      page?: number;
      limit?: number;
      sortBy?: 'relevance' | 'date' | 'views' | 'likes';
    }>(request);

    const {
      query = '',
      type = 'posts',
      filters = {},
      page = 1,
      limit = 10,
      sortBy = 'relevance'
    } = body;

    // 빈 검색어 처리
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: {
          posts: [],
          tags: [],
          total: 0,
          suggestions: []
        }
      };
    }

    // 검색 실행
    const searchResults = await searchBlogPosts({
      query: query.trim(),
      type,
      category: filters.category,
      dateRange: filters.dateRange,
      page,
      limit,
      sortBy
    });

    return {
      success: true,
      message: '검색 결과를 가져왔습니다',
      data: searchResults
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      message: '검색 중 오류가 발생했습니다',
      data: null
    };
  }
};

// GET: 검색 페이지 데이터 (최근, 인기, 추천 태그) 핸들러
const getSearchPageData = async (request: NextRequest): Promise<APIResult> => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // 자동완성 요청 처리
    if (type === 'autocomplete') {
      const query = searchParams.get('q') || '';
      const suggestions = await getSearchSuggestions(query, 5);
      return {
        success: true,
        data: suggestions
      };
    }
    
    // 특정 데이터 타입 요청 처리
    if (type === 'recent') {
      const limit = parseInt(searchParams.get('limit') || '5');
      const category = searchParams.get('category') || undefined;
      const recentPosts = await getRecentPosts(limit, category);
      return {
        success: true,
        data: { recent: recentPosts }
      };
    }
    
    if (type === 'popular') {
      const limit = parseInt(searchParams.get('limit') || '5');
      const sortBy = searchParams.get('sortBy') as 'views' | 'likes' || 'views';
      const dateRange = searchParams.get('dateRange') as 'day' | 'week' | 'month' | 'all' || 'week';
      
      const popularPosts = sortBy === 'likes'
        ? await getPopularPostsByLikes(limit, dateRange)
        : await getPopularPostsByViews(limit, dateRange);
        
      return {
        success: true,
        data: { popular: popularPosts }
      };
    }
    
    if (type === 'tags') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const trending = searchParams.get('trending') === 'true';
      
      const tags = trending
        ? await getTrendingTags(limit, 7)
        : await getRecommendedTags(limit);
        
      return {
        success: true,
        data: { tags }
      };
    }
    
    // 기본: 모든 검색 페이지 데이터 반환
    const [recentPosts, popularPosts, recommendedTags, trendingTags] = await Promise.all([
      getRecentPosts(5),
      getPopularPostsByViews(5, 'week'),
      getRecommendedTags(10),
      getTrendingTags(5, 7)
    ]);

    return {
      success: true,
      message: '검색 페이지 데이터를 가져왔습니다',
      data: {
        recent: recentPosts,
        popular: popularPosts,
        recommend: recommendedTags.map(tag => tag.name), // Convert to string array for recommendations
        recommendedTags: recommendedTags,
        trendingTags: trendingTags
      }
    };
  } catch (error) {
    console.error('Error fetching search page data:', error);
    return {
      success: false,
      message: '데이터를 가져오는 중 오류가 발생했습니다',
      data: null
    };
  }
};

// --- 라우트 핸들러 export ---

export const POST = handler(searchHandler, {
  limit: true,
});

export const GET = handler(getSearchPageData, {
  limit: true
});