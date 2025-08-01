import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchItem } from "@/types/search";

interface SearchState {
  query: string;
  debouncedQuery: string;
  results: SearchItem[];
  isLoading: boolean;
  error: string | null;
  recent: SearchItem[];
  popular: SearchItem[];
  recommend: string[];
  staticLoading: boolean;
}

const initialState: SearchState = {
  query: '',
  debouncedQuery: '',
  results: [],
  isLoading: false,
  error: null,
  recent: [],
  popular: [],
  recommend: [],
  staticLoading: false,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setDebouncedQuery: (state, action: PayloadAction<string>) => {
      state.debouncedQuery = action.payload;
    },
    setResults: (state, action: PayloadAction<SearchItem[]>) => {
      state.results = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setStaticData: (state, action: PayloadAction<{
      recent: SearchItem[];
      popular: SearchItem[];
      recommend: string[];
    }>) => {
      state.recent = action.payload.recent;
      state.popular = action.payload.popular;
      state.recommend = action.payload.recommend;
      state.staticLoading = false;
    },
    setStaticLoading: (state, action: PayloadAction<boolean>) => {
      state.staticLoading = action.payload;
    },
    clearSearch: (state) => {
      state.query = '';
      state.debouncedQuery = '';
      state.results = [];
      state.error = null;
    },
  },
});

export const {
  setQuery,
  setDebouncedQuery,
  setResults,
  setLoading,
  setError,
  setStaticData,
  setStaticLoading,
  clearSearch,
} = searchSlice.actions;

export default searchSlice.reducer;