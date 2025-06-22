
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isLoading: boolean;
  currentPage: string;
  isNavigating: boolean;
}

const initialState: UIState = {
  isLoading: true,
  currentPage: '/',
  isNavigating: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    setNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },
  },
});

export const { setLoading, setCurrentPage, setNavigating } = uiSlice.actions;
export default uiSlice.reducer;
