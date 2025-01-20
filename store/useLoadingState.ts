import { create } from "zustand";

interface userLoadingState {
  loading: boolean;

  setLoading: (loading: boolean) => void;
}

export const useUserLoadingStore = create<userLoadingState>((set) => ({
  loading: false,

  setLoading: (loading) =>
    set(() => ({
      loading: loading,
    })),
}));
