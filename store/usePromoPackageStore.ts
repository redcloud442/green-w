import { create } from "zustand";

interface promoPackageState {
  promoPackage: boolean;

  setPromoPackage: (promoPackage: boolean) => void;
}

export const usePromoPackageStore = create<promoPackageState>((set) => ({
  promoPackage: true,
  setPromoPackage: (promoPackage) =>
    set(() => ({
      promoPackage: promoPackage,
    })),
}));
