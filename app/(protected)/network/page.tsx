import LegionBountyPage from "@/components/LegionBountyPage/LegionBountyPage";
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

  return <LegionBountyPage teamMemberProfile={teamMemberProfile} />;
};

export default Page;
