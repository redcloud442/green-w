import { getDashboardClientMonitoring } from "@/services/Dasboard/Member";
import { useQuery } from "@tanstack/react-query";

export const useClientDashboard = (params: {
  startDate: string;
  endDate: string;
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["clientDashboard", params.startDate, params.endDate],
    queryFn: () =>
      getDashboardClientMonitoring({
        dateFilter: {
          start: params.startDate,
          end: params.endDate,
        },
      }),

    staleTime: 60000,
  });

  return {
    data: data,
    isLoading: isLoading,
    isError: isError,
  };
};
