import { alliance_transaction_table } from "@prisma/client";
import { create } from "zustand";

interface userTransactionHistoryState {
  transactionHistory: alliance_transaction_table[];

  setTransactionHistory: (
    transactionHistory: alliance_transaction_table[]
  ) => void;

  setAddTransactionHistory: (
    transactionHistory: alliance_transaction_table[]
  ) => void;
}

export const useUserTransactionHistoryStore =
  create<userTransactionHistoryState>((set) => ({
    transactionHistory: [],

    setTransactionHistory: (transactionHistory) =>
      set(() => ({
        transactionHistory: transactionHistory,
      })),

    setAddTransactionHistory: (transactionHistory) =>
      set((state) => ({
        transactionHistory: [
          ...transactionHistory,
          ...state.transactionHistory,
        ],
      })),
  }));
