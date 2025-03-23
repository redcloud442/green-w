import MerchantPage from "@/components/MerchantPage/MerchantPage";
import { protectionMerchantUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";
export const metadata: Metadata = {
  title: "Merchant Page",
  description: "Merchant Page",
  openGraph: {
    url: "/merchant",
  },
};

const Page = async () => {
  const { teamMemberProfile, redirect: redirectTo } =
    await protectionMerchantUser();

  if (redirectTo) {
    redirect(redirectTo);
  }

  if (!teamMemberProfile) {
    redirect("/login");
  }

  if (teamMemberProfile.alliance_member_role !== "MERCHANT")
    return redirect("/");

  return <MerchantPage />;
};
export default Page;
