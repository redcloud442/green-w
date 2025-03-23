import WithdrawalHistoryPage from "@/components/WithrawalHistoryPage/WithdrawalHistoryPage";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Withdraw History",
  description: "Withdrawal History Page",
  openGraph: {
    url: "/withdraw/history",
  },
};

const Page = async () => {
  const { teamMemberProfile, redirect: redirectTo } =
    await protectionMemberUser();

  if (redirectTo) {
    redirect(redirectTo);
  }

  if (!teamMemberProfile) redirect("/500");

  if (teamMemberProfile) return redirect("/");

  return <WithdrawalHistoryPage />;
};

export default Page;
