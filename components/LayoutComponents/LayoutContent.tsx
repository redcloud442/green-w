"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ROLE } from "@/utils/constant";
import { useRole } from "@/utils/context/roleContext";
import { alliance_member_table, user_table } from "@prisma/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import DashboardNotification from "../DashboardPage/DashboardNotification/DashboardNotification";
import MobileNavBar from "../ui/MobileNavBar";

// Lazy load sidebar for better performance
const LazyAppSidebar = dynamic(() => import("../ui/side-bar"), { ssr: false });

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
  const pathname = usePathname();

  const queryClient = useMemo(() => new QueryClient(), []);

  const isAdmin = useMemo(() => role === ROLE.ADMIN, [role]);

  const sidebar = useMemo(() => {
    if (!isAdmin) return null;
    return (
      <LazyAppSidebar
        userData={profile}
        teamMemberProfile={teamMemberProfile}
      />
    );
  }, [isAdmin]);

  const mobileNav = useMemo(() => {
    if (isAdmin) return null;
    return <MobileNavBar />;
  }, [isAdmin]);

  const dashboardNotification = useMemo(() => {
    if (isAdmin || pathname !== "/panel") return null;
    return <DashboardNotification />;
  }, [isAdmin, pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen w-full overflow-hidden relative">
        {sidebar}

        <div className="flex-1 flex flex-col overflow-x-auto relative">
          {isAdmin && (
            <div className="p-4 md:hidden">
              <SidebarTrigger />
            </div>
          )}

          <div
            className={`relative z-50 flex-grow pb-20 ${isAdmin ? "p-4" : "p-0"} sm:pb-0`}
          >
            {dashboardNotification}
            {children}
          </div>

          {mobileNav}
        </div>
      </div>
    </QueryClientProvider>
  );
}
