import UserProfilePage from "@/components/UserProfilePage/UserProfilePage";
import prisma from "@/utils/prisma";
import { protectionAllUser } from "@/utils/serversideProtection";
import { UserRequestdata } from "@/utils/types";
import { Metadata } from "next";
import { redirect } from "next/navigation";
export const metadata: Metadata = {
  title: "Profile Page",
  description: "User Profile Page",
  openGraph: {
    url: "/profile",
  },
};

const Page = async () => {
  const {
    profile,
    redirect: redirectTo,
    teamMemberProfile,
  } = await protectionAllUser();

  if (redirectTo) {
    redirect(redirectTo);
  }

  if (!teamMemberProfile || !profile) redirect("/500");

  const [userData, allianceData] = await prisma.$transaction([
    prisma.user_table.findFirst({
      where: {
        user_id: profile.user_id,
      },
      select: {
        user_id: true,
        user_username: true,
        user_first_name: true,
        user_last_name: true,
        user_email: true,
        user_profile_picture: true,
        user_active_mobile: true,
      },
    }),
    prisma.alliance_member_table.findFirst({
      where: {
        alliance_member_user_id: profile.user_id,
      },
      select: {
        alliance_member_id: true,
        alliance_member_role: true,
      },
    }),
  ]);

  const combinedData = {
    ...userData,
    ...allianceData,
  } as UserRequestdata;

  return <UserProfilePage userProfile={combinedData} />;
};
export default Page;
