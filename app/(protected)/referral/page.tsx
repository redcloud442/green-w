import AllyBountyPage from "@/components/AllyBountyPage/AllyBountyPage";
import prisma from "@/utils/prisma";
import { protectionAllUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";
export const metadata: Metadata = {
  title: "Referral",
  description: "Referral Page",
  openGraph: {
    url: "/referral",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAllUser();

  if (!teamMemberProfile) return redirect("/500");

  const totalNetwork = await prisma.dashboard_earnings_summary.findUnique({
    where: {
      member_id: teamMemberProfile.alliance_member_id,
    },
    select: {
      direct_referral_amount: true,
      direct_referral_count: true,
    },
  });

  return (
    <AllyBountyPage
      totalDirectReferral={totalNetwork?.direct_referral_amount ?? 0}
      totalDirectReferralCount={totalNetwork?.direct_referral_count ?? 0}
    />
  );
};

export default Page;
