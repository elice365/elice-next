import { AppDispatch } from "@/stores";
import { panel , setPanel } from "@/stores/slice/panel";
import { useDispatch } from "react-redux";
import { useCallback } from "react";

export const usePanel = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const togglePanel = useCallback(() => dispatch(panel()), [dispatch]);
  const setPanelState = useCallback((state: boolean) => dispatch(setPanel(state)), [dispatch]);
  
  return {
    panel: togglePanel,
    setPanel: setPanelState,
  };
};
