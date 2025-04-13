import DashboardPage from "@/components/DashboardPage/DashboardPage";
import { getUserSponsor } from "@/services/User/User";
import prisma from "@/utils/prisma";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Panel | Elevate Global",
  description: "Elevate Global Panel",
  openGraph: {
    url: "https://elevateglobal.app/panel",
  },
};

const Page = async () => {
  const {
    redirect: redirectTo,
    teamMemberProfile,
    profile,
  } = await protectionMemberUser();

  if (redirectTo) {
    redirect(redirectTo);
  }

  if (!teamMemberProfile) return redirect("/500");

  const packages = await prisma.package_table.findMany({
    where: {
      package_is_disabled: false,
      package_is_promo: false,
    },
    orderBy: {
      package_percentage: "asc",
    },
  });

  const promoPackages = await prisma.package_table.findMany({
    where: {
      package_is_disabled: false,
      package_is_promo: true,
    },
    orderBy: {
      package_percentage: "asc",
    },
  });

  let sponsorData = null;

  try {
    const sponsor = await getUserSponsor({
      userId: profile.user_id,
    });

    sponsorData = sponsor;
  } catch (err) {
    sponsorData = null;
  }

  if (teamMemberProfile.alliance_member_role === "ADMIN") {
    return redirect("/admin");
  }

  return (
    <DashboardPage
      promoPackages={promoPackages}
      packages={packages}
      sponsor={sponsorData || ""}
    />
  );
};

export default Page;
