"use client";
import { notifyAction } from "@/app/actions/notify/notifyAction";
import { ChartDataMember, DashboardEarnings } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getDashboard = async (
  supabaseClient: SupabaseClient,
  params: {
    teamMemberId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_dashboard_data", {
    input_data: params,
  });

  if (error) throw error;

  const { data: ChartData } = data;

  if (!ChartData || !Array.isArray(ChartData)) {
    throw new Error("Invalid ChartData format");
  }

  const currentDate = new Date();

  const tomorrow = new Date(currentDate);
  tomorrow.setDate(currentDate.getDate() + 1);

  const unnotifiedData = ChartData.filter((item: ChartDataMember) => {
    const completionDate = new Date(item.completion_date);

    return (
      !item.is_notified && // Check if not already notified
      completionDate.getFullYear() === tomorrow.getFullYear() &&
      completionDate.getMonth() === tomorrow.getMonth() &&
      completionDate.getDate() === tomorrow.getDate()
    );
  });
  if (unnotifiedData.length > 0) {
    await notifyAction({
      chartData: unnotifiedData,
      memberId: params.teamMemberId,
    });
  }

  return data as {
    data: ChartDataMember[];
    totalCompletedAmount: number;
  };
};

export const getDashboardEarnings = async (
  supabaseClient: SupabaseClient,
  params: {
    teamMemberId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_dashboard_earnings", {
    input_data: params,
  });
  if (error) throw error;

  return data as DashboardEarnings;
};
