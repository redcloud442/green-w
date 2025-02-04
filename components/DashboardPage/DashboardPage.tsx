"use client";

import { toast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import { getUserEarnings } from "@/services/User/User";
import { useUserLoadingStore } from "@/store/useLoadingState";
import { usePackageChartData } from "@/store/usePackageChartData";
import { useUserDashboardEarningsStore } from "@/store/useUserDashboardEarnings";
import { useUserEarningsStore } from "@/store/useUserEarningsStore";
import { createClientSide } from "@/utils/supabase/client";
import {
  alliance_member_table,
  alliance_referral_link_table,
  package_table,
  user_table,
} from "@prisma/client";
import { Info } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TransactionHistoryTable from "../TransactionHistoryPage/TransactionHistoryTable";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CardAmount from "../ui/cardAmount";
import NavigationLoader from "../ui/NavigationLoader";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import DashboardDepositModalDeposit from "./DashboardDepositRequest/DashboardDepositModal/DashboardDepositModalDeposit";
import DashboardDepositModalPackages from "./DashboardDepositRequest/DashboardDepositModal/DashboardDepositPackagesModal";
import DashboardGenerateQrCode from "./DashboardDepositRequest/DashboardDepositModal/DashboardGenerateQrCode";
import DashboardPackages from "./DashboardPackages";
import DashboardWithdrawModalWithdraw from "./DashboardWithdrawRequest/DashboardWithdrawModal/DashboardWithdrawModalWithdraw";
import NewlyRegisteredModal from "./NewlyRegisteredModal/NewlyRegisteredModal";

type Props = {
  teamMemberProfile: alliance_member_table;
  referal: alliance_referral_link_table;
  packages: package_table[];
  profile: user_table;
  sponsor: string;
};

const DashboardPage = ({
  teamMemberProfile,
  packages,
  profile,
  referal,
}: Props) => {
  const supabaseClient = createClientSide();
  const router = useRouter();
  const { earnings, setEarnings } = useUserEarningsStore();
  const { totalEarnings, setTotalEarnings } = useUserDashboardEarningsStore();
  const { chartData } = usePackageChartData();
  const { loading } = useUserLoadingStore();
  const [open, setOpen] = useState(false);

  const [isActive, setIsActive] = useState(
    teamMemberProfile.alliance_member_is_active
  );
  const [refresh, setRefresh] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefresh(true);

      const { totalEarnings, userEarningsData } = await getUserEarnings({
        memberId: teamMemberProfile.alliance_member_id,
      });

      if (!totalEarnings || !userEarningsData) return;

      setTotalEarnings({
        ...totalEarnings,
        directReferralAmount: Number(totalEarnings.directReferralAmount ?? 0),
        indirectReferralAmount: Number(
          totalEarnings.indirectReferralAmount ?? 0
        ),

        totalEarnings: Number(totalEarnings.totalEarnings ?? 0),
        withdrawalAmount: Number(totalEarnings.withdrawalAmount ?? 0),
        directReferralCount: 0,
        indirectReferralCount: 0,
        package_income: Number(totalEarnings.package_income ?? 0),
        rank: totalEarnings.rank ?? "",
        tags: totalEarnings.tags ?? [],
      });

      setEarnings(userEarningsData);
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

  if (loading) return <NavigationLoader visible={loading} />;

  return (
    <div className="relative min-h-screen mx-auto space-y-4 py-2 sm:px-0 mt-20 sm:mt-20 sm:mb-20 overflow-x-hidden">
      <div
        className={`flex flex-row fixed sm:fixed w-full sm:min-w-fit sm:max-w-lg justify-between px-1 bg-cardColor/90 py-2 sm:px-2 items-center top-0 sm:top-2 sm:bg-cardColor sm:rounded-tr-lg sm:rounded-br-lg z-50 ${
          totalEarnings?.rank
            ? "sm:py-0 sm:rounded-tr-lg sm:rounded-br-lg"
            : "sm:py-2 sm:rounded-tr-lg sm:rounded-br-lg"
        }`}
      >
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
                <p className="text-[10px] sm:text-xs italic text-black">
                  Referral:{" "}
                </p>
                <p className="text-[10px] sm:text-xs truncate bg-indigo-400 text-white rounded-xl px-1 max-w-[150px] sm:max-w-[250px]">
                  {referal.alliance_referral_link}
                </p>

                <Badge
                  onClick={() => handleCopy(referal.alliance_referral_link)}
                  className="h-4 sm:h-5 bg-sky-400 text-[9px] sm:text-xs text-white cursor-pointer rounded-sm px-2"
                >
                  Copy
                </Badge>
                <DashboardGenerateQrCode url={referal.alliance_referral_link} />
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        {totalEarnings?.rank && (
          <div className="relative">
            {/* Background Image */}
            <Image
              src={`/ranking/${totalEarnings?.rank}.png`}
              alt="ranking"
              width={800}
              height={800}
              quality={100}
              className="w-20 h-20 object-contain"
            />

            {/* Overlay Content */}
            <div className="absolute left-10 sm:left-14 bottom-10 inset-0 flex items-center justify-center">
              <Popover>
                <PopoverTrigger>
                  <Info className="w-3 h-3 sm:w-5 sm:h-5 text-white bg-violet-600 rounded-full cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent>
                  By Referrals
                  <br />
                  Iron - 3 referrals
                  <br />
                  Bronze - 6 referrals
                  <br />
                  Silver - 10 referrals
                  <br />
                  Gold - 20 referrals
                  <br />
                  Platinum - 50 referrals
                  <br />
                  Emerald - 100 referrals
                  <br />
                  Ruby - 150 referrals
                  <br />
                  Sapphire - 200 referrals
                  <br />
                  Diamond -500 referrals
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
      <NewlyRegisteredModal isActive={isActive} setOpen={setOpen} />
      <div
        className="w-full px-2 space-y-4
       md:px-10"
      >
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

          <Card className="relative w-full bg-opacity-70 shadow-2xl rounded-2xl mx-auto m-2 ">
            <Image
              src="/logo.png"
              alt="dashboard"
              layout="fill"
              quality={100}
              style={{
                objectFit: "cover",
              }}
              className="absolute top-0 left-0 -z-10 w-40 h-40"
            />
            <CardHeader className="p-1">
              <CardTitle></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-1">
              <div className="flex flex-row justify-between md:justify-between items-start md:items-center md:px-32  gap-2">
                {/* Total Income Section */}
                <div className="relative flex flex-col bg-gray-200/50 p-2 rounded-xl justify-start items-start w-full sm:w-auto">
                  <div className="flex flex-row justify-between items-center gap-1">
                    <p className="text-sm sm:text-2xl font-thin">
                      Total Income
                    </p>
                    <Popover>
                      <PopoverTrigger>
                        <Info className="w-3 h-3 sm:w-5 sm:h-5 text-white bg-violet-600 rounded-full " />
                      </PopoverTrigger>
                      <PopoverContent>
                        Ito ang kabuuang withdrawal balance mula sa iyong
                        income sa package income, referral income at network
                        income.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-xl sm:text-3xl font-extrabold">
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

                {/* Total Withdrawal Section */}
                <div className="relative flex flex-col bg-gray-200/50 p-2 rounded-xl justify-start items-start w-full sm:w-auto">
                  <div className="flex flex-row justify-between items-center gap-1">
                    <p className="text-sm sm:text-xl font-thin">
                      Total Withdrawal
                    </p>
                    <Popover>
                      <PopoverTrigger>
                        <Info className="w-3 h-3 sm:w-5 sm:h-5 text-white bg-violet-600 rounded-full " />
                      </PopoverTrigger>
                      <PopoverContent>
                        Ito ang kabuuang kita na na naiwithdraw at nareceive mo
                        na dito sa ELEVATE.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-xl sm:text-3xl font-extrabold">
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
              {/* test */}
              <div className="flex flex-row  sm:flex-row justify-evenly gap-1 sm:gap-8  sm:px-6">
                {/* Package Income */}
                <div className="relative bg-gray-200/50 p-2 rounded-xl flex flex-col justify-start items-start">
                  <div className="flex flex-row justify-between items-center gap-1">
                    <p className="text-[10px] w-full sm:text-lg font-light">
                      Package Income
                    </p>
                    <Popover>
                      <PopoverTrigger>
                        <Info className="w-3 h-3 sm:w-5 sm:h-5 text-white bg-violet-600 rounded-full " />
                      </PopoverTrigger>
                      <PopoverContent>
                        Ito ang kabuuang kita mula sa packages na nagmature at
                        naiwithdraw na dito sa ELEVATE.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm sm:text-lg font-bold">
                    {refresh ? (
                      <Skeleton className="h-5 sm:h-8 w-[80px] sm:w-[200px]" />
                    ) : (
                      "₱ " +
                      (totalEarnings?.package_income.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) ?? 0)
                    )}
                  </p>
                </div>

                {/* Referral Income */}
                <div className="relative bg-gray-200/50 p-2 rounded-xl flex flex-col justify-start items-start">
                  <div className="flex flex-row justify-between items-center gap-1">
                    <p className="text-[10px] w-full sm:text-lg font-light">
                      Referral Income
                    </p>

                    <Popover>
                      <PopoverTrigger>
                        <Info className="w-3 h-3 sm:w-5 sm:h-5 text-white bg-violet-600 rounded-full " />
                      </PopoverTrigger>
                      <PopoverContent>
                        Ito ang kabuuang kita mula sa 10% na REFERRAL INCOME
                        kapag ikaw ay nakapagpasok ng bagong mag aavail ng
                        package dito sa ELEVATE.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm sm:text-lg font-bold">
                    {refresh ? (
                      <Skeleton className="h-5 sm:h-8 w-[80px] sm:w-[200px]" />
                    ) : (
                      "₱ " +
                      (totalEarnings?.directReferralAmount.toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      ) ?? 0)
                    )}
                  </p>
                </div>

                {/* Network Income */}
                <div className="relative bg-gray-200/50 p-2 rounded-xl flex flex-col justify-start items-start">
                  <div className="flex flex-row justify-between items-center gap-1">
                    <p className="text-[10px]  w-full sm:text-lg font-light">
                      Network Income
                    </p>

                    <Popover>
                      <PopoverTrigger>
                        <Info className="w-3 h-3 sm:w-5 sm:h-5 text-white bg-violet-600 rounded-full " />
                      </PopoverTrigger>
                      <PopoverContent>
                        Ito ang kabuuang kita mula sa grupo na mabubuo mo dito
                        sa elevate mula 2nd level hanggang 10th level.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm sm:text-lg font-bold">
                    {refresh ? (
                      <Skeleton className="h-5 sm:h-8 w-[80px] sm:w-[200px]" />
                    ) : (
                      "₱ " +
                      (totalEarnings?.indirectReferralAmount.toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      ) ?? 0)
                    )}
                  </p>
                </div>
              </div>

              <Separator className="text-white" />

              <div className="flex justify-center  gap-2">
                <div className="flex flex-col bg-gray-200/50 p-2 rounded-xl text-center">
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

        <div className="flex justify-around items-center bg-white rounded-2xl shadow-2xl gap-4 border-2 h-auto pt-2 overflow-y-hidden">
          {/* Deposit Modal */}
          <div className="flex-shrink-0 relative ">
            <DashboardDepositModalDeposit
              teamMemberProfile={teamMemberProfile}
              className="w-full"
            />
          </div>

          {/* Withdraw Modal */}
          <div className="flex-shrink-0 relative ">
            <DashboardWithdrawModalWithdraw
              teamMemberProfile={teamMemberProfile}
              earnings={earnings}
              profile={profile}
            />
          </div>

          {/* Packages */}
          <div className="flex-shrink-0 relative ">
            <DashboardDepositModalPackages
              packages={packages}
              setIsActive={setIsActive}
              teamMemberProfile={teamMemberProfile}
              className="w-full"
              open={open}
              setOpen={setOpen}
              active={isActive}
            />
          </div>

          {/* Direct Referrals */}
          <div
            onClick={() => router.push("/referral")}
            className="flex-shrink-0 relative gap-2 flex flex-col items-center cursor-pointer"
          >
            <Image
              src="/assets/referral.ico"
              alt="plans"
              width={35}
              height={35}
            />
            <p className="text-sm sm:text-lg font-thin">REFERRAL</p>
          </div>

          {/* Indirect Referrals */}
          <div
            onClick={() => router.push("/network")}
            className="flex-shrink-0 relative gap-2  flex flex-col items-center cursor-pointer"
          >
            <Image
              src="/assets/network.ico"
              alt="plans"
              width={35}
              height={35}
            />
            <p className="text-sm sm:text-lg font-thin ">NETWORK</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className=" gap-4">
            <p className="text-xl text-white sm:text-2xl font-thin">
              My Current Package
            </p>
            <DashboardPackages
              teamMemberProfile={teamMemberProfile}
              chartData={chartData}
            />
          </div>
        )}
        <TransactionHistoryTable teamMemberProfile={teamMemberProfile} />
      </div>
    </div>
  );
};

export default DashboardPage;
