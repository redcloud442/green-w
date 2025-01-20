import { DashboardEarnings } from "@/utils/types";
import { create } from "zustand";

interface userDashboardEarningsState {
  totalEarnings: DashboardEarnings | null;
  setTotalEarnings: (earnings: DashboardEarnings | null) => void;
}

export const useUserDashboardEarningsStore = create<userDashboardEarningsState>(
  (set) => ({
    totalEarnings: null,

    setTotalEarnings: (earnings) =>
      set(() => ({
        totalEarnings: earnings,
      })),
  })
);
