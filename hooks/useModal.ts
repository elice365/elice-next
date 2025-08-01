import { AppDispatch } from "@/stores";
import { auth, setAuth, setForm, setSearch, search } from "@/stores/slice/modal";
import { FormType } from "@/types/auth";
import { useDispatch } from "react-redux";
import { useCallback } from "react";

export const useModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const toggleSearch = useCallback(() => dispatch(search()), [dispatch]);
  const setSearchState = useCallback((search: boolean) => dispatch(setSearch(search)), [dispatch]);
  const toggleAuth = useCallback(() => dispatch(auth()), [dispatch]);
  const setAuthState = useCallback((auth: boolean) => dispatch(setAuth(auth)), [dispatch]);
  const setFormType = useCallback((formType: FormType) => dispatch(setForm(formType)), [dispatch]);
  
  return {
    search: toggleSearch,
    setSearch: setSearchState,
    auth: toggleAuth,
    setAuth: setAuthState,
    setForm: setFormType,
  };
};
