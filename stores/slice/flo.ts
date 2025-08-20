import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { FloContentType, FloState, FloUnifiedItem } from '@/types/flo';
import apiUtils from '@/lib/api';


// 초기 상태
const initialState: FloState = {
  activeTab: 'new-music',
  activeFilter: 'ALL',
  items: [],
  allTabsData: {} as Record<string, FloUnifiedItem[]>,
  loading: false,
  error: null,
  hasFilters: false,
  categoryFilters: null,
  totalCount: 0,
  lastFetched: {} as Record<string, number>,
  cacheExpiry: 86400000, // 24시간 - 서버 캐싱과 동일
  filterData: {
    KPOP: [],
    POP: []
  }
};

// 비동기 액션: FLO 데이터 가져오기 (캐시 체크 포함)
export const fetchFloData = createAsyncThunk(
  'flo/fetchData',
  async (type: FloContentType, { getState }) => {
    const state = getState() as { flo: FloState };
    const lastFetch = state.flo.lastFetched[type];
    const now = Date.now();
    
    // 캐시가 유효한 경우 기존 데이터 반환
    if (lastFetch && (now - lastFetch) < state.flo.cacheExpiry) {
      const cachedData = state.flo.allTabsData[type];
      if (cachedData) {
        return {
          type,
          items: cachedData,
          hasFilters: type === 'new-rank',
          categoryFilters: null,
          totalCount: cachedData.length,
          fromCache: true
        };
      }
    }
    
    // 새로운 데이터 페칭
    const data = await apiUtils.get(`/api/flo/${type}`);
    
    if (!data.success) {
      throw new Error(data.error || '데이터를 불러올 수 없습니다');
    }
    
    const responseData = data.data as any;
    return {
      type,
      items: responseData || [],
      hasFilters: (data as any).hasFilters || false,
      categoryFilters: (data as any).categoryFilters || null,
      totalCount: (data as any).totalCount || 0,
      fromCache: false
    };
  }
);

// FLO 슬라이스
const floSlice = createSlice({
  name: 'flo',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<FloContentType>) => {
      state.activeTab = action.payload;
      
      // 탭별 기본 필터 설정
      if (action.payload === 'new-music') {
        state.activeFilter = 'ALL';
      }
      
      // 탭 변경 시 해당 탭의 데이터 로드 (서버 데이터 사용)
      // new-music 탭은 항상 필터와 함께 키를 구성
      const tabKey = action.payload === 'new-music' 
        ? 'new-music'  // new-music 탭은 기본적으로 ALL 데이터 사용
        : action.payload;
      
      if (state.allTabsData[tabKey]) {
        state.items = state.allTabsData[tabKey];
        state.totalCount = state.allTabsData[tabKey].length;
      }
    },
    setActiveFilter: (state, action: PayloadAction<'ALL' | 'KPOP' | 'POP'>) => {
      state.activeFilter = action.payload;
      
      // 필터 변경 시 서버 데이터에서 로드
      if (state.activeTab === 'new-music') {
        const filterKey = action.payload === 'ALL' 
          ? 'new-music'
          : `new-music-${action.payload}`;
        
        if (state.allTabsData[filterKey]) {
          state.items = state.allTabsData[filterKey];
          state.totalCount = state.allTabsData[filterKey].length;
        }
      }
    },
    setServerData: (state, action: PayloadAction<Record<string, FloUnifiedItem[]>>) => {
      // 서버에서 받은 모든 데이터 저장
      state.allTabsData = action.payload;
      
      // 캐싱 시간 설정 (서버에서 이미 24시간 캐싱)
      const now = Date.now();
      Object.keys(action.payload).forEach((type) => {
        state.lastFetched[type] = now;
      });
      
      // 필터 데이터 설정 (new-music 처리)
      if (action.payload['new-music-KPOP']) {
        state.filterData.KPOP = action.payload['new-music-KPOP'];
      }
      if (action.payload['new-music-POP']) {
        state.filterData.POP = action.payload['new-music-POP'];
      }
      
      // 초기 데이터 설정 (activeTab에 맞는 데이터)
      const initialKey = state.activeTab === 'new-music' && state.activeFilter !== 'ALL'
        ? `${state.activeTab}-${state.activeFilter}`
        : state.activeTab;
        
      if (action.payload[initialKey]) {
        state.items = action.payload[initialKey];
        state.totalCount = action.payload[initialKey].length;
      }
      
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFloData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFloData.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload.items as FloUnifiedItem[]) || [];
        state.hasFilters = action.payload.hasFilters;
        state.categoryFilters = action.payload.categoryFilters;
        state.totalCount = action.payload.totalCount;
        
        // 캐시 업데이트
        if (!action.payload.fromCache) {
          state.allTabsData[action.payload.type] = (action.payload.items as FloUnifiedItem[]) || [];
          state.lastFetched[action.payload.type] = Date.now();
        }
      })
      .addCase(fetchFloData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '데이터를 불러오는데 실패했습니다';
      });
  }
});

export const { setActiveTab, setActiveFilter, setServerData, clearError, resetState } = floSlice.actions;
export default floSlice.reducer;