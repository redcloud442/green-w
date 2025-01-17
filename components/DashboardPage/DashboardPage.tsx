"use client";

import { getUserEarnings } from "@/app/actions/user/userAction";
import { toast } from "@/hooks/use-toast";
import { getDashboard, getDashboardEarnings } from "@/services/Dasboard/Member";
import { logError } from "@/services/Error/ErrorLogs";
import { useRole } from "@/utils/context/roleContext";
import { createClientSide } from "@/utils/supabase/client";
import { ChartDataMember, DashboardEarnings } from "@/utils/types";
import {
  alliance_earnings_table,
  alliance_member_table,
  alliance_referral_link_table,
  package_table,
  user_table,
} from "@prisma/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { InfoIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TransactionHistoryTable from "../TransactionHistoryPage/TransactionHistoryTable";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CardAmount from "../ui/cardAmount";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import TableLoading from "../ui/tableLoading";
import DashboardDepositModalDeposit from "./DashboardDepositRequest/DashboardDepositModal/DashboardDepositModalDeposit";
import DashboardDepositModalPackages from "./DashboardDepositRequest/DashboardDepositModal/DashboardDepositPackagesModal";
import DashboardGenerateQrCode from "./DashboardDepositRequest/DashboardDepositModal/DashboardGenerateQrCode";
import DashboardPackages from "./DashboardPackages";
import DashboardWithdrawModalWithdraw from "./DashboardWithdrawRequest/DashboardWithdrawModal/DashboardWithdrawModalWithdraw";

type Props = {
  earnings: alliance_earnings_table;
  teamMemberProfile: alliance_member_table;
  referal: alliance_referral_link_table;
  packages: package_table[];
  profile: user_table;
  sponsor: string;
};

const DashboardPage = ({
  earnings: initialEarnings,
  teamMemberProfile,
  packages,
  profile,
  referal,
}: Props) => {
  const supabaseClient = createClientSide();
  const router = useRouter();
  const [chartData, setChartData] = useState<ChartDataMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [earnings, setEarnings] = useState<alliance_earnings_table | null>(
    initialEarnings
  );
  const [isActive, setIsActive] = useState(
    teamMemberProfile.alliance_member_is_active
  );
  const [refresh, setRefresh] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState<DashboardEarnings | null>(
    null
  );

  const { role } = useRole();

  const getDasboardEarningsData = async () => {
    try {
      const dashboardEarnings = await getDashboardEarnings(supabaseClient, {
        teamMemberId: teamMemberProfile.alliance_member_id,
      });

      setTotalEarnings(dashboardEarnings);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
        });
      }
    }
  };

  const getPackagesData = async () => {
    try {
      setIsLoading(true);
      const { data } = await getDashboard(supabaseClient, {
        teamMemberId: teamMemberProfile.alliance_member_id,
      });
      setChartData(data);

      await getDasboardEarningsData();

      // if (totalCompletedAmount !== 0) {
      //   setTotalEarnings((prev) => ({
      //     ...prev,
      //     totalEarnings:
      //       Number(prev?.totalEarnings) + Number(totalCompletedAmount),
      //   }));
      // }
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/DashboardPage/DashboardPage.tsx",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getPackagesData();
  }, [role]);

  const handleRefresh = async () => {
    try {
      setRefresh(true);
      const { totalEarnings, userEarningsData, userRanking } =
        await getUserEarnings({
          memberId: teamMemberProfile.alliance_member_id,
        });

      if (!totalEarnings || !userEarningsData) return;

      setTotalEarnings({
        directReferralAmount: totalEarnings.directReferralAmount ?? 0,
        indirectReferralAmount: totalEarnings.indirectReferralAmount ?? 0,
        totalEarnings: totalEarnings.totalEarnings ?? 0,
        withdrawalAmount: totalEarnings.withdrawalAmount ?? 0,
        directReferralCount: totalEarnings.directReferralCount ?? 0,
        indirectReferralCount: totalEarnings.indirectReferralCount ?? 0,
        package_income: totalEarnings.package_income ?? 0,
        rank: userRanking?.alliance_rank ?? "",
        tags: userRanking?.alliance_total_income_tag?.split(",") ?? [],
      });

      setEarnings((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          alliance_combined_earnings:
            userEarningsData.alliance_combined_earnings ??
            prev.alliance_combined_earnings,
          alliance_olympus_earnings:
            userEarningsData.alliance_olympus_earnings ??
            prev.alliance_olympus_earnings,
          alliance_olympus_wallet:
            userEarningsData.alliance_olympus_wallet ??
            prev.alliance_olympus_wallet,
          alliance_referral_bounty:
            userEarningsData.alliance_referral_bounty ??
            prev.alliance_referral_bounty,
        };
      });
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
        });
      }
    } finally {
      setRefresh(false);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Referral link copied to clipboard",
      variant: "success",
    });
  };

  return (
    <div className="relative min-h-screen mx-auto space-y-4 py-2 px-2 sm:px-0 mt-0 sm:mt-20 sm:mb-20 overflow-x-hidden">
      {isLoading && <TableLoading />}

      <div className="flex flex-row sm:fixed w-full sm:min-w-fit sm:max-w-lg justify-between px-0 py-4 sm:px-2 sm:py-0 items-center top-2 bg-transparent sm:bg-cardColor sm:rounded-tr-lg sm:rounded-br-lg z-50 ">
        {/* Profile Section */}
        <div className="flex gap-2 justify-center items-center">
          {/* Avatar */}
          <div className="flex items-center justify-center">
            <Avatar className="w-8 h-8 sm:w-12 sm:h-12">
              <AvatarImage src={profile.user_profile_picture ?? ""} />
              <AvatarFallback>
                {profile.user_first_name?.charAt(0).toUpperCase()}
                {profile.user_last_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info Section */}
          <div className="flex flex-col items-start gap-1">
            {/* Name and Badge */}
            <div className="flex flex-col">
              <div className="flex gap-2 items-center">
                <p className="text-[12px] sm:text-sm font-semibold">
                  {profile.user_first_name} {profile.user_last_name}
                </p>
                {totalEarnings?.tags &&
                  totalEarnings.tags.length > 0 &&
                  totalEarnings.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className="h-4 sm:h-5 text-[9px] sm:text-xs bg-green-500 text-white cursor-pointer rounded-sm px-2"
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>

            {isActive && (
              <div className="flex items-center gap-1 text-white sm:text-black">
                <p className="text-[10px] sm:text-xs italic">Referral: </p>
                <p className="text-[10px] sm:text-xs truncate bg-indigo-400 text-white rounded-xl px-1">
                  {referal.alliance_referral_link}
                </p>

                <Badge
                  onClick={() => handleCopy(referal.alliance_referral_link)}
                  className="h-4 sm:h-5 bg-sky-400 text-[9px] sm:text-xs text-white cursor-pointer rounded-sm px-2"
                >
                  Copy
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        {totalEarnings?.rank && (
          <Image
            src={`/ranking/${totalEarnings?.rank}.png`}
            alt="ranking"
            width={800}
            height={800}
            quality={100}
            className="w-20 h-20 object-contain "
          />
        )}
      </div>
      {isActive && (
        <DashboardGenerateQrCode url={referal.alliance_referral_link} />
      )}
      <div className="w-full space-y-4 md:px-10">
        <div className="flex flex-col gap-4 justify-center items-center ">
          <CardAmount
            title="Wallet Balance"
            handleClick={handleRefresh}
            refresh={refresh}
            value={
              Number(earnings?.alliance_combined_earnings ?? 0).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              ) as unknown as number
            }
            description=""
          />

          <Card className="w-full bg-opacity-70 shadow-2xl rounded-2xl mx-auto m-2">
            <CardHeader>
              <CardTitle></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between sm:justify-between px-0 sm:px-32">
                <div className="relative flex flex-col justify-start items-start">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="absolute -right-5 sm:-right-8 top-4 transform -translate-y-1/2">
                        <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-white text-black p-2 rounded-md shadow-lg">
                        <p>
                          Ito ang kabuuang kita sa package income, referral
                          income at network income mula ng magsimula ka dito sa
                          ELEVATE.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-xl sm:text-2xl font-thin">Total Income</p>
                  <p className="text-xl sm:text-2xl font-extrabold">
                    {refresh ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 sm:h-8 w-[100px] sm:w-[250px]" />
                      </div>
                    ) : (
                      "₱ " +
                      (totalEarnings?.totalEarnings.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) ?? 0)
                    )}
                  </p>
                </div>

                <div className="relative flex flex-col justify-start  items-start">
                  <p className="text-xl sm:text-2xl font-thin">
                    Total Withdrawal
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="absolute -right-5 -sm:right-8 top-4 transform -translate-y-1/2">
                        <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-white text-black p-2 rounded-md shadow-lg">
                        <p>
                          Ito ang kabuuang kita na na naiwithdraw at nareceive
                          mo na dito sa ELEVATE.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-xl sm:text-2xl font-extrabold">
                    {refresh ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 sm:h-8 w-[100px] sm:w-[250px]" />
                      </div>
                    ) : (
                      "₱ " +
                      (totalEarnings?.withdrawalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) ?? 0)
                    )}
                  </p>
                </div>
              </div>

              <Separator className="text-white" />

              <div className="flex flex-col  sm:flex-row  justify-evenly gap-2">
                <div className="relative flex flex-col justify-start  items-start">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="absolute -right-4 sm:-right-8  top-2 sm:top-4 transform -translate-y-1/2">
                        <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-white text-black p-2 rounded-md shadow-lg">
                        <p>
                          Ito ang kabuuang kita mula sa sa packages na nagmature
                          at naiwithdraw na dito sa ELEVATE.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-sm sm:text-lg font-thin">Package Income</p>
                  <p className="text-sm sm:text-lg font-bold">
                    {refresh ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 sm:h-8 w-[100px] sm:w-[250px]" />
                      </div>
                    ) : (
                      "₱ " +
                      (totalEarnings?.package_income.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) ?? 0)
                    )}
                  </p>
                </div>

                <div className="relative flex flex-col justify-start  items-start">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="absolute -right-4 sm:-right-8  top-2 sm:top-4 transform -translate-y-1/2">
                        <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-white text-black p-2 rounded-md shadow-lg">
                        <p>
                          Ito ang kabuuang kita mula sa 10% na REFERRAL INCOME
                          kapag ikaw ay nakapagpasok ng bagong mag aavail ng
                          package dito sa ELEVATE.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-sm sm:text-lg font-light">
                    Referral Income
                  </p>
                  <p className="text-sm sm:text-lg font-bold">
                    {refresh ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 sm:h-8 w-[100px] sm:w-[250px]" />
                      </div>
                    ) : (
                      "₱ " + (totalEarnings?.directReferralAmount ?? 0)
                    )}
                  </p>
                </div>

                <div className="relative flex flex-col justify-start  items-start">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="absolute -right-4 sm:-right-8  top-2 sm:top-4 transform -translate-y-1/2">
                        <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-white text-black p-2 rounded-md shadow-lg">
                        <p>
                          Ito ang kabuuang kita mula sa grupo na mabubuo mo dito
                          sa elevate mula 2nd level hanggang 10th level.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-sm sm:text-lg font-light">
                    Network Income
                  </p>
                  <p className="text-sm sm:text-lg font-bold">
                    {refresh ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 sm:h-8 w-[100px] sm:w-[250px]" />
                      </div>
                    ) : (
                      "₱ " + (totalEarnings?.indirectReferralAmount ?? 0)
                    )}
                  </p>
                </div>
              </div>

              <Separator className="text-white" />

              <div className="flex justify-center gap-2">
                <div className="flex flex-col text-center">
                  <p className="text-md sm:text-lg font-extralight">
                    DAILY INTEREST RATE
                  </p>
                  <p className="text-md sm:text-lg font-extrabold">
                    EARN 3.1 % UP TO 4.3 % PER DAY
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ScrollArea className="w-full h-32 overflow-y-hidden">
          <div className="flex justify-around items-center bg-white rounded-2xl shadow-2xl gap-4 border-2 h-32 overflow-y-hidden">
            {/* Deposit Modal */}
            <div className="flex-shrink-0 relative w-[200px]">
              <DashboardDepositModalDeposit
                teamMemberProfile={teamMemberProfile}
                className="w-full"
              />
            </div>

            {/* Withdraw Modal */}
            <div className="flex-shrink-0 relative w-[200px]">
              <DashboardWithdrawModalWithdraw
                teamMemberProfile={teamMemberProfile}
                earnings={earnings}
                setEarnings={setEarnings}
                profile={profile}
              />
            </div>

            {/* Packages */}
            <div className="flex-shrink-0 relative w-[200px]">
              <DashboardDepositModalPackages
                packages={packages}
                earnings={earnings}
                setEarnings={setEarnings}
                setChartData={setChartData}
                setIsActive={setIsActive}
                teamMemberProfile={teamMemberProfile}
                className="w-full"
              />
            </div>

            {/* Direct Referrals */}
            <div
              onClick={() => router.push("/referral")}
              className="flex-shrink-0 relative w-[200px] flex flex-col items-center cursor-pointer"
            >
              <Image
                src="/assets/referral.png"
                alt="referrals"
                width={200}
                height={200}
              />
              <p className="text-sm sm:text-lg font-thin absolute  bottom-1/4">
                REFERRAL
              </p>
            </div>

            {/* Indirect Referrals */}
            <div
              onClick={() => router.push("/network")}
              className="flex-shrink-0 relative w-[200px] flex flex-col items-center cursor-pointer"
            >
              <Image
                src="/assets/network.png"
                alt="network"
                width={200}
                height={200}
                style={{
                  objectFit: "cover",
                }}
              />
              <p className="text-sm sm:text-lg font-thin absolute bottom-1/4">
                NETWORK
              </p>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {chartData.length > 0 && (
          <div className=" gap-6">
            <p className="text-xl text-white sm:text-2xl font-thin">
              My Current Package
            </p>
            <DashboardPackages
              teamMemberProfile={teamMemberProfile}
              chartData={chartData}
              setChartData={setChartData}
              setEarnings={setEarnings}
              setTotalEarnings={setTotalEarnings}
            />
          </div>
        )}
        <TransactionHistoryTable teamMemberProfile={teamMemberProfile} />
      </div>
    </div>
  );
};

export default DashboardPage;
