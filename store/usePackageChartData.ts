import { ChartDataMember } from "@/utils/types";
import { create } from "zustand";

interface packageChartDataState {
  chartData: ChartDataMember[];
  setChartData: (chartData: ChartDataMember[]) => void;
  addChartData: (chartData: ChartDataMember) => void;
}

export const usePackageChartData = create<packageChartDataState>((set) => ({
  chartData: [] as ChartDataMember[],

  setChartData: (chartData) =>
    set(() => ({
      chartData: chartData,
    })),
  addChartData: (chartData) =>
    set((state) => ({
      chartData: [chartData, ...state.chartData],
    })),
}));
