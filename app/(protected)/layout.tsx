// AppLayout.tsx
import LayoutContent from "@/components/LayoutComponents/LayoutContent";

import { SidebarProvider } from "@/components/ui/sidebar";
import { RoleProvider } from "@/utils/context/roleContext";
import { protectionMemberUser } from "@/utils/serversideProtection";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    profile,
    redirect: redirectTo,
    teamMemberProfile,
    referral,
  } = await protectionMemberUser();

  if (redirectTo) {
    redirect(redirectTo);
  }

  if (!profile) {
    redirect("/500");
  }

  return (
    <SidebarProvider>
      <RoleProvider
        initialProfile={profile}
        initialTeamMemberProfile={teamMemberProfile}
        initialReferral={referral}
      >
        <LayoutContent>{children}</LayoutContent>
      </RoleProvider>
    </SidebarProvider>
  );
}
