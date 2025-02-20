import UserAdminProfile from "@/components/UserAdminProfile/UserAdminProfile";
import prisma from "@/utils/prisma";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { UserRequestdata } from "@/utils/types";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User Profile Records",
  description: "List of User Records",
  openGraph: {
    url: "/admin/users",
  },
};

const Page = async ({ params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;

  const { teamMemberProfile, profile } = await protectionAdminUser();

  if (!teamMemberProfile) return redirect("/login");

  const [userData, allianceData] = await prisma.$transaction([
    prisma.user_table.findUnique({
      where: {
        user_id: userId,
      },
    }),
    prisma.alliance_member_table.findFirst({
      where: {
        alliance_member_user_id: userId,
      },
    }),
  ]);

  const merchantData = await prisma.merchant_member_table.findFirst({
    where: {
      merchant_member_merchant_id: allianceData?.alliance_member_id,
    },
  });

  const combinedData = {
    ...userData,
    ...allianceData,
    ...merchantData,
  } as UserRequestdata;

  if (!combinedData) return redirect("/login");

  return <UserAdminProfile profile={profile} userProfile={combinedData} />;
};

export default Page;
