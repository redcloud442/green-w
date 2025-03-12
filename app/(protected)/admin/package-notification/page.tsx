import AdminPackageNotificationPage from "@/components/AdminPackageNotificationPage/AdminPackageNotificationPage";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Package Notification",
  description: "Package Notification",
  openGraph: {
    url: "/admin/package-notification",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  return <AdminPackageNotificationPage />;
};

export default Page;
