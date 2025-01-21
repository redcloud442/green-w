import { create } from "zustand";

interface userHaveAlreadyWithdraw {
  isWithdrawalToday: boolean;

  setIsWithdrawalToday: (value: boolean) => void;
}

export const useUserHaveAlreadyWithdraw = create<userHaveAlreadyWithdraw>(
  (set) => ({
    isWithdrawalToday: false,

    setIsWithdrawalToday: (isWithdrawalToday) =>
      set(() => ({
        isWithdrawalToday: isWithdrawalToday,
      })),
  })
);
