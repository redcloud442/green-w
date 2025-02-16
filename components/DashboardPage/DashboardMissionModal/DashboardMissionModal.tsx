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
import { toast } from "@/hooks/use-toast";
import {
  handleGetMission,
  handlePostClaimMission,
} from "@/services/mission/Member";
import { usePackageChartData } from "@/store/usePackageChartData";
import { MissionData } from "@/utils/types";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  className?: string;
};

const DashboardMissionModal = ({ className }: Props) => {
  const [open, setOpen] = useState(false);
  const [mission, setMission] = useState<MissionData | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const { addChartData } = usePackageChartData();

  useEffect(() => {
    const checkMissionCompletion = async () => {
      try {
        const mission = await handleGetMission();

        setMission(mission);
      } catch (error) {}
    };
    checkMissionCompletion();
  }, [open]);

  const handlClaimMission = async () => {
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
      setIsClaiming(false);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={className}>
        <Button
          className="p-0 bg-transparent shadow-none h-full flex flex-col items-center justify-center"
          onClick={() => setOpen(true)}
        >
          <Image src="/assets/deposit.ico" alt="plans" width={35} height={35} />
          <p className="text-sm sm:text-lg font-thin">MISSION</p>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <ScrollArea className="h-[500px] sm:h-full p-4">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              {mission?.mission_name}
            </DialogTitle>
            <Separator className="my-2" />
            <DialogDescription className="text-center text-sm text-gray-600">
              Kumpletuhin ang mga sumusunod na gawain upang makuha ang
              gantimpala!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {mission?.tasks.map((task) => {
              const isCompleted = task.is_completed;

              return (
                <div key={task.task_id} className="space-y-2">
                  <Separator className="bg-gray-300" />
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold">{task.task_name}</p>
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
            })}
          </div>

          <div className="mt-6 text-center">
            <p className="text-lg font-bold">
              Reward: {mission?.reward} Pesos Peak Package
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant={"card"}
              disabled={!mission?.isMissionCompleted || isClaiming}
              onClick={handlClaimMission}
              className="w-full rounded-md"
            >
              {isClaiming
                ? "Claiming..."
                : mission?.isMissionCompleted
                  ? "Claim Reward"
                  : "Complete All Tasks to Claim"}
            </Button>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardMissionModal;
