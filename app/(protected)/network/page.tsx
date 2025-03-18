import LegionBountyPage from "@/components/LegionBountyPage/LegionBountyPage";
import prisma from "@/utils/prisma";
import { protectionAllUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Network",
  description: "Network Page",
  openGraph: {
    url: "/network",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAllUser();

  if (!teamMemberProfile) return redirect("/");

  const totalNetwork = await prisma.dashboard_earnings_summary.findUnique({
    where: {
      member_id: teamMemberProfile.alliance_member_id,
    },
    select: {
      indirect_referral_amount: true,
    },
  });

  return (
    <LegionBountyPage
      teamMemberProfile={teamMemberProfile}
      totalNetwork={totalNetwork?.indirect_referral_amount}
    />
  );
};

export default Page;
