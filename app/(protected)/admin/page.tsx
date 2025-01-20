import AdminDashboardPage from "@/components/AdminDashboardPage/AdminDashboardPage";
import { prisma } from "@/lib/db";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "List of Withdrawal Records",
  openGraph: {
    url: "/admin",
  },
};

const Page = async () => {
  const { teamMemberProfile, referral } = await protectionAdminUser();
  const today = new Date().toISOString().split("T")[0];

  const packageNotification = await prisma.package_notification_logs.findMany({
    where: {
      package_notification_logs_date: {
        gte: new Date(`${today}T00:00:00Z`),
        lte: new Date(`${today}T23:59:59Z`),
      },
    },
  });

  if (!teamMemberProfile) return redirect("/auth/login");

  return (
    <AdminDashboardPage
      teamMemberProfile={teamMemberProfile}
      referral={referral}
      packageNotification={packageNotification}
    />
  );
};

export default Page;
