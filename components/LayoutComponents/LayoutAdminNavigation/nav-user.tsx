"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { createClientSide } from "@/utils/supabase/client";
import { user_table } from "@prisma/client";
import { useRouter } from "next/navigation";

export function NavUser({ user }: { user: user_table }) {
  const supabase = createClientSide();
  const { isMobile } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.user_profile_picture ?? ""}
                  alt={user.user_username ?? ""}
                />
                <AvatarFallback className="rounded-lg">
                  {" "}
                  {user.user_first_name?.charAt(0).toUpperCase() ?? ""}
                  {user.user_last_name?.charAt(0).toUpperCase() ?? ""}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.user_first_name} {user.user_last_name}
                </span>
                <span className="truncate text-xs">{user.user_username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={0}
          >
            <DropdownMenuLabel
              className="p-0 font-normal cursor-pointer"
              onClick={() => {
                router.push("/profile");
              }}
            >
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-6 w-6 rounded-lg">
                  <AvatarImage
                    src={user.user_profile_picture ?? ""}
                    alt={user.user_username ?? ""}
                  />
                  <AvatarFallback className="rounded-lg">
                    {" "}
                    {user.user_first_name?.charAt(0).toUpperCase() ?? ""}
                    {user.user_last_name?.charAt(0).toUpperCase() ?? ""}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.user_first_name} {user.user_last_name}
                  </span>
                  <span className="truncate text-xs">{user.user_username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
