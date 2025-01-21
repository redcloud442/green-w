"use client";
import { ChartDataMember, DashboardEarnings } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getDashboard = async (
  supabaseClient: SupabaseClient,
  params: {
    activePhoneNumber: string;
    activeEmail: string;
    teamMemberId: string;
  }
) => {
  const { data, error } = await supabaseClient.rpc("get_dashboard_data", {
    input_data: params,
  });

  if (error) throw error;

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
