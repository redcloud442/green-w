"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ClaimPackageHandler } from "@/services/Package/Member";
import { usePackageChartData } from "@/store/usePackageChartData";
import { useUserTransactionHistoryStore } from "@/store/userTransactionHistoryStore";
import { useUserDashboardEarningsStore } from "@/store/useUserDashboardEarnings";
import { useUserEarningsStore } from "@/store/useUserEarningsStore";
import { formatMonthDateYear, formatTime } from "@/utils/function";
import { ChartDataMember } from "@/utils/types";
import { alliance_member_table } from "@prisma/client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

type Props = {
  chartData: ChartDataMember[];
  teamMemberProfile: alliance_member_table;
};

const DashboardPackages = ({ chartData, teamMemberProfile }: Props) => {
  const { toast } = useToast();
  const { setChartData } = usePackageChartData();
  const { earnings, setEarnings } = useUserEarningsStore();
  const { totalEarnings, setTotalEarnings } = useUserDashboardEarningsStore();
  const [openDialogId, setOpenDialogId] = useState<string | null>(null); // Track which dialog is open
  const [isLoading, setIsLoading] = useState<string | null>(null); // Track loading state for specific packages
  const { setAddTransactionHistory } = useUserTransactionHistoryStore();
  const [liveData, setLiveData] = useState(() => {
    return chartData.map((data) => ({
      ...data,
      currentPercentage: data.completion,
      current_amount: data.current_amount,
    }));
  });

  useEffect(() => {
    const animationFrames: { [key: string]: number } = {};

    chartData.forEach((data: ChartDataMember, index: number) => {
      const startPercentage = data.completion;
      const finalAmount = data.amount + data.profit_amount;
      const startTime = performance.now();

      const baseDuration =
        new Date(data.completion_date).getTime() - new Date().getTime();

      const animateProgress = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / baseDuration, 1);

        const newPercentage =
          startPercentage + (100 - startPercentage) * progress;
        const newAmount =
          data.current_amount + (finalAmount - data.current_amount) * progress;

        const currentPercentage = newPercentage.toFixed(2);

        setLiveData((prev: ChartDataMember[]) => {
          const updated = [...prev];
          updated[index] = {
            ...data,
            currentPercentage: Number(currentPercentage),
            current_amount: newAmount,
            is_ready_to_claim: percentage === 100,
          };
          return updated;
        });

        if (progress < 1) {
          animationFrames[data.package_connection_id] =
            requestAnimationFrame(animateProgress);
        }
      };

      animationFrames[data.package_connection_id] =
        requestAnimationFrame(animateProgress);
    });

    return () => {
      Object.values(animationFrames).forEach(cancelAnimationFrame);
    };
  }, [chartData]);

  const handleClaimPackage = async (packageData: ChartDataMember) => {
    const { amount, profit_amount, package_connection_id } = packageData;

    try {
      setIsLoading(package_connection_id);
      const response = await ClaimPackageHandler({
        packageConnectionId: package_connection_id,
        amount,
        earnings: profit_amount,
      });

      if (response.ok) {
        const transactionHistory = {
          transaction_id: uuidv4(),
          transaction_date: new Date(),
          transaction_description: `Package Claimed ${packageData.package}`,
          transaction_amount: Number(profit_amount + amount),
          transaction_member_id: teamMemberProfile?.alliance_member_id,
        };

        setAddTransactionHistory([transactionHistory]);

        toast({
          title: "Package claimed successfully",
          description: "You have successfully claimed the package",
          variant: "success",
        });

        setChartData(
          chartData.filter(
            (data) => data.package_connection_id !== package_connection_id
          )
        );

        setLiveData(
          liveData.filter(
            (data) => data.package_connection_id !== package_connection_id
          )
        );

        const newEarnings = amount + profit_amount;

        setEarnings({
          ...earnings,
          alliance_olympus_earnings:
            earnings.alliance_olympus_earnings + newEarnings,
          alliance_combined_earnings:
            earnings.alliance_combined_earnings + newEarnings,
        });
        // Update total earnings
        setTotalEarnings({
          ...totalEarnings!,
          totalEarnings: totalEarnings!.totalEarnings + newEarnings,
          package_income: totalEarnings!.package_income + newEarnings,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to claim package",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null); // Clear loading state
    }
  };

  return (
    <ScrollArea className="w-full pb-0">
      <div className="flex grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
        {liveData.map((data) => (
          <Card
            key={data.package_connection_id}
            className="min-w-[260px] max-w-[500px] h-auto dark:bg-cardColor transition-all duration-300 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <Image
              src={data.package_color}
              alt="package background"
              layout="fill" // Ensures the image covers the entire card
              objectFit="cover" // Ensures the image scales properly
              objectPosition="center" // Centers the image
              className="absolute inset-0 z-0"
            />
            <div className="bg-black bg-opacity-50 absolute inset-0 z-0" />{" "}
            {/* Overlay for better text visibility */}
            <CardHeader className="py-4 relative z-10">
              <CardTitle className="flex justify-center items-end">
                <div className="text-2xl text-white font-extrabold rounded-full shadow-2xl">
                  {data.package} PACKAGE
                </div>
              </CardTitle>
              <CardDescription className="space-y-2 pb-2">
                <div className="flex flex-col items-start">
                  <span className="text-md font-extrabold text-white">
                    Date Availed:{" "}
                    {formatMonthDateYear(data.package_date_created)}
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    Time Availed: {formatTime(data.package_date_created)}
                  </span>
                </div>
              </CardDescription>

              <Separator />
              <div className="flex flex-col items-start">
                <span className="text-sm font-extrabold text-white">
                  Date of Claim: {formatMonthDateYear(data.completion_date)}
                </span>
              </div>
              <Separator />
            </CardHeader>
            <CardContent className="space-y-4 pt-0 pb-2 relative z-10">
              <div className="flex flex-col items-start">
                <span className="text-sm font-extrabold text-white">
                  Time of Claim: {formatTime(data.completion_date)}
                </span>
                <span className="text-sm font-extrabold text-white">
                  Amount Deposited: ₱{" "}
                  {data.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex flex-col items-center bg-white rounded-xl p-2">
                <span className="text-sm font-extrabold text-black">
                  Accumulating Income
                </span>
                ₱{" "}
                {data.current_amount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>

              <div className="flex flex-col items-center bg-white rounded-xl p-2">
                <span className="text-sm font-extrabold text-black">
                  Total Generated Income
                </span>
                ₱{" "}
                {(data.profit_amount + data.amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm relative z-10">
              {data.is_ready_to_claim && (
                <Dialog
                  open={openDialogId === data.package_connection_id}
                  onOpenChange={(isOpen) =>
                    setOpenDialogId(isOpen ? data.package_connection_id : null)
                  }
                >
                  <DialogDescription></DialogDescription>
                  <DialogTrigger asChild>
                    <Button className="dark:bg-black dark:text-white dark:hover:bg-black hover:bg-black hover:text-white bg-white text-black cursor-pointer rounded-lg w-full px-10 py-2">
                      CLICK HERE TO CLAIM
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-bold mb-4">
                        Claim Package
                      </DialogTitle>
                      Are you sure you want to claim this package?
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        disabled={isLoading === data.package_connection_id}
                        onClick={() => handleClaimPackage(data)}
                        className="w-full"
                        variant="card"
                      >
                        {isLoading === data.package_connection_id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {"Claiming ..."}
                          </>
                        ) : (
                          "Claim"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default DashboardPackages;
