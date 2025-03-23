import { create } from "zustand";

interface sidebarOpenState {
  open: boolean;

  setOpen: (open: boolean) => void;
}

export const useSidebarOpenStore = create<sidebarOpenState>((set) => ({
  open: false,
  setOpen: (open) =>
    set(() => ({
      open: open,
    })),
}));
