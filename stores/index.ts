
import modal from './slice/modal';
import panel from './slice/panel';
import device from './slice/device';
import search from './slice/search';
import auth from './slice/auth';
import blog from './slice/blog';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const store = configureStore({
  reducer: {
    modal,
    panel,
    device,
    search,
    auth,
    blog
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
