"use client";

import { getUserNotification } from "@/app/actions/user/userAction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table } from "@prisma/client";
import { BookOpenIcon, HomeIcon, LogOut, UserIcon } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardNotification from "../DashboardPage/DashboardDepositRequest/DashboardDepositModal/DashboardNotification";
import { Button } from "./button";
import { DialogFooter, DialogHeader } from "./dialog";

type NavItem = {
  href: string;
  label: string;
  onClick?: () => void | Promise<void>;
  icon?: React.ReactNode;
};

const MobileNavBar = () => {
  const supabase = createClientSide();
  const pathname = usePathname();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamMemberProfile, setTeamMemberProfile] =
    useState<alliance_member_table | null>(null);
  const { setUserNotification } = useUserNotificationStore();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (e) {
    } finally {
      setIsModalOpen(false);
    }
  };

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: <HomeIcon />,
    },
    {
      href: "/notification",
      label: "Notification",
      icon: <></>,
    },
    {
      href: "https://www.facebook.com/groups/100091218211888",
      label: "Facebook Group",
      icon: <HomeIcon />,
    },
    {
      href: "/tools-and-guides",
      label: "Guides",
      icon: <BookOpenIcon />,
    },

    {
      href: "/profile",
      label: "Profile",
      icon: <UserIcon />,
    },
  ];

  const handleNavigation = (
    url: string,
    onClick?: () => void | Promise<void>
  ) => {
    if (onClick) {
      onClick();
    } else if (pathname !== url) {
      router.push(url);
    }
  };

  useEffect(() => {
    const handleFetchUserInformation = async () => {
      try {
        const {
          unreadNotification,
          readNotification,
          count,
          teamMemberProfile,
        } = await getUserNotification();
        setUserNotification({
          unread: unreadNotification,
          read: readNotification,
          count,
        });
        setTeamMemberProfile(teamMemberProfile);
      } catch (error) {}
    };

    handleFetchUserInformation();
  }, []);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white h-16 shadow-md"
        aria-label="Mobile Navigation"
      >
        <ul className="flex justify-around items-center h-full w-full">
          {navItems.map((item) => (
            <li
              key={item.href}
              className="flex flex-col items-center justify-center w-auto"
            >
              {item.label === "Facebook Group" ? (
                <Button
                  onClick={() => handleNavigation(item.href, item.onClick)}
                  variant="ghost"
                  className={cn(
                    "flex flex-col relative items-center font-medium hover:bg-transparent text-center p-2 w-min",
                    pathname === item.href
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300"
                  )}
                >
                  <Image
                    src="/assets/facebook-group.png"
                    alt="Facebook Group"
                    width={100}
                    height={100}
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                  />

                  <span className="text-xs sm:text-sm pt-2">
                    Facebook Group
                  </span>
                </Button>
              ) : item.label === "Notification" ? (
                <DashboardNotification teamMemberProfile={teamMemberProfile} />
              ) : (
                <Button
                  onClick={() => handleNavigation(item.href, item.onClick)}
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-center font-medium hover:bg-transparent text-center p-2 w-min",
                    pathname === item.href
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300"
                  )}
                >
                  {item.icon}
                  <span className="text-xs sm:text-sm">{item.label}</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <Button
        className="fixed bottom-20 right-6 h-12 w-12 rounded-full p-4 z-50 bg-gray-100 border border-gray-300 shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 dark:bg-gray-700 dark:border-gray-500"
        variant="ghost"
        onClick={() => setIsModalOpen(true)}
        aria-label="Log Out"
      >
        <LogOut className="w-6 h-6 text-gray-700 dark:text-white" />
      </Button>

      {/* Logout Confirmation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>Log Out</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to log out?
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileNavBar;
