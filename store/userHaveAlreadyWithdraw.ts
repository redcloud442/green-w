import { create } from "zustand";

interface userHaveAlreadyWithdraw {
  isWithdrawalToday: {
    referral: boolean;
    package: boolean;
  };
  canUserDeposit: boolean;

  setIsWithdrawalToday: (value: {
    referral: boolean;
    package: boolean;
  }) => void;
  setCanUserDeposit: (value: boolean) => void;
}

export const useUserHaveAlreadyWithdraw = create<userHaveAlreadyWithdraw>(
  (set) => ({
    isWithdrawalToday: {
      referral: false,
      package: false,
    },
    canUserDeposit: false,

    setIsWithdrawalToday: (isWithdrawalToday) =>
      set(() => ({
        isWithdrawalToday: {
          referral: isWithdrawalToday.referral,
          package: isWithdrawalToday.package,
        },
      })),
    setCanUserDeposit: (canUserDeposit) =>
      set(() => ({
        canUserDeposit: canUserDeposit,
      })),
  })
);
