import AdminWithdrawalReport from "@/components/AdminWithdrawalReport/AdminWithdrawalReport";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Withdrawal Report",
  description: "Withdrawal Report",
  openGraph: {
    url: "/admin/withdrawal/report",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  return <AdminWithdrawalReport teamMemberProfile={teamMemberProfile} />;
};

export default Page;
