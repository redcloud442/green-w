import NotificationTable from "@/components/NotificationTable/NotificationTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollBar } from "@/components/ui/scroll-area";
import { useUserNotificationStore } from "@/store/userNotificationStore";
import { alliance_member_table } from "@prisma/client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { BellIcon } from "lucide-react";
import { useState } from "react";

type Props = {
  teamMemberProfile: alliance_member_table | null;
};

const DashboardNotification = ({ teamMemberProfile }: Props) => {
  const [open, setOpen] = useState(false);
  const { userNotification } = useUserNotificationStore();

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="flex relative flex-col bg-transparent p-2 text-xs shadow-none sm:text-sm text-gray-600 font-normal bg-white rounded-full"
          onClick={() => setOpen(true)}
        >
          <BellIcon
            size={48}
            className="text-zinc-500 rounded-full text-2xl h-full w-full"
          />
          {userNotification.count > 0 && (
            <span className="absolute border-2 border-white -top-4 right-4 bg-red-500 text-white text-xs font-bold w-auto p-1 h-5 flex items-center justify-center rounded-full">
              {userNotification.count}
            </span>
          )}
          Notification
        </Button>
      </DialogTrigger>

      <DialogContent
        type="table"
        className="w-[400px] sm:w-[600px] dark:bg-cardColor border-none shadow-none overflow-auto"
      >
        <ScrollArea className="h-[500px] sm:h-full">
          <DialogTitle className="text-2xl font-bold mb-4">
            Notification
          </DialogTitle>
          <DialogDescription></DialogDescription>
          <NotificationTable teamMemberProfile={teamMemberProfile} />
          <DialogFooter className="flex justify-center"></DialogFooter>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardNotification;
