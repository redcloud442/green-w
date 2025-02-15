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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useEffect, useState } from "react";

type MissionTask = {
  task_id: string;
  name: string;
  target: number;
  progress: number;
};

type Props = {
  className?: string;
};

const mission1Tasks: MissionTask[] = [
  {
    task_id: "1",
    name: "Mag-refer ng 3 tao upang sumali sa Elevate at mag-avail ng package",
    target: 3,
    progress: 2,
  },
  {
    task_id: "2",
    name: "Mag-avail ng package na may minimum na 300 pesos sa iyong account",
    target: 1,
    progress: 1,
  },
  { task_id: "3", name: "Dapat makuha ang Iron Badge", target: 1, progress: 0 },
  {
    task_id: "4",
    name: "Mag-withdraw mula sa Package, Referral, o Network Income",
    target: 1,
    progress: 1,
  },
];

const DashboardMissionModal = ({ className }: Props) => {
  const [open, setOpen] = useState(false);

  const isMissionCompleted = mission1Tasks.every(
    (task) => task.progress >= task.target
  );

  useEffect(() => {
    const checkMissionCompletion = async () => {
      try {
      } catch (error) {
        console.error("Error checking mission completion:", error);
      }
    };
    checkMissionCompletion();
  }, []);

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
              Mission 1: Ang Simula ng Pag-Asenso
            </DialogTitle>
            <Separator className="my-2" />
            <DialogDescription className="text-center text-sm text-gray-600">
              Kumpletuhin ang mga sumusunod na gawain upang makuha ang
              gantimpala!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {mission1Tasks.map((task) => (
              <div key={task.task_id} className="space-y-2">
                <p className="text-sm font-semibold">{task.name}</p>
                <Progress value={(task.progress / task.target) * 100} />
                <p className="text-xs text-gray-500">
                  {task.progress}/{task.target} completed
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-lg font-bold">
              🎁 Reward: 50 Pesos Peak Package
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button disabled={!isMissionCompleted} className="w-full">
              {isMissionCompleted
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
