// AppLayout.tsx
import LayoutContent from "@/components/LayoutComponents/LayoutContent";

import { SidebarProvider } from "@/components/ui/sidebar";
import { RoleProvider } from "@/utils/context/roleContext";
import { protectionMemberUser } from "@/utils/serversideProtection";
import Image from "next/image";
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
        initialRole={teamMemberProfile.alliance_member_role}
        initialUserName={profile.user_username ?? ""}
        initialTeamMemberId={teamMemberProfile.alliance_member_id}
        initialMobileNumber={profile.user_active_mobile ?? ""}
        initialEmail={profile.user_email ?? ""}
      >
        <div className="absolute inset-0 -z-10 h-full w-full">
          <Image
            src="/assets/bg-primary.png"
            alt="Background"
            quality={80}
            fill
            priority
            className="object-cover"
          />
        </div>
        <LayoutContent profile={profile} teamMemberProfile={teamMemberProfile}>
          {children}
        </LayoutContent>
      </RoleProvider>
    </SidebarProvider>
  );
}
