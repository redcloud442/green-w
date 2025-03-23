import AdminTopUpApprovalPage from "@/components/AdminTopUpApprovalPage/AdminTopUpApprovalPage";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Deposit Records",
  description: "List of Deposit Records",
  openGraph: {
    url: "/admin/deposit",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  return <AdminTopUpApprovalPage />;
};

export default Page;
