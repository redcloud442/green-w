import {
  alliance_member_table,
  alliance_top_up_request_table,
  alliance_withdrawal_request_table,
  merchant_member_table,
  user_history_log,
  user_table,
} from "@prisma/client";

export type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type TopUpRequestData = alliance_top_up_request_table & {
  user_username: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_id: string;
  user_profile_picture: string;
  approver_username: string;
  approver_profile_picture: string;
  alliance_member_id: string;
  approver_id: string;
  count: number;
  attachment_url: string[];
};

export type PackageHistoryData = {
  package_member_connection_id: string;
  package_name: string;
  package_member_amount: number;
  package_member_amount_earnings: number;
  package_member_status: string;
  package_member_connection_created: string;
};

export type WithdrawalRequestData = alliance_withdrawal_request_table & {
  user_first_name: string;
  user_last_name: string;
  user_id: string;
  user_email: string;
  user_username: string;
  alliance_member_id: string;
  approver_username?: string;
  user_profile_picture: string;
  approver_profile_picture: string;
  approver_id: string;
};

export type UserRequestdata = user_table &
  alliance_member_table &
  merchant_member_table;

export type LegionRequestData = user_table &
  alliance_member_table & { total_bounty_earnings: string };

export type UserLog = user_table & user_history_log;

export type ChartData = {
  date: string;
  earnings: number;
  withdraw: number;
};

export type ChartDataMember = {
  package: string;
  completion: number;
  completion_date: string;
  amount: number;
  current_amount: number;
  currentPercentage: number;
  is_ready_to_claim: boolean;
  is_notified: boolean;
  package_connection_id: string;
  profit_amount: number;
  package_color: string;
  package_member_id: string;
  package_date_created: string;
  package_days: number;
};

export type DashboardEarnings = {
  directReferralAmount: number;
  indirectReferralAmount: number;
  totalEarnings: number;
  withdrawalAmount: number;
  directReferralCount: number;
  indirectReferralCount: number;
  package_income: number;
  rank: string;
  tags: string[];
};

export type AdminDashboardDataByDate = {
  activePackageWithinTheDay: number;
  totalEarnings: number;
  totalWithdraw: number;
  directLoot: number;
  indirectLoot: number;
  totalApprovedWithdrawal: number;
  totalActivatedUserByDate: number;
  totalApprovedReceipts: number;
  packageEarnings: number;
  chartData: ChartData[];
  reinvestorsCount: number;
  totalReinvestmentAmount: number;
};

export type AdminDashboardData = {
  numberOfRegisteredUser: number;
  totalActivatedPackage: number;
  totalActivatedUser: number;
};

export type AdminTopUpRequestData = {
  data: {
    APPROVED: StatusData;
    REJECTED: StatusData;
    PENDING: StatusData;
  };
  merchantBalance?: number;
};

export type MerchantTopUpRequestData = {
  data: {
    APPROVED: StatusData;
    REJECTED: StatusData;
    PENDING: StatusData;
  };
  merchantBalance: number;
};

export type StatusData = {
  data: TopUpRequestData[];
  count: number;
};

export type StatusDataWithdraw = {
  data: WithdrawalRequestData[];
  count: number;
};

export type AdminWithdrawaldata = {
  data: {
    APPROVED: StatusDataWithdraw;
    REJECTED: StatusDataWithdraw;
    PENDING: StatusDataWithdraw;
  };
};

export type AdminWithdrawalReportData = {
  total_amount: number;
  total_request: number;
};

export type adminWithdrawalTotalReportData = {
  interval_start: string;
  interval_end: string;
  total_accounting_approvals: string;
  total_admin_approvals: string;
  total_admin_approved_amount: number;
  total_accounting_approved_amount: number;
  total_net_approved_amount: number;
};

export type adminSalesTotalReportData = {
  monthlyTotal: number;
  monthlyCount: number;
  dailyIncome: adminSalesReportData[];
};

export type adminSalesReportData = {
  date: string;
  amount: number;
};

export type adminUserReinvestedReportData = {
  package_member_connection_created: string;
  package_member_amount: number;
  package_member_connection_id: string;
  user_username: string;
  user_id: string;
  user_profile_picture: string;
  user_first_name: string;
  user_last_name: string;
};

export type MissionTask = {
  task_id: string;
  task_name: string;
  task_target: string;
  task_type: string;
  progress: number;
  task_to_achieve: number;
  is_completed: boolean;
};

export type MissionData = {
  mission_id: string;
  mission_name: string;
  mission_order: string;
  reward: number;
  tasks: MissionTask[];
  isMissionCompleted: boolean;
  allMissionCompleted: boolean;
};
