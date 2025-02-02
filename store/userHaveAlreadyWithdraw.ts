import { create } from "zustand";

interface userHaveAlreadyWithdraw {
  isWithdrawalToday: boolean;
  canUserDeposit: boolean;
  setIsWithdrawalToday: (value: boolean) => void;
  setCanUserDeposit: (value: boolean) => void;
}

export const useUserHaveAlreadyWithdraw = create<userHaveAlreadyWithdraw>(
  (set) => ({
    isWithdrawalToday: false,
    canUserDeposit: false,

    setCanUserDeposit: (canUserDeposit: boolean) =>
      set(() => ({
        canUserDeposit: canUserDeposit,
      })),

    setIsWithdrawalToday: (isWithdrawalToday) =>
      set(() => ({
        isWithdrawalToday: isWithdrawalToday,
      })),
  })
);
