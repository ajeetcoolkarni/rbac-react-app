import { configureStore } from '@reduxjs/toolkit';
import rbacReducer from './slices/rbacSlice';

export const store = configureStore({
  reducer: {
    rbac: rbacReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
