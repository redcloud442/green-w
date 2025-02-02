import TopUpPage from "@/components/TopUpPage/TopUpPage";
import { protectionMerchantUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Top Up Records",
  description: "List of Top Up Records",
  openGraph: {
    url: "/top-up",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionMerchantUser();

  if (!teamMemberProfile) return redirect("/login");

  return <TopUpPage teamMemberProfile={teamMemberProfile} />;
};

export default Page;
