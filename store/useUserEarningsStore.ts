import { alliance_earnings_table } from "@prisma/client";
import { create } from "zustand";

interface userEarningsState {
  earnings: alliance_earnings_table;

  setEarnings: (earnings: alliance_earnings_table) => void;
}

export const useUserEarningsStore = create<userEarningsState>((set) => ({
  earnings: {} as alliance_earnings_table,

  setEarnings: (earnings) =>
    set(() => ({
      earnings: earnings,
    })),
}));
