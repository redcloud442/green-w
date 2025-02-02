import AdminUserPage from "@/components/AdminUsersPage/AdminUsersPage";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User Records",
  description: "List of User Records",
  openGraph: {
    url: "/admin/users",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  return <AdminUserPage teamMemberProfile={teamMemberProfile} />;
};

export default Page;
