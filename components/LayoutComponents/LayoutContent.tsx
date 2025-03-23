"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { ROLE } from "@/utils/constant";
import { useRole } from "@/utils/context/roleContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import DashboardNotification from "../DashboardPage/DashboardNotification/DashboardNotification";
import MobileNavBar from "../ui/MobileNavBar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { AppSidebar } from "../ui/side-bar";

type LayoutContentProps = {
  children: React.ReactNode;
};

export default function LayoutContent({ children }: LayoutContentProps) {
  const { teamMemberProfile: role } = useRole();

  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const { open, setOpen } = useSidebar();

  const queryClient = useMemo(() => new QueryClient(), []);

  const isAdmin = useMemo(
    () => role.alliance_member_role === ROLE.ADMIN,
    [role]
  );

  const sidebar = useMemo(() => {
    if (!isAdmin) return null;
    return <AppSidebar />;
  }, [isAdmin]);

  const mobileNav = useMemo(() => {
    if (isAdmin) return null;
    return <MobileNavBar />;
  }, [isAdmin]);

  const dashboardNotification = useMemo(() => {
    if (isAdmin || pathname !== "/panel") return null;
    return <DashboardNotification />;
  }, [isAdmin, pathname]);

  const breadcrumbs = useMemo(() => {
    return pathSegments.map((segment, i) => {
      const href = "/" + pathSegments.slice(0, i + 1).join("/");
      return {
        label: decodeURIComponent(segment)
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        href,
        isCurrentPage: i === pathSegments.length - 1,
      };
    });
  }, [pathSegments]);

  if (!isAdmin) {
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
              className={`relative z-50 flex-grow pb-20 bg-[url(/assets/bg-primary.png)] bg-cover bg-center ${isAdmin ? "p-4" : "p-0"} sm:pb-0`}
            >
              {dashboardNotification}
              {children}
            </div>

            {mobileNav}
          </div>
        </div>
      </QueryClientProvider>
    );
  } else {
    return (
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          {sidebar}
          <SidebarInset className="overflow-x-auto bg-[url(/assets/bg-primary.png)] bg-cover bg-center">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1 text-white" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={crumb.href}>
                        <BreadcrumbItem
                          className={
                            index !== breadcrumbs.length - 1
                              ? "hidden md:block"
                              : ""
                          }
                        >
                          {crumb.isCurrentPage ? (
                            <BreadcrumbPage>
                              {crumb.label === "Admin"
                                ? "Dashboard"
                                : crumb.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link href={crumb.href}>
                                {crumb.label === "Admin"
                                  ? "Dashboard"
                                  : crumb.label}
                              </Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {index < breadcrumbs.length - 1 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            <div className="pb-24 p-4 relative z-50 grow ">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </QueryClientProvider>
    );
  }
}
