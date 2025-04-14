import { package_table } from "@prisma/client";
import { create } from "zustand";

interface selectedPackageState {
  selectedPackage: package_table | null;
  setSelectedPackage: (pkg: package_table) => void;
  setSelectedPackageToNull: () => void;
}

export const useSelectedPackage = create<selectedPackageState>((set) => ({
  selectedPackage: null,
  setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
  setSelectedPackageToNull: () => set({ selectedPackage: null }),
}));
