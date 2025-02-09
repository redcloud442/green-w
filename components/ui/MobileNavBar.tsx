"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { handleMemberChat } from "@/services/chat/Member";
import { getDashboard } from "@/services/Dasboard/Member";
import {
  handleFetchMemberNotification,
  handleUpdateMemberNotification,
} from "@/services/notification/member";
import { getUserEarnings, getUserWithdrawalToday } from "@/services/User/User";
import { useUserLoadingStore } from "@/store/useLoadingState";
import { usePackageChartData } from "@/store/usePackageChartData";
import { useUserHaveAlreadyWithdraw } from "@/store/userHaveAlreadyWithdraw";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { useUserDashboardEarningsStore } from "@/store/useUserDashboardEarnings";
import { useUserEarningsStore } from "@/store/useUserEarningsStore";
import { ROLE } from "@/utils/constant";
import { useRole } from "@/utils/context/roleContext";
import { createClientSide } from "@/utils/supabase/client";
import {
  BookOpenIcon,
  DoorOpen,
  HomeIcon,
  Phone,
  UserIcon,
} from "lucide-react";
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
  const [isChatSupportOpen, setIsChatSupportOpen] = useState(false);
  const [isChatSupportLoading, setIsChatSupportLoading] = useState(false);

  const { setUserNotification } = useUserNotificationStore();
  const { setEarnings } = useUserEarningsStore();
  const { setTotalEarnings } = useUserDashboardEarningsStore();
  const { setChartData } = usePackageChartData();
  const { setLoading } = useUserLoadingStore();
  const { setIsWithdrawalToday, setCanUserDeposit } =
    useUserHaveAlreadyWithdraw();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();

      // Clear all user-specific states
      setUserNotification({ notifications: [], count: 0 });
      setEarnings({
        alliance_earnings_id: "",
        alliance_olympus_wallet: 0,
        alliance_olympus_earnings: 0,
        alliance_referral_bounty: 0,
        alliance_combined_earnings: 0,
        alliance_earnings_member_id: "",
      }); // Reset earnings
      setTotalEarnings(null); // Reset dashboard earnings
      setChartData([]); // Clear chart data
      setIsWithdrawalToday({
        referral: false,
        package: false,
      }); // Reset withdrawal status

      setLoading(false); // Reset loading state
    } catch (e) {
    } finally {
      setIsModalOpen(false);
      router.push("/auth/login");
    }
  };

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: <HomeIcon className="w-6 h-6" />,
    },
    {
      href: "/notification",
      label: "Notification",
      icon: <></>,
    },
    {
      href: "https://www.facebook.com/groups/elevateexecutivecommunity",
      label: "Facebook Group",
      icon: <HomeIcon className="w-6 h-6" />,
    },
    {
      href: "/tools-and-guides",
      label: "Tools & Guides",
      icon: <BookOpenIcon className="w-6 h-6" />,
    },

    {
      href: "/profile",
      label: "Profile",
      icon: <UserIcon className="w-6 h-6" />,
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

  const { role, teamMemberId } = useRole();

  useEffect(() => {
    const handleFetchUserInformation = async () => {
      try {
        if (!teamMemberId) return;
        setLoading(true);

        const [userEarningsData, isWithdrawalToday, data, notifications] =
          await Promise.all([
            getUserEarnings({
              memberId: teamMemberId,
            }),
            getUserWithdrawalToday(),

            getDashboard({
              teamMemberId: teamMemberId,
            }),
            handleFetchMemberNotification({
              take: 10,
              skip: 0,
              teamMemberId: teamMemberId,
            }),
          ]);

        setIsWithdrawalToday({
          referral: isWithdrawalToday.canWithdrawReferral,
          package: isWithdrawalToday.canWithdrawPackage,
        });
        setCanUserDeposit(isWithdrawalToday.canUserDeposit);
        setTotalEarnings(userEarningsData.totalEarnings);

        setEarnings(userEarningsData.userEarningsData);

        setUserNotification({
          notifications: notifications.notifications,
          count: notifications.count,
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

  const handleOnOpen = async () => {
    try {
      const data = await handleUpdateMemberNotification({
        teamMemberId: teamMemberId,
        take: 10,
      });

      setUserNotification({
        notifications: data,
        count: 0,
      });
    } catch (e) {}
  };

  const handleMemberChatSupport = async () => {
    try {
      setIsChatSupportLoading(true);
      const data = await handleMemberChat();

      if (data) {
        router.push("/chat-support");
      }

      setIsChatSupportOpen(false);
      setIsChatSupportLoading(false);
    } catch (e) {
    } finally {
      setIsChatSupportLoading(false);
    }
  };

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
                    "flex flex-col relative items-center font-medium hover:bg-transparent text-center p-0 w-min",
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
                <DashboardNotification
                  handleOpen={handleOnOpen}
                  teamMemberId={teamMemberId}
                />
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
      {pathname !== "/chat-support" && (
        <Button
          className="fixed bottom-20 right-6 h-14 w-14 rounded-md  p-4 z-50  border-none shadow-lg hover:shadow-xl transition-transform transform hover:scale-110 dark:from-gray-800 dark:to-gray-700"
          variant="card"
          onClick={() => setIsModalOpen(true)}
          aria-label="Log Out"
        >
          <DoorOpen className="w-7 h-7 text-black" />
        </Button>
      )}
      {/* fix logout */}

      {pathname !== "/chat-support" && role !== ROLE.MEMBER && (
        <Button
          className="fixed bottom-36 right-6 h-14 w-14 rounded-md  p-4 z-50  border-none shadow-lg hover:shadow-xl transition-transform transform hover:scale-110 dark:from-gray-800 dark:to-gray-700"
          variant="card"
          onClick={() => setIsChatSupportOpen(true)}
          aria-label="Chat Support"
        >
          <Phone className="w-7 h-7 text-black" />
        </Button>
      )}
      {role !== ROLE.MEMBER && (
        <Dialog open={isChatSupportOpen} onOpenChange={setIsChatSupportOpen}>
          <DialogContent className="z-50">
            <DialogHeader>
              <DialogTitle>
                {" "}
                Please select yes if you want to chat with support
              </DialogTitle>
              <DialogDescription>
                You will be redirected to the chat support queueing system and
                you will be able to chat with support. Do not close the page or
                refresh the page.
              </DialogDescription>
            </DialogHeader>
            <DialogDescription></DialogDescription>
            <DialogFooter>
              <Button
                disabled={isChatSupportLoading}
                variant="card"
                className="rounded-md w-full"
                onClick={handleMemberChatSupport}
              >
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
