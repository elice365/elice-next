import { createAsyncThunk } from "@reduxjs/toolkit";

export const create = <T, P>(type: string, payloadCreator: (params: P, thunkAPI: { rejectWithValue: (value: unknown) => unknown }) => Promise<T>) =>
  createAsyncThunk<T, P, { rejectValue: unknown }>(type, async (params, { rejectWithValue }) => {
    try {
      return await payloadCreator(params, { rejectWithValue });
    } catch (error) {
      let errorMessage = 'An unknown error occurred.';
      const err = error as { response?: { data?: unknown }; message?: string };
      if (err.response?.data) {
        const data = err.response.data as { message?: string } | string;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      return rejectWithValue({ message: errorMessage });
    }
  });
