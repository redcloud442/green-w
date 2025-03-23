import AdminSalesReportPage from "@/components/AdminSalesReportPage/AdminSalesReportPage";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sales Report",
  description: "Sales Report",
  openGraph: {
    url: "/admin/sales/report",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  return <AdminSalesReportPage />;
};

export default Page;
