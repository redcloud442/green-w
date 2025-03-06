"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ROLE } from "@/utils/constant";
import { useRole } from "@/utils/context/roleContext";
import { alliance_member_table, user_table } from "@prisma/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MobileNavBar from "../ui/MobileNavBar";
import AppSidebar from "../ui/side-bar";

type LayoutContentProps = {
  profile: user_table;
  teamMemberProfile: alliance_member_table;
  children: React.ReactNode;
};

export default function LayoutContent({
  profile,
  teamMemberProfile,
  children,
}: LayoutContentProps) {
  const { role } = useRole();
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen w-full overflow-hidden relative">
        {role === ROLE.ADMIN && (
          <div>
            <AppSidebar
              userData={profile}
              teamMemberProfile={teamMemberProfile}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-x-auto relative ">
          {role === ROLE.ADMIN && (
            <div className="p-4 md:hidden">
              <SidebarTrigger />
            </div>
          )}
          <div
            className={`relative z-50 flex-grow pb-20 ${
              role === ROLE.ADMIN ? "p-4" : "p-0"
            } sm:pb-0`}
          >
            {children}
          </div>

          {role !== ROLE.ADMIN && <MobileNavBar />}
        </div>
      </div>
    </QueryClientProvider>
  );
}
