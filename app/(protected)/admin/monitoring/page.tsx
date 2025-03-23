import AdminUserMonitoringPage from "@/components/AdminUserMonitoringPage/AdminUserMonitoringPage";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Monitoring",
  description: "Monitoring",
  openGraph: {
    url: "/admin/monitoring",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  return <AdminUserMonitoringPage />;
};

export default Page;
