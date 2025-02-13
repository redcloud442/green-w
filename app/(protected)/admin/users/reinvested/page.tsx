import AdminUserReinvestedPage from "@/components/AdminUserReinvestedPage/AdminUserReinvestedPage";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User Reinvested",
  description: "List of User Reinvested",
  openGraph: {
    url: "/admin/users/reinvested",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  return <AdminUserReinvestedPage teamMemberProfile={teamMemberProfile} />;
};

export default Page;
