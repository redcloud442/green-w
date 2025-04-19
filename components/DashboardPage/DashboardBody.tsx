"use client";

import { logError } from "@/services/Error/ErrorLogs";
import { getUserEarnings } from "@/services/User/User";
import { usePackageChartData } from "@/store/usePackageChartData";
import { usePromoPackageStore } from "@/store/usePromoPackageStore";
import { useUserDashboardEarningsStore } from "@/store/useUserDashboardEarnings";
import { useUserEarningsStore } from "@/store/useUserEarningsStore";
import { useRole } from "@/utils/context/roleContext";
import { createClientSide } from "@/utils/supabase/client";
import { package_table } from "@prisma/client";
import { Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TransactionHistoryTable from "../TransactionHistoryPage/TransactionHistoryTable";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CardAmount from "../ui/cardAmount";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

import DashboardDepositModalDeposit from "./DashboardDepositRequest/DashboardDepositModal/DashboardDepositModalDeposit";
import DashboardDepositModalPackages from "./DashboardDepositRequest/DashboardDepositModal/DashboardDepositPackagesModal";
import DashboardMissionModal from "./DashboardMissionModal/DashboardMissionModal";
import DashboardPackages from "./DashboardPackages";
import DashboardWithdrawModalWithdraw from "./DashboardWithdrawRequest/DashboardWithdrawModal/DashboardWithdrawModalWithdraw";

type DashboardBodyProps = {
  packages: package_table[];
  promoPackages: package_table[];
};

const DashboardBody = ({ packages, promoPackages }: DashboardBodyProps) => {
  const supabaseClient = createClientSide();
  const router = useRouter();
  const { teamMemberProfile, profile } = useRole();
  const { chartData } = usePackageChartData();
  const { totalEarnings, setTotalEarnings } = useUserDashboardEarningsStore();
  const { earnings, setEarnings } = useUserEarningsStore();
  const { setPromoPackage } = usePromoPackageStore();

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
        totalIncomeTag: totalEarnings.totalIncomeTag ?? [],
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

  return (
    <div
      className="w-full px-2 space-y-4
   md:px-10"
    >
      <div className="flex flex-col gap-4 justify-center items-center pt-14 sm:pt-24 ">
        <CardAmount
          title="Wallet Balance"
          packages={promoPackages}
          setIsActive={setIsActive}
          active={isActive}
          handleClick={handleRefresh}
          setOpen={setPromoPackage}
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
                  <p className="text-sm sm:text-2xl font-thin">Total Income</p>
                  <Popover>
                    <PopoverTrigger>
                      <Info className="w-3 h-3 sm:w-5 sm:h-5 text-white bg-violet-600 rounded-full " />
                    </PopoverTrigger>
                    <PopoverContent>
                      Ito ang kabuuang withdrawal balance mula sa iyong income
                      sa package income, referral income at network income.
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
                      Ito ang kabuuang kita na na naiwithdraw at nareceive mo na
                      dito sa ELEVATE.
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
                      Ito ang kabuuang kita mula sa 10% na REFERRAL INCOME kapag
                      ikaw ay nakapagpasok ng bagong mag aavail ng package dito
                      sa ELEVATE.
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
                      Ito ang kabuuang kita mula sa grupo na mabubuo mo dito sa
                      elevate mula 2nd level hanggang 10th level.
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
            3
            <Separator className="text-white" />
            {/* <CompanyAllotedFunds /> */}
          </CardContent>
        </Card>
      </div>
      {teamMemberProfile.alliance_member_role === "CLIENT" && (
        <Button
          onClick={() => router.push("/client")}
          variant="card"
          className="w-full rounded-md"
        >
          Client Monitoing
        </Button>
      )}
      <div
        className={`grid grid-cols-3  gap-4 bg-white p-4 rounded-lg shadow-md items-end justify-end ${
          isActive ? "sm:grid-cols-6" : "sm:grid-cols-5"
        }`}
      >
        {/* <div className="flex flex-col items-center">
          <DashboardPromoPackage
            teamMemberProfile={teamMemberProfile}
            className="w-full"
            active={isActive}
            packages={promoPackages}
            setIsActive={setIsActive}
          />
        </div> */}

        <div className="flex flex-col items-center">
          <DashboardDepositModalDeposit
            teamMemberProfile={teamMemberProfile}
            className="w-full"
          />
        </div>

        {/* WITHDRAW */}
        <div className="flex flex-col items-center">
          <DashboardWithdrawModalWithdraw
            teamMemberProfile={teamMemberProfile}
            earnings={earnings}
            profile={profile}
          />
        </div>

        {/* PACKAGES */}
        <div className="flex flex-col items-center">
          <DashboardDepositModalPackages
            packages={packages}
            setIsActive={setIsActive}
            teamMemberProfile={teamMemberProfile}
            className="w-full"
            active={isActive}
          />
        </div>

        <Link
          href="/referral"
          className="flex flex-col items-center cursor-pointer mt-2"
        >
          <Image
            src="/assets/referral.ico"
            alt="referral"
            width={35}
            height={35}
          />
          <p className="text-sm sm:text-lg font-thin mt-2">REFERRAL</p>
        </Link>

        {/* NETWORK (Bottom Left) */}
        <Link
          href="/network"
          className="flex flex-col items-center cursor-pointer mt-2"
        >
          <Image
            src="/assets/network.ico"
            alt="network"
            width={35}
            height={35}
          />
          <p className="text-sm sm:text-lg font-thin mt-2">NETWORK</p>
        </Link>
        {isActive && (
          <div className="flex flex-col items-center">
            <DashboardMissionModal />
          </div>
        )}
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
  );
};

export default DashboardBody;
