import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  mobile: false,
  tablet: false,
  desktop: true,
};

const getDeviceFlags = (width: number) => {
  if (width <= 710) {
    return { mobile: true, tablet: false, desktop: false };
  } else if (width < 1024) {
    return { mobile: false, tablet: true, desktop: false };
  } else {
    return { mobile: false, tablet: false, desktop: true };
  }
};

const device = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDevice: (state, action: PayloadAction<number>) => {
      const { mobile, tablet, desktop } = getDeviceFlags(action.payload);
      state.mobile = mobile;
      state.tablet = tablet;
      state.desktop = desktop;
    },
  },
});

export const { setDevice } = device.actions;
export default device.reducer;