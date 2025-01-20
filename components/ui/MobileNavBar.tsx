"use client";

import {
  getUserNotification,
  getuserWallet,
} from "@/app/actions/user/userAction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getDashboard, getDashboardEarnings } from "@/services/Dasboard/Member";
import { useUserLoadingStore } from "@/store/useLoadingState";
import { usePackageChartData } from "@/store/usePackageChartData";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { useUserDashboardEarningsStore } from "@/store/useUserDashboardEarnings";
import { useUserEarningsStore } from "@/store/useUserEarningsStore";
import { useRole } from "@/utils/context/roleContext";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table } from "@prisma/client";
import { BookOpenIcon, DoorOpen, HomeIcon, UserIcon } from "lucide-react";
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
  const { setEarnings } = useUserEarningsStore();
  const { setTotalEarnings } = useUserDashboardEarningsStore();
  const { setChartData } = usePackageChartData();
  const { setLoading } = useUserLoadingStore();
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
      label: "Tools & Guides",
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

  const { role, teamMemberId, mobileNumber, email } = useRole();

  useEffect(() => {
    const handleFetchUserInformation = async () => {
      try {
        if (!teamMemberId) return;
        setLoading(true);
        const { count, teamMemberProfile, userNotification } =
          await getUserNotification();
        setUserNotification({
          notifications: userNotification,
          count: count,
        });
        setTeamMemberProfile(teamMemberProfile);

        const { userEarningsData } = await getuserWallet({
          memberId: teamMemberId,
        });

        setEarnings(userEarningsData);

        const dashboardEarnings = await getDashboardEarnings(supabase, {
          teamMemberId: teamMemberId,
        });

        setTotalEarnings(dashboardEarnings);

        const { data } = await getDashboard(supabase, {
          activePhoneNumber: mobileNumber,
          activeEmail: email,
          teamMemberId: teamMemberId,
        });

        setChartData(data);

        setLoading(false);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    handleFetchUserInformation();
  }, [teamMemberId, role]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-2 border-zinc-400 bg-white h-16 shadow-md"
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
        className="fixed bottom-20 right-6 h-14 w-14 rounded-md  p-4 z-50  border-none shadow-lg hover:shadow-xl transition-transform transform hover:scale-110 dark:from-gray-800 dark:to-gray-700"
        variant="card"
        onClick={() => setIsModalOpen(true)}
        aria-label="Log Out"
      >
        <DoorOpen className="w-7 h-7 text-black" />
      </Button>

      {/* Logout Confirmation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle> Are you sure you want to log out?</DialogTitle>
          </DialogHeader>
          <DialogDescription></DialogDescription>
          <DialogFooter>
            <Button
              variant="card"
              className="rounded-md"
              onClick={handleSignOut}
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileNavBar;
