import { createAsyncThunk } from "@reduxjs/toolkit";

export const create = <T, P>(type: string, payloadCreator: (params: P, thunkAPI: { rejectWithValue: any }) => Promise<T>) =>
  createAsyncThunk<T, P, { rejectValue: any }>(type, async (params, { rejectWithValue }) => {
    try {
      return await payloadCreator(params, { rejectWithValue });
    } catch (error: any) {
      let errorMessage = 'An unknown error occurred.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue({ message: errorMessage });
    }
  });
