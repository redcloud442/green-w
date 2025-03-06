import { create } from "zustand";

interface userModalPackageState {
  modalPackage: boolean;

  setModalPackage: (modalPackage: boolean) => void;
}

export const useUserModalPackageStore = create<userModalPackageState>(
  (set) => ({
    modalPackage: false,

    setModalPackage: (modalPackage) =>
      set(() => ({
        modalPackage: modalPackage,
      })),
  })
);
