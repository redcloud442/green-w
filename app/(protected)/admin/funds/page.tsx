import AdminFundsPage from "@/components/AdminFundsPage/AdminFundsPage";
import prisma from "@/utils/prisma";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Funds",
  description: "List of Funds",
  openGraph: {
    url: "/admin/funds",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  const funds = await prisma.package_company_funds_table.findMany({
    take: 1,
  });

  return <AdminFundsPage funds={funds} />;
};

export default Page;
