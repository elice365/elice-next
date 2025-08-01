import { createSlice, PayloadAction } from "@reduxjs/toolkit";


const initialState = {
  panel: false,
};

const panelSlice = createSlice({
  name: "panel",
  initialState,
  reducers: {
    panel: (state) => { state.panel = !state.panel },
    setPanel: (state, action: PayloadAction<boolean>) => { state.panel = action.payload; },
  },
});

export const { 
  panel, 
  setPanel, 
} = panelSlice.actions;

export default panelSlice.reducer;