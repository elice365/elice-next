import { FormType } from "@/types/auth";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
  readonly search: boolean;
  readonly auth: boolean;
  readonly form: FormType;
};

const initialState: ModalState = {
  search: false,
  auth: false,
  form: "login",
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    search: (state) => { state.search = !state.search;},
    setSearch: (state, action: PayloadAction<boolean>) => { state.search = action.payload; },
    auth: (state) => {state.auth = !state.auth;},
    setAuth: (state, action: PayloadAction<boolean>) => { state.auth = action.payload; },
    setForm:(state, action: PayloadAction<FormType>) => { state.form = action.payload; },
  },
});

export const { 
  search,
  auth,
  setSearch,
  setAuth,
  setForm,
} = modalSlice.actions;
export default modalSlice.reducer;


