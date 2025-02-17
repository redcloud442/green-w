import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  handleGetMission,
  handlePostClaimMission,
} from "@/services/mission/Member";
import { usePackageChartData } from "@/store/usePackageChartData";
import { MissionData } from "@/utils/types";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  className?: string;
};

const DashboardMissionModal = ({ className }: Props) => {
  const [open, setOpen] = useState(false);
  const [mission, setMission] = useState<MissionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { addChartData } = usePackageChartData();

  useEffect(() => {
    const checkMissionCompletion = async () => {
      try {
        setIsLoading(true);
        const hasOpenedModal = localStorage.getItem("hasOpenedMissionModal");

        if (hasOpenedModal === "false") {
          setOpen(true);
        }

        if (!open) return;

        const mission = await handleGetMission();
        setMission(mission);
      } catch (error) {
        console.error("Error fetching mission:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMissionCompletion();
  }, [open]);

  const handleClaimMission = async () => {
    try {
      setIsClaiming(true);
      const response = await handlePostClaimMission();

      setMission(response.missionData);

      addChartData({
        package: "Peak",
        completion: 0,
        completion_date:
          String(response.packageData.package_member_completion_date) || "",
        amount: Number(response.packageData.package_member_amount),
        is_ready_to_claim: false,
        package_connection_id:
          response.packageData.package_member_connection_id,
        profit_amount: Number(response.packageData.package_amount_earnings),
        package_color: response.packageData.package_color || "",
        package_date_created:
          String(response.packageData.package_member_connection_created) || "",
        is_notified: false,
        package_member_id: response.packageData.package_member_member_id,
        package_days: Number(response.packageData.package_member_status || 0),
        current_amount: Number(response.packageData.package_member_amount),
        currentPercentage: 0,
      });

      setIsClaiming(false);
      setOpen(false);
      toast({
        title: "Mission Claimed",
        description: "You have successfully claimed the mission",
      });
    } catch (error) {
      console.error("Error claiming mission:", error);
      setIsClaiming(false);
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (open) {
      localStorage.setItem("hasOpenedMissionModal", "true");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={className}>
        <Button
          className="p-0 bg-transparent shadow-none h-full flex flex-col items-center justify-center"
          onClick={() => setOpen(true)}
        >
          <Image src="/assets/mission.ico" alt="plans" width={35} height={35} />
          <p className="text-sm sm:text-lg font-thin">MISSION</p>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        {mission && mission.allMissionCompleted ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Image
              src="/app-logo.png"
              alt="mission-completed"
              width={100}
              height={100}
            />
            <p className="text-lg font-bold">Mission Completed</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] sm:h-full p-4">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl sm:text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="w-full h-10" />
                ) : (
                  <>
                    Mission {mission?.mission_order}: {mission?.mission_name}
                  </>
                )}
              </DialogTitle>
              <Separator className="my-2" />
              <DialogDescription className="text-center text-sm text-gray-600">
                Kumpletuhin ang mga sumusunod na gawain upang makuha ang
                gantimpala!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="w-full h-16" />
                  <Skeleton className="w-full h-16" />
                  <Skeleton className="w-full h-16" />
                  <Skeleton className="w-full h-16" />
                  <Skeleton className="w-full h-16" />
                </div>
              ) : mission?.tasks && mission.tasks.length > 0 ? (
                mission.tasks.map((task) => {
                  const isCompleted = task.is_completed;

                  return (
                    <div key={task.task_id} className="space-y-2">
                      <Separator className="bg-gray-300" />
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold flex items-center">
                          <span className="mr-2">•</span> {/* Bullet point */}
                          {task.task_name}
                        </p>
                        {isCompleted ? (
                          <span className="text-green-600 font-bold">✔</span>
                        ) : (
                          <span className="text-gray-400 font-bold">•</span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500">
                        {task.progress}/{task.task_target} completed
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500">No tasks available.</p>
              )}
            </div>

            {!mission?.allMissionCompleted && (
              <>
                <div className="mt-6 text-center">
                  <p className="text-lg font-bold">
                    Reward: {mission?.reward} Pesos Peak Package
                  </p>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    variant={"card"}
                    disabled={!mission?.isMissionCompleted || isClaiming}
                    onClick={handleClaimMission}
                    className="w-full rounded-md"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Claiming...
                      </>
                    ) : mission?.isMissionCompleted ? (
                      "Claim Reward"
                    ) : (
                      "Complete All Tasks to Claim"
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DashboardMissionModal;
